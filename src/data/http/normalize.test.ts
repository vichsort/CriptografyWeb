import { describe, expect, it } from 'vitest';
import { normalizeHttpError } from './normalize';

const none = new Headers();

describe('normalizeHttpError', () => {
  it('maps a 422 with field errors to validation', () => {
    expect(
      normalizeHttpError(422, { message: 'm', errors: { input: ['x'], other: ['y'] } }, none),
    ).toEqual({ kind: 'validation', message: 'm', fields: { input: ['x'] } });
  });

  it('maps a 422 with only a message to operation', () => {
    expect(normalizeHttpError(422, { message: 'm' }, none)).toEqual({
      kind: 'operation',
      message: 'm',
    });
  });

  it('maps a 404 to notFound', () => {
    expect(normalizeHttpError(404, { message: 'm' }, none)).toEqual({
      kind: 'notFound',
      message: 'm',
    });
  });

  it('reads Retry-After on a 429 when it is exposed', () => {
    expect(normalizeHttpError(429, { message: 'm' }, new Headers({ 'Retry-After': '12' }))).toEqual(
      { kind: 'rateLimited', message: 'm', retryAfterSeconds: 12 },
    );
  });

  it('leaves the cooldown unknown on a 429 without Retry-After', () => {
    expect(normalizeHttpError(429, { message: 'm' }, none)).toEqual({
      kind: 'rateLimited',
      message: 'm',
      retryAfterSeconds: null,
    });
  });

  it('maps a 405 to server, keeping the status', () => {
    expect(normalizeHttpError(405, { message: 'Method not allowed' }, none)).toEqual({
      kind: 'server',
      status: 405,
      message: 'Method not allowed',
    });
  });

  it('maps a 500 with a non-JSON body to server without message', () => {
    expect(normalizeHttpError(500, null, none)).toEqual({
      kind: 'server',
      status: 500,
      message: null,
    });
  });
});
