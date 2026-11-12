'use client';

import { hashKey, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { executeOperation } from '@/data/cache';
import { isAppFailure, type AppError, type OperationRequest } from '@/domain';

type Status = 'idle' | 'running' | 'success' | 'error';

interface RunState {
  status: Status;
  waking: boolean;
  result: string | null;
  error: AppError | null;
  requestKey: string | null;
}

const IDLE: RunState = { status: 'idle', waking: false, result: null, error: null, requestKey: null };

/** How long Run stays off after a 429 that does not say (Retry-After is not always exposed). */
const DEFAULT_COOLDOWN_SECONDS = 60;

/** What a failure that is not an AppFailure means to the screen: something went wrong. */
const UNKNOWN: AppError = { kind: 'server', status: 0, message: null };

/**
 * Runs one operation at a time. A new run aborts the pending one, and a settlement that arrives
 * for a run that is no longer current is dropped, so the screen never shows a stale result.
 * A cancelled run is never reported as an error. After a 429, `cooling` stays on until the
 * API's wait is over, even if the run is cancelled meanwhile.
 */
export function useRunOperation() {
  const client = useQueryClient();
  const [state, setState] = useState<RunState>(IDLE);
  const current = useRef<AbortController | null>(null);
  const [cooling, setCooling] = useState(false);
  const cooldown = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Leaving the screen gives up the pending run.
  useEffect(
    () => () => {
      current.current?.abort();
      clearTimeout(cooldown.current);
    },
    [],
  );

  const run = useCallback(
    async (req: OperationRequest) => {
      current.current?.abort();
      const controller = new AbortController();
      current.current = controller;
      const requestKey = hashKey([req.algorithmId, req.operation, req.input, req.options ?? null]);
      const isCurrent = () => current.current === controller;

      setState((s) => ({ ...s, status: 'running', waking: false, error: null, requestKey }));
      try {
        const result = await executeOperation(client, req, {
          signal: controller.signal,
          onWaking: () => {
            if (isCurrent()) setState((s) => ({ ...s, waking: true }));
          },
        });
        if (!isCurrent()) return;
        setState({ status: 'success', waking: false, result, error: null, requestKey });
      } catch (e) {
        if (!isCurrent()) return;
        const error = isAppFailure(e) ? e.error : UNKNOWN;
        if (error.kind === 'aborted') return;
        if (error.kind === 'rateLimited') {
          setCooling(true);
          clearTimeout(cooldown.current);
          const seconds = error.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS;
          cooldown.current = setTimeout(() => setCooling(false), seconds * 1_000);
        }
        setState({ status: 'error', waking: false, result: null, error, requestKey });
      } finally {
        if (isCurrent()) current.current = null;
      }
    },
    [client],
  );

  const cancel = useCallback(() => {
    current.current?.abort();
    current.current = null;
    setState(IDLE);
  }, []);

  return { ...state, cooling, run, cancel };
}
