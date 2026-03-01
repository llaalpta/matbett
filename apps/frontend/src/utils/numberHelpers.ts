export const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

export const roundToDecimals = (value: number, fractionDigits = 2): number => {
  const multiplier = 10 ** fractionDigits;
  return Math.round(value * multiplier) / multiplier;
};

export const roundToCents = (value: number): number => roundToDecimals(value, 2);

export const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export const areNumbersEqual = (
  left?: number,
  right?: number,
  epsilon = 0.001
): boolean => {
  if (typeof left !== "number" || typeof right !== "number") {
    return left === right;
  }

  return Math.abs(left - right) < epsilon;
};
