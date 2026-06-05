import { describe, it, expect } from "vitest";
import {
  isValidSolanaAddress,
  isValidCardNumber,
  formatCardNumber,
  formatUSD,
  truncateAddress,
} from "@vantagepay/utils";

describe("Validation", () => {
  // -------------------------------------------------------------------------
  // isValidSolanaAddress
  // -------------------------------------------------------------------------
  describe("isValidSolanaAddress", () => {
    it("should accept valid base58 addresses", () => {
      // Known valid Solana addresses
      expect(isValidSolanaAddress("DemoWallet11111111111111111111111111111")).toBe(true);
      expect(
        isValidSolanaAddress("HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHeGfL3Vc"),
      ).toBe(true);
      // A minimal-length address (32 chars)
      const short = "11111111111111111111111111111111";
      expect(short).toHaveLength(32);
      expect(isValidSolanaAddress(short)).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidSolanaAddress("")).toBe(false);
      expect(isValidSolanaAddress("not-an-address")).toBe(false);
      // Contains invalid base58 chars: 0, O, I, l
      expect(isValidSolanaAddress("0OIl")).toBe(false);
      // Too short
      expect(isValidSolanaAddress("abc")).toBe(false);
      // Contains spaces
      expect(isValidSolanaAddress("HN7cABq Lq46Es1jh92dQQisAq662SmxELLLsHeGfL3Vc")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // isValidCardNumber (Luhn)
  // -------------------------------------------------------------------------
  describe("isValidCardNumber (Luhn)", () => {
    it("should accept valid card numbers", () => {
      // Classic test card: 4532015112830366 (Visa, passes Luhn)
      expect(isValidCardNumber("4532015112830366")).toBe(true);
      // Mastercard test: 5573123400003456 (from seed data)
      expect(isValidCardNumber("5573123400003456")).toBe(true);
      // Another known valid: 4111111111111111
      expect(isValidCardNumber("4111111111111111")).toBe(true);
    });

    it("should reject invalid card numbers", () => {
      // Single digit change breaks Luhn
      expect(isValidCardNumber("4532015112830367")).toBe(false);
      // All zeros
      expect(isValidCardNumber("0000000000000000")).toBe(false);
      // Too short
      expect(isValidCardNumber("411111111111")).toBe(false);
      // Too long
      expect(isValidCardNumber("41111111111111111111")).toBe(false);
      // Contains letters
      expect(isValidCardNumber("453201511283036a")).toBe(false);
      // Empty
      expect(isValidCardNumber("")).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // formatCardNumber
  // -------------------------------------------------------------------------
  describe("formatCardNumber", () => {
    it("should mask all but last 4 digits", () => {
      const result = formatCardNumber("4111111111111234");
      expect(result).toBe("•••• •••• •••• 1234");
    });

    it("should handle different card numbers", () => {
      expect(formatCardNumber("5573123400003456")).toBe("•••• •••• •••• 3456");
      expect(formatCardNumber("0000000000000001")).toBe("•••• •••• •••• 0001");
    });
  });

  // -------------------------------------------------------------------------
  // formatUSD
  // -------------------------------------------------------------------------
  describe("formatUSD", () => {
    it("should format numbers as USD currency", () => {
      expect(formatUSD(0)).toBe("$0.00");
      expect(formatUSD(12.5)).toBe("$12.50");
      expect(formatUSD(1234.56)).toBe("$1,234.56");
      expect(formatUSD(1000000)).toBe("$1,000,000.00");
    });

    it("should handle negative values", () => {
      expect(formatUSD(-99.99)).toBe("-$99.99");
    });
  });

  // -------------------------------------------------------------------------
  // truncateAddress
  // -------------------------------------------------------------------------
  describe("truncateAddress", () => {
    it("should show first 4 and last 4 chars", () => {
      const addr = "DemoWallet11111111111111111111111111111";
      const result = truncateAddress(addr);
      expect(result).toBe("Demo...1111");
    });

    it("should accept custom char count", () => {
      const addr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      expect(truncateAddress(addr, 6)).toBe("ABCDEF...UVWXYZ");
    });

    it("should return full address when length <= chars*2", () => {
      const short = "ABCDEFGH";
      expect(truncateAddress(short, 4)).toBe("ABCDEFGH");
      expect(truncateAddress(short, 5)).toBe("ABCDEFGH");
      // Exactly 2*4 = 8 chars — should return full
      expect(truncateAddress("ABCDEFGH", 4)).toBe("ABCDEFGH");
    });
  });
});