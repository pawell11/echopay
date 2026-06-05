import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Top-up API Tests — real HTTP requests against a running Next.js dev server
//
// The server is started by vitest.global-setup.ts before any tests run
// and torn down after. This file assumes http://localhost:3099 is available.
// ---------------------------------------------------------------------------

const BASE = "http://localhost:3099/api";
const WALLET = "DemoWallet11111111111111111111111111111";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createTestCard(): Promise<string> {
  const res = await fetch(`${BASE}/card`, {
    method: "POST",
    headers: { "x-wallet-address": WALLET },
  });
  const body = await res.json();
  return body.data.id;
}

async function freezeCard(cardId: string): Promise<void> {
  await fetch(`${BASE}/card/${cardId}/freeze`, {
    method: "POST",
    headers: { "x-wallet-address": WALLET },
  });
}

async function topUp(
  cardId: string,
  amount: number,
  currency: string,
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}/topup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-wallet-address": WALLET,
    },
    body: JSON.stringify({ cardId, amount, currency, walletAddress: WALLET }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Top-up API", () => {
  it("should top up with SOL (5% fee)", async () => {
    const cardId = await createTestCard();

    // Top up 200 SOL → fee = 5% of 200 = 10, cashback = 0, net = 190
    const { status, body } = await topUp(cardId, 200, "SOL");

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.txSignature).toMatch(/^mock_sig_/);
    expect(body.data.fee).toBe(10);
    expect(body.data.cashback).toBe(0);
    expect(body.data.cardBalance).toBe(190); // 200 - 10 + 0
  });

  it("should top up with ECHO (1% fee + 2% cashback)", async () => {
    const cardId = await createTestCard();

    // Top up 10000 ECHO → fee = 1% of 10000 = 100, cashback = 2% of 100 = 2
    const { status, body } = await topUp(cardId, 10_000, "ECHO");

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.fee).toBe(100);
    expect(body.data.cashback).toBe(2);
    expect(body.data.cardBalance).toBe(9902); // 10000 - 100 + 2
  });

  it("should reject negative amounts", async () => {
    const cardId = await createTestCard();

    const { status, body } = await topUp(cardId, -50, "SOL");

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("amount must be a positive number");
  });

  it("should reject top-up on frozen card", async () => {
    const cardId = await createTestCard();
    await freezeCard(cardId);

    const { status, body } = await topUp(cardId, 100, "SOL");

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("frozen");
    expect(body.error).toContain("cannot top up");
  });

  it("should calculate correct fee breakdown", async () => {
    const cardId = await createTestCard();

    // --- SOL top-up: 5% fee, zero cashback ---
    const sol = await topUp(cardId, 500, "SOL");
    expect(sol.status).toBe(200);
    expect(sol.body.data.fee).toBe(25); // 5% of 500
    expect(sol.body.data.cashback).toBe(0);
    expect(sol.body.data.cardBalance).toBe(475); // 500 - 25 + 0

    // --- ECHO top-up: 1% fee, 2% cashback of fee ---
    const cardId2 = await createTestCard();
    const echo = await topUp(cardId2, 5_000, "ECHO");
    expect(echo.status).toBe(200);
    const fee = 50; // 1% of 5000
    const cashback = 1; // 2% of 50 = 1
    expect(echo.body.data.fee).toBe(fee);
    expect(echo.body.data.cashback).toBe(cashback);
    expect(echo.body.data.cardBalance).toBe(5000 - fee + cashback); // 4951

    // --- Zero amount should be rejected ---
    const zero = await topUp(cardId2, 0, "SOL");
    expect(zero.status).toBe(400);
    expect(zero.body.success).toBe(false);
  });
});