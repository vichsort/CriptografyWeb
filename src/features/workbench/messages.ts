import type { AppError } from '@/domain';

/** What a failure that is not an AppFailure means to a screen: something went wrong. */
export const UNKNOWN_ERROR: AppError = { kind: 'server', status: 0, message: null };

/** Shown while the cooldown of an earlier 429 lasts, even after that run's message is gone. */
export const RATE_LIMITED: AppError = { kind: 'rateLimited', message: '', retryAfterSeconds: null };

/** A rate limit warns, a binary result informs, everything else is an error (ARCHITECTURE.md §6). */
export function toneOf(error: AppError): 'info' | 'warning' | 'error' {
  if (error.kind === 'rateLimited') return 'warning';
  if (error.kind === 'binaryResult') return 'info';
  return 'error';
}

/** The API's own message, when the error carries one. */
export function apiMessageOf(error: AppError): string | null {
  return 'message' in error ? error.message : null;
}
