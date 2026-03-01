export function requireNumber(value: number | undefined, fieldName: string): number {
  if (value === undefined) {
    throw new Error(`[Validation Error] Missing required number field: ${fieldName}`);
  }
  return value;
}
