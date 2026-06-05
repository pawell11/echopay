/**
 * POST /api/topup — Process a top-up to a virtual card
 *
 * Simulates an on-chain top-up: deducts fees, calculates ECHO cashback,
 * updates the card balance, and records the transaction.
 *
 * Body: TopUpRequest { cardId, amount, currency, walletAddress }
 */

import { NextResponse } from "next/server";
import {
  getStore,
  calculateFee,
  calculateCashback,
  generateId,
  persistUpdateBalance,
  persistCreateTx,
} from "@/lib/api-store";

import type { ApiResponse, TopUpRequest, TopUpResponse } from "@vantagepay/api";

export async function POST(request: Request): Promise<NextResponse<ApiResponse<TopUpResponse>>> {
  // -----------------------------------------------------------------------
  // 1. Parse & validate body
  // -----------------------------------------------------------------------
  let body: TopUpRequest;
  try {
    body = (await request.json()) as TopUpRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { cardId, amount, currency, walletAddress } = body;

  if (!cardId || !currency || !walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: cardId, amount, currency, walletAddress" },
      { status: 400 },
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { success: false, error: "amount must be a positive number" },
      { status: 400 },
    );
  }

  // -----------------------------------------------------------------------
  // 2. Authorisation — must own the card
  // -----------------------------------------------------------------------
  const store = getStore();
  const owner = store.cardOwners.get(cardId);
  if (!owner || !store.cards.has(cardId)) {
    return NextResponse.json(
      { success: false, error: "Card not found" },
      { status: 404 },
    );
  }

  if (owner !== walletAddress) {
    return NextResponse.json(
      { success: false, error: "Access denied — you do not own this card" },
      { status: 403 },
    );
  }

  const card = store.cards.get(cardId)!;

  if (card.status !== "active") {
    return NextResponse.json(
      { success: false, error: `Card is ${card.status} — cannot top up` },
      { status: 400 },
    );
  }

  // -----------------------------------------------------------------------
  // 3. Calculate fee, cashback, and net credit
  // -----------------------------------------------------------------------
  const fee = calculateFee(amount, currency);
  const cashback = calculateCashback(fee, currency);
  const netCredit = amount - fee + cashback;

  // -----------------------------------------------------------------------
  // 4. Update card balance (store in cents)
  // -----------------------------------------------------------------------
const updatedCard = {
    ...card,
    balance: card.balance + netCredit,
  };
  // Persist to SQLite
  persistUpdateBalance(cardId, netCredit);

  // -----------------------------------------------------------------------
  // 5. Record transactions
  // -----------------------------------------------------------------------
  const now = new Date().toISOString();
  const txSignature = `sig_${Date.now().toString(36)}`;

  // Top-up transaction
  const topupData = {
    id: generateId("tx"),
    cardId,
    walletAddress,
    type: "topup",
    amount,
    currency,
    merchant: null,
    status: "completed",
    txSignature,
    description: `Top-up ${amount} ${currency} → Card ••••${card.last4}`,
  };
  persistCreateTx(topupData);

  // Fee transaction (if any)
  if (fee > 0) {
    persistCreateTx({
      id: generateId("tx"),
      cardId,
      walletAddress,
      type: "fee",
      amount: fee,
      currency,
      merchant: null,
      status: "completed",
      txSignature: null,
      description: `${currency === "ECHO" ? "1" : "5"}% fee on ${amount} ${currency} top-up`,
    });
  }

  // Cashback transaction (if any)
  if (cashback > 0) {
    persistCreateTx({
      id: generateId("tx"),
      cardId,
      walletAddress,
      type: "cashback",
      amount: cashback,
      currency: "ECHO",
      merchant: null,
      status: "completed",
      txSignature: null,
      description: "2% ECHO cashback on fee",
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        txSignature,
        cardBalance: updatedCard.balance,
        fee,
        cashback,
      },
    },
    { status: 200 },
  );
}
