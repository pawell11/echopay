/**
 * In-memory API store for VantagePay mock backend.
 *
 * Simulates a real card issuer database. All data lives in process memory
 * and resets on server restart — replace with a real database (e.g. Postgres,
 * PlanetScale, or Redis) for production.
 */

import type {
  VirtualCard,
  CardDetails,
  Transaction,
  UserProfile,
} from "@vantagepay/api";

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface Store {
  /** Card public metadata keyed by card ID */
  cards: Map<string, VirtualCard>;
  /** Full card details (number, CVV) keyed by card ID */
  cardDetails: Map<string, CardDetails>;
  /** cardId → walletAddress ownership lookup */
  cardOwners: Map<string, string>;
  /** All transactions across all wallets */
  transactions: Transaction[];
}

const store: Store = {
  cards: new Map(),
  cardDetails: new Map(),
  cardOwners: new Map(),
  transactions: [],
};

let seeded = false;

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function getStore(): Store {
  if (!seeded) {
    seedStore();
    seeded = true;
  }
  return store;
}

/**
 * Generate a valid 16-digit Mastercard PAN using a known BIN prefix
 * and Luhn check digit.
 */
export function generateCardNumber(): string {
  const prefix = "5573"; // Mastercard BIN
  let number = prefix;
  for (let i = 0; i < 11; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number + calculateLuhnCheckDigit(number);
}

/** Generate a 3-digit random CVV */
export function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/** Fee calculation: 5 % for SOL/USDT, 1 % for ECHO */
export function calculateFee(amount: number, currency: string): number {
  if (currency === "ECHO") return Math.round(amount * 0.01);
  return Math.round(amount * 0.05);
}

/** Cashback: 2 % of the fee when paying with ECHO, zero otherwise */
export function calculateCashback(fee: number, currency: string): number {
  return currency === "ECHO" ? Math.round(fee * 0.02) : 0;
}

/** Simple pseudo-random ID for demo records */
export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Luhn algorithm
// ---------------------------------------------------------------------------

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
// Seed demo data
// ---------------------------------------------------------------------------

function seedStore(): void {
  const wallet = "DemoWallet11111111111111111111111111111";
  const now = Date.now();
  const day = 86_400_000;

  // --- Card 1 (active) ---
  const card1: VirtualCard = {
    id: "card_demo_1",
    last4: "3456",
    expiryMonth: "12",
    expiryYear: String(new Date(now + day * 365 * 3).getFullYear()),
    brand: "mastercard",
    status: "active",
    balance: 125_00, // $125.00 in cents
    currency: "USD",
    createdAt: new Date(now - day * 30).toISOString(),
    frozenAt: null,
    label: "Daily Spend",
  };

  const card1Details: CardDetails = {
    ...card1,
    cardNumber: "5573123400003456",
    cvv: "781",
  };

  store.cards.set(card1.id, card1);
  store.cardDetails.set(card1.id, card1Details);
  store.cardOwners.set(card1.id, wallet);

  // --- Card 2 (frozen) ---
  const card2: VirtualCard = {
    id: "card_demo_2",
    last4: "7890",
    expiryMonth: "06",
    expiryYear: String(new Date(now + day * 365 * 2).getFullYear()),
    brand: "mastercard",
    status: "frozen",
    balance: 42_50, // $42.50 in cents
    currency: "USD",
    createdAt: new Date(now - day * 14).toISOString(),
    frozenAt: new Date(now - day * 2).toISOString(),
    label: "Travel Card",
  };

  const card2Details: CardDetails = {
    ...card2,
    cardNumber: "5573123400007890",
    cvv: "429",
  };

  store.cards.set(card2.id, card2);
  store.cardDetails.set(card2.id, card2Details);
  store.cardOwners.set(card2.id, wallet);

  // --- Demo transactions ---
  store.transactions = [
    {
      id: "tx_demo_1",
      cardId: "card_demo_1",
      type: "topup",
      amount: 200_00,
      currency: "USDT",
      merchant: null,
      status: "completed",
      txSignature: "mock_sig_topup_1",
      createdAt: new Date(now - day * 25).toISOString(),
      description: "Top-up 200 USDT → Card Daily Spend",
    },
    {
      id: "tx_demo_2",
      cardId: "card_demo_1",
      type: "purchase",
      amount: 45_99,
      currency: "USD",
      merchant: "Amazon Web Services",
      status: "completed",
      txSignature: null,
      createdAt: new Date(now - day * 20).toISOString(),
      description: "Purchase at Amazon Web Services",
    },
    {
      id: "tx_demo_3",
      cardId: "card_demo_1",
      type: "purchase",
      amount: 12_50,
      currency: "USD",
      merchant: "Netflix",
      status: "completed",
      txSignature: null,
      createdAt: new Date(now - day * 15).toISOString(),
      description: "Purchase at Netflix",
    },
    {
      id: "tx_demo_4",
      cardId: "card_demo_2",
      type: "topup",
      amount: 100_00,
      currency: "SOL",
      merchant: null,
      status: "completed",
      txSignature: "mock_sig_topup_2",
      createdAt: new Date(now - day * 10).toISOString(),
      description: "Top-up 100 SOL → Card Travel Card",
    },
    {
      id: "tx_demo_5",
      cardId: "card_demo_2",
      type: "purchase",
      amount: 57_50,
      currency: "USD",
      merchant: "Uber",
      status: "completed",
      txSignature: null,
      createdAt: new Date(now - day * 5).toISOString(),
      description: "Purchase at Uber",
    },
    {
      id: "tx_demo_6",
      cardId: "card_demo_1",
      type: "fee",
      amount: 10_00,
      currency: "USDT",
      merchant: null,
      status: "completed",
      txSignature: null,
      createdAt: new Date(now - day * 25).toISOString(),
      description: "5 % fee on 200 USDT top-up",
    },
    {
      id: "tx_demo_7",
      cardId: "card_demo_2",
      type: "fee",
      amount: 5_00,
      currency: "SOL",
      merchant: null,
      status: "completed",
      txSignature: null,
      createdAt: new Date(now - day * 10).toISOString(),
      description: "5 % fee on 100 SOL top-up",
    },
  ];
}