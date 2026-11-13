'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { compareHash, errorCopy, ui, workbench } from '@/content';
import { executeOperation } from '@/data/cache';
import { isAppFailure, type AppError } from '@/domain';
import {
  apiMessageOf,
  RATE_LIMITED,
  ResultPanel,
  startCooldown,
  toneOf,
  UNKNOWN_ERROR,
  useCooling,
} from '@/features/workbench';
import {
  ActivityIndicator,
  Button,
  durations,
  GlassCard,
  InlineMessage,
  pageColumn,
  TextArea,
  useKeepFieldInView,
} from '@/ui';

type Outcome =
  | { kind: 'idle' }
  | { kind: 'running'; waking: boolean }
  | { kind: 'done'; a: string; b: string }
  | { kind: 'failed'; error: AppError };

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: durations.base },
};

/** Hashes two texts with SHA-256, side by side, and says whether they are the same. */
export function CompareHash() {
  const client = useQueryClient();
  const cooling = useCooling();
  const keepFieldInView = useKeepFieldInView();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });
  const current = useRef<AbortController | null>(null);
  useEffect(() => () => current.current?.abort(), []);

  // A verdict belongs to the texts it was given: editing either one drops it.
  const edit = (set: (text: string) => void) => (text: string) => {
    current.current?.abort();
    current.current = null;
    set(text);
    setOutcome({ kind: 'idle' });
  };

  const running = outcome.kind === 'running';

  const compare = async () => {
    if (running || cooling) return;
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    const isCurrent = () => current.current === controller;
    const opts = {
      signal: controller.signal,
      onWaking: () => {
        if (isCurrent()) setOutcome({ kind: 'running', waking: true });
      },
    };
    const hash = (input: string) =>
      executeOperation(client, { algorithmId: 'sha-256', operation: 'hash', input }, opts);

    setOutcome({ kind: 'running', waking: false });
    try {
      const [hashA, hashB] = await Promise.all([hash(a), hash(b)]);
      if (isCurrent()) setOutcome({ kind: 'done', a: hashA, b: hashB });
    } catch (e) {
      if (!isCurrent()) return;
      const error = isAppFailure(e) ? e.error : UNKNOWN_ERROR;
      if (error.kind === 'aborted') return;
      // One side failed: the verdict is lost, so the other request is not worth waiting for.
      controller.abort();
      if (error.kind === 'rateLimited') startCooldown(error.retryAfterSeconds);
      setOutcome({ kind: 'failed', error });
    } finally {
      if (isCurrent()) current.current = null;
    }
  };

  const same = outcome.kind === 'done' && outcome.a === outcome.b;
  const verdict =
    outcome.kind === 'done' ? (same ? compareHash.same : compareHash.different) : null;
  // A cooldown that outlives its message (or started on another screen) still says why.
  const error = outcome.kind === 'failed' ? outcome.error : cooling ? RATE_LIMITED : null;
  const failure = error ? errorCopy(error, 'hash') : null;
  const announcement = verdict ?? failure?.title ?? '';

  return (
    <div className={pageColumn} onFocus={keepFieldInView}>
      <h1 className="mt-1 text-large-title text-label">{compareHash.title}</h1>
      <p className="mt-3 max-w-prose text-body text-label-secondary">{compareHash.description}</p>

      <div className="mt-6 space-y-4">
        {(
          [
            [compareHash.textA, a, setA],
            [compareHash.textB, b, setB],
          ] as const
        ).map(([label, value, set]) => (
          <GlassCard key={label} title={label} hint={workbench.inputHint}>
            <TextArea
              label={label}
              labelHidden
              counter
              formatCount={workbench.characters}
              value={value}
              onChange={(event) => edit(set)(event.target.value)}
            />
          </GlassCard>
        ))}

        <Button
          loading={running}
          loadingLabel={compareHash.comparing}
          disabled={cooling}
          onClick={() => void compare()}
        >
          {compareHash.compare}
        </Button>

        <AnimatePresence initial={false} mode="popLayout">
          {outcome.kind === 'running' && outcome.waking && (
            <motion.div key="waking" {...fade}>
              <InlineMessage
                live={false}
                tone="info"
                title={ui.waking.title}
                body={ui.waking.body}
                icon={<ActivityIndicator size="sm" decorative />}
              />
            </motion.div>
          )}
          {error && failure && (
            <motion.div key={`failed-${error.kind}`} {...fade}>
              <InlineMessage
                live={false}
                tone={toneOf(error)}
                title={failure.title}
                body={failure.body}
                apiMessage={failure.showApiMessage ? apiMessageOf(error) : null}
              />
            </motion.div>
          )}
          {outcome.kind === 'done' && verdict && (
            <motion.div key="done" className="space-y-4" {...fade}>
              <InlineMessage live={false} tone={same ? 'info' : 'warning'} title={verdict} />
              <ResultPanel title={compareHash.hashOf('A')} result={outcome.a} />
              <ResultPanel title={compareHash.hashOf('B')} result={outcome.b} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The one polite region of the screen: the verdict and errors are announced here. */}
      <div aria-live="polite" className="sr-only" data-testid="compare-announcer">
        {announcement}
      </div>
    </div>
  );
}
