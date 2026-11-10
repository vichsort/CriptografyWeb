import type { z } from 'zod';
import { request } from '@/data/http';
import {
  AppFailure,
  endpointFor,
  isAppFailure,
  operationsFor,
  type Algorithm,
  type OperationRequest,
} from '@/domain';
import { CatalogDto, ResultDto, StatusDto, type AlgorithmDto } from './schemas';

/** Exact text of ../Criptografy/app/Cryptography/NonTextResultException.php. */
export const NON_TEXT_RESULT_MESSAGE =
  'The operation result is not valid UTF-8 text (it contains binary bytes) and cannot be represented in the JSON response.';

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppFailure({ kind: 'contract', issues: result.error.message });
  }
  return result.data;
}

function toAlgorithm(dto: AlgorithmDto): Algorithm {
  return {
    id: dto.id,
    name: dto.name,
    family: dto.category,
    description: dto.description,
    operations: operationsFor(dto),
    requiresKey: dto.requiresKey,
    securityLevel: dto.securityLevel,
    optionsSchema: dto.options,
  };
}

export async function getCatalog(signal?: AbortSignal): Promise<Algorithm[]> {
  const body = await request({ method: 'GET', path: '/api/algorithms', ...(signal && { signal }) });
  return parse(CatalogDto, body).data.map(toAlgorithm);
}

/**
 * Runs one operation. `input` and `options` are sent exactly as given: whitespace is data.
 */
export async function runOperation(
  req: OperationRequest,
  opts: { signal?: AbortSignal; onWaking?: () => void } = {},
): Promise<string> {
  const body = {
    algorithm: req.algorithmId,
    input: req.input,
    ...(req.options !== undefined && { options: req.options }),
  };
  try {
    const response = await request({
      method: 'POST',
      path: endpointFor(req.operation),
      body,
      ...(opts.signal && { signal: opts.signal }),
      ...(opts.onWaking && { onWaking: opts.onWaking }),
    });
    return parse(ResultDto, response).result;
  } catch (e) {
    if (
      isAppFailure(e) &&
      e.error.kind === 'operation' &&
      e.error.message === NON_TEXT_RESULT_MESSAGE
    ) {
      throw new AppFailure({ kind: 'binaryResult', message: e.error.message });
    }
    throw e;
  }
}

export async function getApiStatus(
  signal?: AbortSignal,
): Promise<{ name: string; status: string; version: string }> {
  const body = await request({ method: 'GET', path: '/', ...(signal && { signal }) });
  return parse(StatusDto, body);
}
