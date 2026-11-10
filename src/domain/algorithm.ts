export type Family = 'encryption' | 'hashing' | 'encoding';
export type Operation = 'encrypt' | 'decrypt' | 'hash' | 'encode' | 'decode';
export type SecurityLevel = 'educational' | 'modern' | 'not-applicable';
export type JsonSchema = { readonly [k: string]: unknown };

export interface OptionsSchema {
  type: 'object';
  properties: Readonly<Record<string, JsonSchema>>;
  required: readonly string[];
  additionalProperties: false;
}

export interface Algorithm {
  id: string;
  name: string;
  family: Family;
  description: string;
  operations: readonly Operation[];
  requiresKey: boolean;
  securityLevel: SecurityLevel;
  optionsSchema: OptionsSchema;
}

export interface OperationRequest {
  algorithmId: string;
  operation: Operation;
  input: string;
  options?: Readonly<Record<string, unknown>>;
}

export const FAMILIES: readonly Family[] = ['encryption', 'hashing', 'encoding'];

/** The operations an algorithm supports, from the catalog's category and flags. */
export function operationsFor(meta: {
  category: Family;
  supportsEncryption: boolean;
  supportsDecryption: boolean;
  supportsHashing: boolean;
}): Operation[] {
  switch (meta.category) {
    case 'encryption': {
      const ops: Operation[] = [];
      if (meta.supportsEncryption) ops.push('encrypt');
      if (meta.supportsDecryption) ops.push('decrypt');
      return ops;
    }
    case 'hashing':
      return meta.supportsHashing ? ['hash'] : [];
    case 'encoding':
      // The backend sends every flag as false for encodings: the category alone decides.
      return ['encode', 'decode'];
  }
}

export function endpointFor(op: Operation): `/api/${Operation}` {
  return `/api/${op}`;
}
