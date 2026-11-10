import type { ApiField, AppError } from '@/domain';

const API_FIELDS: readonly ApiField[] = ['algorithm', 'input', 'options'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function messageOf(body: unknown): string | null {
  return isRecord(body) && typeof body.message === 'string' ? body.message : null;
}

function fieldsOf(errors: Record<string, unknown>): Partial<Record<ApiField, string[]>> {
  const fields: Partial<Record<ApiField, string[]>> = {};
  for (const field of API_FIELDS) {
    const list = errors[field];
    if (Array.isArray(list)) fields[field] = list.filter((m): m is string => typeof m === 'string');
  }
  return fields;
}

function retryAfterSeconds(headers: Headers): number | null {
  const value = headers.get('Retry-After');
  if (value === null || !/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

/** Maps an HTTP error response to an AppError (docs/ARCHITECTURE.md §6). */
export function normalizeHttpError(status: number, body: unknown, headers: Headers): AppError {
  const message = messageOf(body);
  switch (status) {
    case 422:
      if (isRecord(body) && isRecord(body.errors)) {
        return { kind: 'validation', message: message ?? '', fields: fieldsOf(body.errors) };
      }
      return { kind: 'operation', message: message ?? '' };
    case 404:
      return { kind: 'notFound', message: message ?? '' };
    case 429:
      return {
        kind: 'rateLimited',
        message: message ?? '',
        retryAfterSeconds: retryAfterSeconds(headers),
      };
    default:
      return { kind: 'server', status, message };
  }
}
