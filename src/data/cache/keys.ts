import type { Operation, OperationRequest } from '@/domain';

export const queryKeys = {
  catalog: ['catalog'] as const,
  operation: (r: OperationRequest) =>
    ['operation', r.operation, r.algorithmId, r.input, r.options ?? {}] as readonly [
      'operation',
      Operation,
      string,
      string,
      Readonly<Record<string, unknown>>,
    ],
};
