import { z } from 'zod';

// Response shapes of the Criptografy API (README, "API contract"). Unknown fields are dropped,
// so the backend can add metadata without breaking the frontend.

const JsonSchemaDto = z.record(z.string(), z.unknown());

export const AlgorithmDto = z.object({
  id: z.string().min(1),
  name: z.string(),
  category: z.enum(['encryption', 'hashing', 'encoding']),
  description: z.string(),
  supportsEncryption: z.boolean(),
  supportsDecryption: z.boolean(),
  supportsHashing: z.boolean(),
  requiresKey: z.boolean(),
  securityLevel: z.enum(['educational', 'modern', 'not-applicable']),
  options: z.object({
    type: z.literal('object'),
    properties: z.record(z.string(), JsonSchemaDto),
    required: z.array(z.string()).default([]),
    additionalProperties: z.literal(false),
  }),
});
export type AlgorithmDto = z.infer<typeof AlgorithmDto>;

// Entries are validated one by one, so one algorithm with a shape this version does not know is
// skipped instead of taking the whole catalog down.
export const CatalogDto = z.object({ data: z.array(z.unknown()) });

export const ResultDto = z.object({ result: z.string() });

export const StatusDto = z.object({
  name: z.string(),
  status: z.string(),
  version: z.string(),
});
