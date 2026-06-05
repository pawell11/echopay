import { describe, it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Card API Tests — real HTTP requests against a running Next.js dev server
//
// The server is started by vitest.global-setup.ts before any tests run
// and torn down after. This file assumes http://localhost:3099 is available.
// ---------------------------------------------------------------------------

const BASE = "http://localhost:3099/api";
const WALLET = "DemoWallet11111111111111111111111111111";
const OTHER_WALLET = "OtherWallet99999999999999999999999999999";

// ---------------------------------------------------------------------------
// Luhn helper (inline for the test — mirrors the server's algorithm)
// ---------------------------------------------------------------------------

function luhnCheck(number: string): boolean {
  if (!/^\d{13,19}$/.test(number)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Card API", () => {
  // -------------------------------------------------------------------------
  // POST /api/card
  // -------------------------------------------------------------------------
  describe("POST /api/card", () => {
    it("should create a new virtual card", async () => {
      const res = await fetch(`${BASE}/card`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.id).toMatch(/^card_/);
      expect(body.data.last4).toHaveLength(4);
      expect(body.data.brand).toBe("mastercard");
      expect(body.data.balance).toBe(0);
      expect(body.data.status).toBe("active");
      expect(body.data.currency).toBe("USD");
      expect(body.data.expiryMonth).toBeDefined();
      expect(body.data.expiryYear).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.frozenAt).toBeNull();
    });

    it("should reject missing wallet address", async () => {
      const res = await fetch(`${BASE}/card`, { method: "POST" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("x-wallet-address");
    });

    it("should generate valid Luhn card numbers", async () => {
      // Create a card, then fetch its full details to get the card number
      const createRes = await fetch(`${BASE}/card`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });
      const { data: card } = await createRes.json();
      const cardId: string = card.id;

      // GET full details (sensitive number + CVV)
      const detailRes = await fetch(`${BASE}/card/${cardId}`, {
        headers: { "x-wallet-address": WALLET },
      });
      expect(detailRes.status).toBe(200);
      const { data: details } = await detailRes.json();

      // The generated card number MUST pass Luhn
      expect(details.cardNumber).toBeDefined();
      expect(luhnCheck(details.cardNumber)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/card
  // -------------------------------------------------------------------------
  describe("GET /api/card", () => {
    it("should list cards for wallet", async () => {
      const res = await fetch(`${BASE}/card`, {
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);

      // The demo wallet has seeded cards + any we created
      expect(body.data.length).toBeGreaterThanOrEqual(2);

      // Every card should belong to this wallet
      for (const card of body.data) {
        expect(card.id).toBeDefined();
        expect(card.last4).toHaveLength(4);
        expect(card.brand).toBe("mastercard");
      }
    });

    it("should return empty array for new wallet", async () => {
      const res = await fetch(`${BASE}/card`, {
        headers: { "x-wallet-address": "FreshWallet000000000000000000000000000" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/card/[id]
  // -------------------------------------------------------------------------
  describe("GET /api/card/[id]", () => {
    it("should return full card details for owner", async () => {
      const res = await fetch(`${BASE}/card/card_demo_1`, {
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.cardNumber).toBeDefined();
      expect(body.data.cvv).toBeDefined();
      expect(body.data.last4).toBe("3456");
      expect(body.data.status).toBe("active");
    });

    it("should return 403 for wrong wallet", async () => {
      const res = await fetch(`${BASE}/card/card_demo_1`, {
        headers: { "x-wallet-address": OTHER_WALLET },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Access denied");
    });

    it("should return 404 for non-existent card", async () => {
      const res = await fetch(`${BASE}/card/nonexistent_card_id`, {
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("not found");
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/card/[id]/freeze
  // -------------------------------------------------------------------------
  describe("POST /api/card/[id]/freeze", () => {
    let freezeCardId: string | null = null;

    beforeAll(async () => {
      const res = await fetch(`${BASE}/card`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });
      const { data } = await res.json();
      freezeCardId = data.id;
    });

    it("should freeze an active card", async () => {
      const res = await fetch(`${BASE}/card/${freezeCardId}/freeze`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("frozen");
      expect(body.data.frozenAt).not.toBeNull();
    });

    it("should reject freezing frozen card", async () => {
      const res = await fetch(`${BASE}/card/${freezeCardId}/freeze`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("already frozen");
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /api/card/[id]
  // -------------------------------------------------------------------------
  describe("DELETE /api/card/[id]", () => {
    let closeCardId: string | null = null;

    beforeAll(async () => {
      const res = await fetch(`${BASE}/card`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });
      const { data } = await res.json();
      closeCardId = data.id;
    });

    it("should close a card", async () => {
      const res = await fetch(`${BASE}/card/${closeCardId}`, {
        method: "DELETE",
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("closed");
    });

    it("should reject operations on closed card", async () => {
      const res = await fetch(`${BASE}/card/${closeCardId}/freeze`, {
        method: "POST",
        headers: { "x-wallet-address": WALLET },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("closed");
    });
  });
});