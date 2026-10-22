export const usd = (n: number, digits = 0) =>
  (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
export const pct = (n: number, digits = 1) => (n * 100).toFixed(digits) + "%";
