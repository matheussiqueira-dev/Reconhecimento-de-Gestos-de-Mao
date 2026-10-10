const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const twoDecimals = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const percentOneDecimal = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const formatInteger = (value: number) => integer.format(value);
export const formatDecimal = (value: number) => oneDecimal.format(value);
/** Ratios and thresholds such as the 0,35 pinch limit. */
export const formatRatio = (value: number) => twoDecimals.format(value);
export const formatPercent = (ratio: number) => percent.format(ratio);
export const formatPercentPrecise = (ratio: number) => percentOneDecimal.format(ratio);

/** "1 min 05 s" / "42 s" */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}
