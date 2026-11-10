/** Marks a branch the type system proves unreachable; throws if it is reached anyway. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
