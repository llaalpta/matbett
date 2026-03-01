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
