import bs58 from "bs58";

/**
 * Validation utilities for VantagePay — addresses, emails, cards, input.
 */

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Validate a Solana base58 address.
 * Checks both regex format and base58 decoding.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || !SOLANA_ADDRESS_REGEX.test(address)) return false;
  try {
    bs58.decode(address);
    return true;
  } catch {
    return false;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate a card number using the Luhn algorithm.
 */
export function isValidCardNumber(number: string): boolean {
  // Must be digits only, 13–19 characters
  if (!/^\d{13,19}$/.test(number)) return false;

  let sum = 0;
  let alternate = false;

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]!, 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Sanitize user input — trim whitespace and strip control characters.
 * Does NOT escape HTML — use a proper library for rendering user content.
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes, trim, collapse multiple spaces
  return input
    .replace(/\0/g, "")
    .trim()
    .replace(/\s+/g, " ");
}
