/**
 * An AbortSignal that aborts when any of `signals` does. Uses AbortSignal.any where it exists
 * (Safari 17.4+, Chrome 116+) and links the signals by hand elsewhere.
 */
export function anySignal(signals: readonly AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([...signals]);

  const controller = new AbortController();
  const abort = (signal: AbortSignal) => {
    controller.abort(signal.reason);
    signals.forEach((s) => s.removeEventListener('abort', onAbort));
  };
  function onAbort(this: AbortSignal) {
    abort(this);
  }
  for (const signal of signals) {
    if (signal.aborted) {
      abort(signal);
      break;
    }
    signal.addEventListener('abort', onAbort);
  }
  return controller.signal;
}
