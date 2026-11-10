export type ApiField = 'algorithm' | 'input' | 'options';

export type AppError =
  | { kind: 'validation'; message: string; fields: Partial<Record<ApiField, string[]>> }
  | { kind: 'operation'; message: string }
  | { kind: 'binaryResult'; message: string }
  | { kind: 'notFound'; message: string }
  | { kind: 'rateLimited'; message: string; retryAfterSeconds: number | null }
  | { kind: 'network' }
  | { kind: 'timeout' }
  | { kind: 'aborted' }
  | { kind: 'server'; status: number; message: string | null }
  | { kind: 'contract'; issues: string };

/** An AppError thrown as an exception, so it can travel through promises and TanStack Query. */
export class AppFailure extends Error {
  readonly error: AppError;

  constructor(error: AppError) {
    super(error.kind);
    this.name = 'AppFailure';
    this.error = error;
  }
}

export function isAppFailure(e: unknown): e is AppFailure {
  return e instanceof AppFailure;
}
