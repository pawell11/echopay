/**
 * SQLite database layer for VantagePay API.
 *
 * Replaces in-memory mock store with persistent SQLite via better-sqlite3.
 * Single database file at /root/vantagepay/data/vantagepay.db — survives restarts.
 */
import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.resolve(process.cwd(), "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "vantagepay.db");

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------------------------------------------------------------------------
// Schema — idempotent CREATE TABLE IF NOT EXISTS
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY,
    tier TEXT NOT NULL DEFAULT 'anonymous',
    monthly_volume INTEGER NOT NULL DEFAULT 0,
    total_cashback INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    card_number TEXT NOT NULL UNIQUE,
    last4 TEXT NOT NULL,
    cvv TEXT NOT NULL,
    expiry_month TEXT NOT NULL,
    expiry_year TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'mastercard',
    status TEXT NOT NULL DEFAULT 'active',
    balance INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    label TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    frozen_at TEXT,
    FOREIGN KEY (wallet_address) REFERENCES wallets(address)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    merchant TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    tx_signature TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (card_id) REFERENCES cards(id),
    FOREIGN KEY (wallet_address) REFERENCES wallets(address)
  );

  CREATE INDEX IF NOT EXISTS idx_cards_wallet ON cards(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_tx_card ON transactions(card_id);
  CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC);
`);

// ---------------------------------------------------------------------------
// Prepared statements — compiled once, reused
// ---------------------------------------------------------------------------

// -- Wallets --
const stmtUpsertWallet = db.prepare(`
  INSERT INTO wallets (address, tier, monthly_volume, total_cashback)
  VALUES (@address, @tier, @monthlyVolume, @totalCashback)
  ON CONFLICT(address) DO UPDATE SET
    tier = excluded.tier,
    monthly_volume = excluded.monthly_volume,
    total_cashback = excluded.total_cashback
`);

const stmtGetWallet = db.prepare(`
  SELECT * FROM wallets WHERE address = ?
`);

// -- Cards --
const stmtInsertCard = db.prepare(`
  INSERT INTO cards (id, wallet_address, card_number, last4, cvv,
    expiry_month, expiry_year, brand, status, balance, currency, label, created_at)
  VALUES (@id, @walletAddress, @cardNumber, @last4, @cvv,
    @expiryMonth, @expiryYear, @brand, @status, @balance, @currency, @label, @createdAt)
`);

const stmtGetCardsByWallet = db.prepare(`
  SELECT id, last4, expiry_month, expiry_year, brand, status,
         balance, currency, label, created_at, frozen_at
  FROM cards WHERE wallet_address = ? ORDER BY created_at DESC
`);

const stmtGetCardById = db.prepare(`
  SELECT * FROM cards WHERE id = ?
`);

const stmtUpdateCardStatus = db.prepare(`
  UPDATE cards SET status = @status, frozen_at = @frozenAt WHERE id = @id
`);

const stmtUpdateCardBalance = db.prepare(`
  UPDATE cards SET balance = balance + @delta WHERE id = @id
`);

const stmtDeleteCard = db.prepare(`
  DELETE FROM cards WHERE id = ?
`);

// -- Transactions --
const stmtInsertTx = db.prepare(`
  INSERT INTO transactions (id, card_id, wallet_address, type, amount,
    currency, merchant, status, tx_signature, description, created_at)
  VALUES (@id, @cardId, @walletAddress, @type, @amount,
    @currency, @merchant, @status, @txSignature, @description, @createdAt)
`);

const stmtGetTxsByWallet = db.prepare(`
  SELECT * FROM transactions WHERE wallet_address = ?
  ORDER BY created_at DESC LIMIT ?
`);

const stmtGetAllTxs = db.prepare(`
  SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?
`);

const stmtGetTxsByCard = db.prepare(`
  SELECT * FROM transactions WHERE card_id = ?
  ORDER BY created_at DESC LIMIT ?
`);

const stmtGetTxById = db.prepare(`
  SELECT * FROM transactions WHERE id = ?
