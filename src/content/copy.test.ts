import { describe, expect, it } from 'vitest';
import type { AppError, Operation } from '@/domain';
import { algorithmContent } from './algorithms';
import { errorCopy } from './errors';
import { familyContent } from './families';
import { operationCopy } from './operations';
import { securityLevelCopy, ui } from './ui';

describe('errorCopy', () => {
  it('builds "Couldn\'t decrypt" for an operation error on decrypt', () => {
    expect(errorCopy({ kind: 'operation', message: 'Decryption failed.' }, 'decrypt')).toEqual({
      title: "Couldn't decrypt",
      body: null,
      showApiMessage: true,
    });
  });

  it('uses the verb phrase of the operation', () => {
    expect(errorCopy({ kind: 'validation', message: 'm', fields: {} }, 'hash').title).toBe(
      "Couldn't generate the hash",
    );
  });

  it('falls back to a neutral phrase without an operation', () => {
    expect(errorCopy({ kind: 'operation', message: 'm' }).title).toBe("Couldn't run it");
  });

  it.each<[AppError, string, boolean]>([
    [{ kind: 'binaryResult', message: 'm' }, 'The result is binary data', true],
    [{ kind: 'rateLimited', message: 'm', retryAfterSeconds: null }, 'Wait a moment', false],
    [{ kind: 'network' }, "Can't reach the server", false],
    [{ kind: 'timeout' }, 'The server took too long', false],
    [{ kind: 'server', status: 500, message: null }, 'Something went wrong', false],
    [{ kind: 'contract', issues: 'x' }, 'Something went wrong', false],
    [{ kind: 'notFound', message: 'm' }, 'Algorithm not found', false],
  ])('has copy for %j', (error, title, showApiMessage) => {
    const copy = errorCopy(error, 'decode');
    expect(copy.title).toBe(title);
    expect(copy.showApiMessage).toBe(showApiMessage);
  });

  it('never exposes aborted', () => {
    expect(errorCopy({ kind: 'aborted' })).toEqual({
      title: '',
      body: null,
      showApiMessage: false,
    });
  });
});

describe('operationCopy', () => {
  it.each<Operation>(['encrypt', 'decrypt', 'hash', 'encode', 'decode'])(
    'every operation has label, gerund and verb: %s',
    (op) => {
      const copy = operationCopy[op];
      expect(copy.label).not.toBe('');
      expect(copy.gerund).toMatch(/…$/);
      expect(copy.verb).not.toBe('');
    },
  );
});

describe('static copy', () => {
  it('has the fixed phrases of the design', () => {
    expect(ui.waking.title).toBe('Waking up the server…');
    expect(ui.homeTitle).toBe('What are we doing today?');
    expect(familyContent.hashing).toEqual({
      title: 'Hash',
      hint: 'hash',
      description: 'Fingerprint a text.',
    });
    expect(securityLevelCopy['not-applicable']).toBe('not applicable');
  });

  it('marks the AES key as secret', () => {
    expect(algorithmContent['aes-256-gcm']?.options?.key).toMatchObject({
      label: 'Password',
      secret: true,
    });
  });
});
