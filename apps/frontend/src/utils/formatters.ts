export const formatCurrency = (
  value: number,
  locale = "es-ES",
  currency = "EUR"
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercentage = (
  value: number,
  locale = "es-ES",
  maximumFractionDigits = 2
): string =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
  }).format(value / 100);

export const formatDateTime = (
  value: string | number | Date,
  locale = "es-ES"
): string => new Date(value).toLocaleString(locale);

export const formatDate = (
  value: string | number | Date,
  locale = "es-ES"
): string =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));

export const formatTime = (
  value: string | number | Date,
  locale = "es-ES"
): string =>
  new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));

export const formatFixedNumber = (
  value: number,
  fractionDigits = 2
): string => value.toFixed(fractionDigits);

export const formatSignedFixedNumber = (
  value: number,
  fractionDigits = 2
): string => `${value >= 0 ? "+" : ""}${formatFixedNumber(value, fractionDigits)}`;

export const formatCurrencyAmount = (
  value: number,
  fractionDigits = 2,
  currencySymbol = "€"
): string => `${formatFixedNumber(value, fractionDigits)} ${currencySymbol}`;

export const formatSignedCurrencyAmount = (
  value: number,
  fractionDigits = 2,
  currencySymbol = "€"
): string =>
  `${formatSignedFixedNumber(value, fractionDigits)} ${currencySymbol}`;

export const formatFixedPercentage = (
  value: number,
  fractionDigits = 2
): string => `${formatFixedNumber(value, fractionDigits)}%`;

export const formatCompactPhaseLabel = (
  phaseName?: string | null,
  phaseIndex?: number | null
): string | undefined => {
  if (phaseIndex !== null && phaseIndex !== undefined && phaseIndex >= 0) {
    return `F${phaseIndex + 1}`;
  }

  const normalizedPhaseName = phaseName?.trim();

  if (!normalizedPhaseName) {
    return undefined;
  }

  const match = normalizedPhaseName.match(/^fase\s+(\d+)$/i);
  if (match) {
    return `F${match[1]}`;
  }

  const compactMatch = normalizedPhaseName.match(/^f(\d+)$/i);
  if (compactMatch) {
    return `F${compactMatch[1]}`;
  }

  return normalizedPhaseName;
};

export const isGenericPhaseName = (phaseName?: string | null): boolean => {
  const normalizedPhaseName = phaseName?.trim();

  if (!normalizedPhaseName) {
    return false;
  }

  return /^fase\s+\d+$/i.test(normalizedPhaseName) || /^f\d+$/i.test(normalizedPhaseName);
};

export const getSignedMetricToneClass = (value: number): string =>
  value > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : value < 0
      ? "text-red-600 dark:text-red-400"
      : "text-sky-600 dark:text-sky-400";
