/**
 * API store — SQLite-backed persistence layer.
 *
 * Provides the getStore() / generateCardNumber() / etc. interface that
 * API routes expect, backed by better-sqlite3 instead of in-memory Maps.
 * Data survives server restarts.
 */
import { wallets, cards as cardDb, transactions as txDb } from "@/lib/db";
import type { VirtualCard, CardDetails, Transaction, UserProfile } from "@vantagepay/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function luhnCheckDigit(number: string): number {
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

export function generateCardNumber(): string {
  const prefix = "5573";
  let number = prefix;
  for (let i = 0; i < 11; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number + luhnCheckDigit(number);
}

export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function calculateFee(amount: number, currency: string): number {
  return currency === "ECHO" ? Math.round(amount * 0.01) : Math.round(amount * 0.05);
}

export function calculateCashback(fee: number, currency: string): number {
  return currency === "ECHO" ? Math.round(fee * 0.02) : 0;
}

// ---------------------------------------------------------------------------
// Store interface — re-built from SQLite on every getStore() call
// ---------------------------------------------------------------------------

interface Store {
  cards: Map<string, VirtualCard>;
  cardDetails: Map<string, CardDetails>;
  cardOwners: Map<string, string>;
  transactions: Transaction[];
}

export function getStore(): Store {
  const cards = new Map<string, VirtualCard>();
  const cardDetails = new Map<string, CardDetails>();
  const cardOwners = new Map<string, string>();
  const txs: Transaction[] = [];

  // Hydrate cards from SQLite
  const allCards = cardDb.getAll();
  for (const row of allCards) {
    const card: VirtualCard = {
      id: row.id,
      last4: row.last4,
      expiryMonth: row.expiry_month,
      expiryYear: row.expiry_year,
      brand: row.brand as VirtualCard["brand"],
      status: row.status as VirtualCard["status"],
      balance: row.balance,
      currency: row.currency,
      createdAt: row.created_at,
      frozenAt: row.frozen_at ?? null,
      label: row.label ?? null,
    };
    cards.set(row.id, card);

    // Full details from SQLite (card_number, cvv stored)
    const full = cardDb.getFullById(row.id);
    if (full) {
      cardDetails.set(row.id, {
        ...card,
        cardNumber: full.card_number,
        cvv: full.cvv,
      });
      cardOwners.set(row.id, full.wallet_address);
    }
  }

  // Hydrate transactions from SQLite
  const allTxs = txDb.getAll();
  for (const row of allTxs) {
    txs.push({
      id: row.id,
      cardId: row.card_id,
      walletAddress: row.wallet_address,
      type: row.type as Transaction["type"],
      amount: row.amount,
      currency: row.currency,
      merchant: row.merchant ?? undefined,
      status: row.status as Transaction["status"],
      txSignature: row.tx_signature ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    });
  }

  return { cards, cardDetails, cardOwners, transactions: txs };
}

// ---------------------------------------------------------------------------
// Persistence helpers — called by API route handlers for write operations
// ---------------------------------------------------------------------------

/** Create a new card + its full details + ownership record in SQLite. */
export function persistCreateCard(
  card: VirtualCard,
  cardNumber: string,
  cvv: string,
  walletAddress: string,
): void {
  wallets.getOrCreate(walletAddress);
  cardDb.create({
    id: card.id,
    walletAddress,
    cardNumber,
    last4: card.last4,
    cvv,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    brand: card.brand,
    balance: card.balance,
    label: card.label,
  });
}

/** Close a card (set status to 'closed') in SQLite. */
export function persistCloseCard(id: string): void {
  cardDb.updateStatus(id, "closed");
}

/** Freeze a card in SQLite. */
export function persistFreezeCard(id: string): void {
  cardDb.updateStatus(id, "frozen");
}

/** Unfreeze a card in SQLite. */
export function persistUnfreezeCard(id: string): void {
  cardDb.updateStatus(id, "active");
}

/** Update card balance in SQLite. */
export function persistUpdateBalance(id: string, delta: number): void {
  cardDb.updateBalance(id, delta);
}

/** Record a transaction in SQLite. */
export function persistCreateTx(params: {
  id: string;
  cardId: string;
  walletAddress: string;
  type: string;
  amount: number;
  currency?: string;
  merchant?: string | null;
  status?: string;
  txSignature?: string | null;
  description?: string | null;
}): void {
  txDb.create(params as Parameters<typeof txDb.create>[0]);
}