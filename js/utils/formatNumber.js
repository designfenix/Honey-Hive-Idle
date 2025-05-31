// js/utils/formatNumber.js

/**
 * Formatea un número en K/M si supera cierto umbral.
 * - 1 000 → "1.00K"
 * - 1 000 000 → "1.00M"
 */
export function formatNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toString();
}
