import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv';
import { form } from '@/content';
import type { OptionsSchema } from '@/domain';

/** Where an error that names no option goes (a root keyword such as minProperties). */
export const FORM_ERROR = '';

/** The pattern of the Vigenère keyword, whose message the form spells out. */
const LETTERS_ONLY = '^[A-Za-z]+$';

// Draft-07, like the backend schemas. Unknown keywords are tolerated: the backend owns them.
const ajv = new Ajv({ allErrors: true, strict: false });

// Compiled once per schema. The catalog may hand over a fresh copy of the same schema after a
// refetch, so the key is its content rather than its identity.
const compiled = new Map<string, ValidateFunction>();

function validatorFor(schema: OptionsSchema): ValidateFunction {
  const key = JSON.stringify(schema);
  let validate = compiled.get(key);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(key, validate);
  }
  return validate;
}

/** The option an error belongs to: the first segment of its path, or the property it names. */
function optionOf(error: ErrorObject): string | null {
  const [first] = error.instancePath.split('/').slice(1);
  if (first !== undefined && first !== '') return first.replaceAll('~1', '/').replaceAll('~0', '~');
  const params = error.params as Record<string, unknown>;
  const named = params.missingProperty ?? params.additionalProperty;
  return typeof named === 'string' ? named : null;
}

function messageFor(error: ErrorObject, atRoot: boolean): string {
  const params = error.params as Record<string, unknown>;
  switch (error.keyword) {
    case 'required':
      return form.required;
    case 'type':
      if (atRoot && (params.type === 'integer' || params.type === 'number')) return form.wholeNumber;
      break;
    case 'pattern':
      return params.pattern === LETTERS_ONLY ? form.lettersOnly : form.mismatch;
    case 'minLength':
      if (params.limit === 1) return form.required;
      break;
  }
  const text = error.message ?? form.mismatch;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/** Checks options against their schema; returns one English message per invalid option. */
export function validateOptions(
  schema: OptionsSchema,
  options: Record<string, unknown>,
): Record<string, string> {
  const validate = validatorFor(schema);
  if (validate(options)) return {};
  const errors: Record<string, string> = {};
  for (const error of validate.errors ?? []) {
    const option = optionOf(error) ?? FORM_ERROR;
    if (option in errors) continue;
    const atRoot = error.instancePath.split('/').length === 2;
    errors[option] = messageFor(error, atRoot);
  }
  return errors;
}
