/**
 * Shared helpers for VantagePay API routes — SQLite-backed.
 */
import { wallets, cards, transactions } from "@/lib/db";

// ---------------------------------------------------------------------------
// Card generation
// ---------------------------------------------------------------------------

export function generateCardNumber(): string {
  const prefix = "5573";
  let number = prefix;
  for (let i = 0; i < 11; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number + calculateLuhnCheckDigit(number);
}

export function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export function calculateFee(amount: number, currency: string): number {
  return currency === "ECHO" ? Math.round(amount * 0.01) : Math.round(amount * 0.05);
}

export function calculateCashback(fee: number, currency: string): number {
  return currency === "ECHO" ? Math.round(fee * 0.02) : 0;
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function calculateLuhnCheckDigit(number: string): number {
  const digits = number.split("").map(Number);
  let sum = 0;
  let isEven = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i]!;
    if (isEven) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
    isEven = !isEven;
  }
  return (10 - (sum % 10)) % 10;
}

// ---------------------------------------------------------------------------
// Seed demo data (idempotent — only if wallet doesn't exist)
// ---------------------------------------------------------------------------

const DEMO_WALLET = "EziCBvwz9QKKKeVPG5zZA2sGTJfZUikhgSMMnJ5tBc9V";

export function ensureDemoData(): void {
  if (wallets.get(DEMO_WALLET)) return;

  wallets.upsert(DEMO_WALLET, "anonymous", 500_00, 0);

  const card1 = cards.create({
    id: "card_demo_1",
    walletAddress: DEMO_WALLET,
    cardNumber: generateCardNumber(),
    last4: "3456",
    cvv: generateCVV(),
    expiryMonth: "12",
    expiryYear: String(new Date().getFullYear() + 3),
    balance: 125_00,
    label: "Daily Spend",
  });

  const card2 = cards.create({
    id: "card_demo_2",
    walletAddress: DEMO_WALLET,
    cardNumber: generateCardNumber(),
    last4: "7890",
    cvv: generateCVV(),
    expiryMonth: "06",
    expiryYear: String(new Date().getFullYear() + 2),
    balance: 42_50,
    label: "Travel Card",
  });
  cards.updateStatus("card_demo_2", "frozen");

  const txData = [
    { id: "tx_demo_1", cardId: "card_demo_1", type: "topup", amount: 200_00, currency: "USDT", merchant: null, status: "completed", txSignature: null, description: "Top-up 200 USDT" },
    { id: "tx_demo_2", cardId: "card_demo_1", type: "purchase", amount: -45_99, currency: "USD", merchant: "AWS", status: "completed", txSignature: null, description: "AWS Cloud Services" },
    { id: "tx_demo_3", cardId: "card_demo_1", type: "purchase", amount: -12_50, currency: "USD", merchant: "Netflix", status: "completed", txSignature: null, description: "Netflix Monthly" },
    { id: "tx_demo_4", cardId: "card_demo_2", type: "topup", amount: 100_00, currency: "SOL", merchant: null, status: "completed", txSignature: null, description: "Top-up 100 SOL" },
    { id: "tx_demo_5", cardId: "card_demo_2", type: "purchase", amount: -57_50, currency: "USD", merchant: "Uber", status: "completed", txSignature: null, description: "Uber Ride" },
  ];

  const now = Date.now();
  txData.forEach((t, i) => {
    transactions.create({
      ...t,
      walletAddress: DEMO_WALLET,
      createdAt: new Date(now - (5 - i) * 7 * 86400000).toISOString(),
    });
  });
}
