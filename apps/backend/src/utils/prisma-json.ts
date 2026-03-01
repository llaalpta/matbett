import { Prisma } from '@prisma/client';

/**
 * Converts unknown data into Prisma.InputJsonValue by:
 * - removing undefined values
 * - converting Date to ISO string
 * - recursively mapping arrays/objects
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    throw new Error('Cannot convert null or undefined to Prisma.InputJsonValue.');
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toInputJson);
  }

  if (isRecord(value)) {
    const result: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        result[key] = toInputJson(entry);
      }
    }
    return result;
  }

  throw new Error('Unsupported value type for Prisma.InputJsonValue.');
}