`);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Row shape returned for wallet profile */
export interface WalletRow {
  address: string;
  tier: string;
  monthly_volume: number;
  total_cashback: number;
  created_at: string;
}

/** Row shape for card (public fields only — no card_number/cvv) */
export interface CardRow {
  id: string;
  last4: string;
  expiry_month: string;
  expiry_year: string;
  brand: string;
  status: string;
  balance: number;
  currency: string;
  label: string | null;
  created_at: string;
  frozen_at: string | null;
}

/** Full card row including sensitive fields */
export interface CardRowFull extends CardRow {
  wallet_address: string;
  card_number: string;
  cvv: string;
}

/** Transaction row */
export interface TxRow {
  id: string;
  card_id: string;
  wallet_address: string;
  type: string;
  amount: number;
  currency: string;
  merchant: string | null;
  status: string;
  tx_signature: string | null;
  description: string | null;
  created_at: string;
}

export const wallets = {
  upsert(address: string, tier = "anonymous", monthlyVolume = 0, totalCashback = 0) {
    return stmtUpsertWallet.run({ address, tier, monthlyVolume, totalCashback });
  },
  get(address: string): WalletRow | undefined {
    return stmtGetWallet.get(address) as WalletRow | undefined;
  },
  getOrCreate(address: string): WalletRow {
    const existing = wallets.get(address);
    if (existing) return existing;
    wallets.upsert(address);
    return wallets.get(address)!;
  },
};

export const cards = {
  create(params: {
    id: string;
    walletAddress: string;
    cardNumber: string;
    last4: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    brand?: string;
    balance?: number;
    label?: string | null;
  }): CardRow {
    stmtInsertCard.run({
      ...params,
      label: params.label ?? null,
      brand: params.brand ?? "mastercard",
      status: "active",
      balance: params.balance ?? 0,
      currency: "USD",
      createdAt: new Date().toISOString(),
    });
    return cards.getById(params.id)!;
  },

  getByWallet(walletAddress: string): CardRow[] {
    return stmtGetCardsByWallet.all(walletAddress) as CardRow[];
  },

  getAll(): CardRow[] {
    const stmt = db.prepare("SELECT id, last4, expiry_month, expiry_year, brand, status, balance, currency, label, created_at, frozen_at FROM cards ORDER BY created_at DESC");
    return stmt.all() as CardRow[];
  },

  getById(id: string): CardRow | undefined {
    return stmtGetCardById.get(id) as CardRow | undefined;
  },

  getFullById(id: string): CardRowFull | undefined {
    return stmtGetCardById.get(id) as CardRowFull | undefined;
  },

  updateStatus(id: string, status: string) {
    return stmtUpdateCardStatus.run({
      id,
      status,
      frozenAt: status === "frozen" ? new Date().toISOString() : null,
    });
  },

  updateBalance(id: string, delta: number) {
    return stmtUpdateCardBalance.run({ id, delta });
  },

  deleteCard(id: string) {
    return stmtDeleteCard.run(id);
  },
};

export const transactions = {
  create(params: {
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
    createdAt?: string;
  }): TxRow {
    stmtInsertTx.run({
      ...params,
      merchant: params.merchant ?? null,
      txSignature: params.txSignature ?? null,
      description: params.description ?? null,
      currency: params.currency ?? "USD",
      status: params.status ?? "completed",
      createdAt: params.createdAt ?? new Date().toISOString(),
    });
    return transactions.getById(params.id)!;
  },

  getByWallet(walletAddress: string, limit = 50): TxRow[] {
    return stmtGetTxsByWallet.all(walletAddress, limit) as TxRow[];
  },

  getAll(limit = 200): TxRow[] {
    return stmtGetAllTxs.all(limit) as TxRow[];
  },

  getByCard(cardId: string, limit = 50): TxRow[] {
    return stmtGetTxsByCard.all(cardId, limit) as TxRow[];
  },

  getById(id: string): TxRow | undefined {
    return stmtGetTxById.get(id) as TxRow | undefined;
  },
};

export default db;