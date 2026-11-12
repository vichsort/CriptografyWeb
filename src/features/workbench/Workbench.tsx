'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useSyncExternalStore, type KeyboardEvent } from 'react';
import { algorithmContent, errorCopy, operationCopy, ui, workbench } from '@/content';
import { useCatalog, useCatalogWaking } from '@/data/cache';
import type { Algorithm, AppError, Operation } from '@/domain';
import {
  ActivityIndicator,
  Button,
  characterCount,
  durations,
  GlassCard,
  InlineMessage,
  SegmentedControl,
  Skeleton,
  springs,
  TextArea,
  useReducedMotionSafe,
} from '@/ui';
import { AlgorithmNotFound } from './AlgorithmNotFound';
import { SchemaForm } from './form/SchemaForm';
import { ResultPanel } from './ResultPanel';
import { useRunOperation } from './useRunOperation';
import { useWorkbenchState } from './useWorkbenchState';
import { WorkbenchHeader } from './WorkbenchHeader';

const COLUMN = 'mx-auto w-full max-w-workbench px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-10';

const subscribeNever = () => () => {};
const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

/** The shortcut hint, after hydration: the server cannot know the keyboard. */
function useShortcutLabel(): string {
  const apple = useSyncExternalStore(subscribeNever, isApple, () => false);
  return apple ? workbench.shortcut.apple : workbench.shortcut.other;
}

type Tone = 'info' | 'warning' | 'error';

function toneOf(error: AppError): Tone {
  if (error.kind === 'rateLimited') return 'warning';
  if (error.kind === 'binaryResult') return 'info';
  return 'error';
}

function apiMessageOf(error: AppError): string | null {
  return 'message' in error ? error.message : null;
}

/** The column with a placeholder, while the route or the catalog is not known yet. */
export function WorkbenchFallback({ waking = false }: { waking?: boolean }) {
  return (
    <div className={`${COLUMN} space-y-4`}>
      {waking && <InlineMessage tone="info" title={ui.waking.title} body={ui.waking.body} />}
      <Skeleton rows={3} />
    </div>
  );
}

/** One algorithm's screen, once the catalog is known; an unknown id shows the not-found view. */
export function Workbench({ id }: { id: string }) {
  const catalog = useCatalog();
  const waking = useCatalogWaking();

  if (catalog.data === undefined) {
    if (catalog.isError) {
      const copy = errorCopy(catalog.error.error);
      return (
        <div className={COLUMN}>
          <InlineMessage tone="error" title={copy.title} body={copy.body} />
        </div>
      );
    }
    return <WorkbenchFallback waking={waking} />;
  }

  const algorithm = catalog.data.find((a) => a.id === id);
  if (!algorithm) return <AlgorithmNotFound />;
  // Keyed, so moving to another algorithm starts from fresh options and input.
  return <WorkbenchScreen key={algorithm.id} algorithm={algorithm} />;
}

function WorkbenchScreen({ algorithm }: { algorithm: Algorithm }) {
  const content = algorithmContent[algorithm.id];
  const state = useWorkbenchState(algorithm);
  const runner = useRunOperation();
  const reduced = useReducedMotionSafe();
  const shortcut = useShortcutLabel();
  const { mode, options, input } = state;

  const twoModes = algorithm.operations.length === 2;
  const hasOptions = Object.keys(algorithm.optionsSchema.properties).length > 0;
  const running = runner.status === 'running';
  const canRun = mode !== undefined && options !== null && !runner.cooling;

  const start = () => {
    if (!canRun) return;
    void runner.run({
      algorithmId: algorithm.id,
      operation: mode,
      input,
      ...(hasOptions && { options }),
    });
  };

  const switchMode = (op: Operation) => {
    if (op === mode) return;
    runner.cancel();
    state.setMode(op);
  };

  const moveToInput = (result: string) => {
    const other = algorithm.operations.find((op) => op !== mode);
    state.setInput(result);
    runner.cancel();
    if (other) state.setMode(other);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    start();
  };

  const error = runner.status === 'error' ? runner.error : null;
  const errorText = error && mode ? errorCopy(error, mode) : null;
  const result = runner.status === 'success' ? runner.result : null;

  const announcement =
    result !== null
      ? workbench.resultReady(characterCount(result))
      : errorText
        ? [errorText.title, errorText.body].filter(Boolean).join('. ')
        : running && runner.waking
          ? ui.waking.title
          : '';

  const appear = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { height: 0, opacity: 0, y: 8 },
        animate: { height: 'auto', opacity: 1, y: 0 },
        exit: { height: 0, opacity: 0 },
      };
  const appearTransition = reduced
    ? { duration: durations.fast }
    : {
        height: springs.gentle,
        opacity: { duration: durations.base, delay: durations.instant },
        y: { ...springs.gentle, delay: durations.instant },
      };

  return (
    <div className={COLUMN} onKeyDown={onKeyDown}>
      <WorkbenchHeader algorithm={algorithm} />

      <div className="mt-6 space-y-4">
        {twoModes && mode && (
          <SegmentedControl
            ariaLabel={workbench.modeLabel}
            options={algorithm.operations.map((op) => ({
              value: op,
              label: operationCopy[op].label,
            }))}
            value={mode}
            onChange={switchMode}
          />
        )}

        {hasOptions && (
          <GlassCard title={workbench.options}>
            <SchemaForm
              algorithmId={algorithm.id}
              schema={algorithm.optionsSchema}
              copy={content?.options}
              values={state.values}
              onChange={state.setValues}
              errors={state.errors}
            />
          </GlassCard>
        )}

        <GlassCard title={workbench.input} hint={workbench.inputHint}>
          <TextArea
            label={workbench.input}
            labelHidden
            counter
            formatCount={workbench.characters}
            value={input}
            onChange={(event) => state.setInput(event.target.value)}
          />
        </GlassCard>

        {mode && (
          <div className="flex items-center gap-3">
            <Button
              loading={running}
              loadingLabel={operationCopy[mode].gerund}
              disabled={!canRun}
              onClick={start}
            >
              {operationCopy[mode].label}
            </Button>
            <kbd className="hidden font-mono text-mono-small text-label-tertiary sm:inline">
              {shortcut}
            </kbd>
          </div>
        )}

        <AnimatePresence initial={false}>
          {running && runner.waking && (
            <motion.div key="waking" {...appear} transition={appearTransition}>
              <InlineMessage
                live={false}
                tone="info"
                title={ui.waking.title}
                body={ui.waking.body}
                icon={<ActivityIndicator size="sm" decorative />}
              />
            </motion.div>
          )}
          {error && errorText && (
            <motion.div key={`error-${runner.requestKey}`} {...appear} transition={appearTransition}>
              <InlineMessage
                live={false}
                tone={toneOf(error)}
                title={errorText.title}
                body={errorText.body}
                apiMessage={errorText.showApiMessage ? apiMessageOf(error) : null}
              />
            </motion.div>
          )}
          {result !== null && (
            <motion.div key="result" {...appear} transition={appearTransition}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={runner.requestKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: durations.base }}
                >
                  <ResultPanel
                    result={result}
                    onUseAsInput={twoModes ? () => moveToInput(result) : undefined}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {content?.note && (
          <p className="flex gap-2 pt-2 text-footnote text-label-secondary">{content.note}</p>
        )}
      </div>

      {/* The one polite region of the screen: results and messages are announced here. */}
      <div aria-live="polite" className="sr-only" data-testid="workbench-announcer">
        {announcement}
      </div>
    </div>
  );
}
