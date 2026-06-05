/**
 * Formatting utilities for VantagePay — currency, crypto, cards, dates.
 */

/**
 * Format a number as USD currency.
 * @example formatUSD(1234.56) → "$1,234.56"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format a SOL amount with the SOL symbol.
 * @example formatSOL(1.234) → "1.234 SOL"
 */
export function formatSOL(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} SOL`;
}

/**
 * Format a token amount with its symbol.
 * @example formatToken(1234.56, "USDT") → "1,234.56 USDT"
 */
export function formatToken(amount: number, symbol: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

/**
 * Truncate a Solana-style address for display.
 * @example truncateAddress("AbCd1234...XyZ1") → "AbCd...XyZ1"
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a card number for display — masked except last 4.
 * @example formatCardNumber("4111111111111234") → "•••• •••• •••• 1234"
 */
export function formatCardNumber(number: string): string {
  const last4 = number.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Format a date to a human-readable string.
 * @example formatDate(new Date("2025-01-15")) → "Jan 15, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Format a relative time string (e.g., "2 hours ago").
 * @example formatRelativeTime(someDate) → "2 hours ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (years > 0) return rtf.format(-years, "year");
  if (months > 0) return rtf.format(-months, "month");
  if (weeks > 0) return rtf.format(-weeks, "week");
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

/**
 * Format a percentage value with an explicit sign.
 * @example formatPercent(2.5) → "+2.5%"
 * @example formatPercent(-0.1) → "-0.1%"
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}
