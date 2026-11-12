'use client';

import { useEffect, useRef, useState } from 'react';
import { workbench } from '@/content';
import { Button, characterCount, GlassCard } from '@/ui';

const COPIED_FOR_MS = 1_400;

/** The output in monospace, its length, Copy and, with two modes, Use as input. */
export function ResultPanel({
  result,
  onUseAsInput,
}: {
  result: string;
  onUseAsInput?: (() => void) | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    void navigator.clipboard?.writeText(result).then(
      () => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
      },
      () => {},
    );
  };

  return (
    <GlassCard title={workbench.result} hint={workbench.characters(characterCount(result))}>
      <output className="block text-mono break-all whitespace-pre-wrap text-mono-text">
        {result}
      </output>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {onUseAsInput && (
          <Button variant="tertiary" size="sm" onClick={onUseAsInput}>
            {workbench.useAsInput}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? workbench.copied : workbench.copy}
        </Button>
      </div>
    </GlassCard>
  );
}
