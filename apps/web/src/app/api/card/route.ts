/**
 * GET  /api/card         — List all cards owned by the requesting wallet
 * POST /api/card         — Create a new virtual card
 *
 * Authentication is simulated via the `x-wallet-address` request header.
 * In production this would be replaced with proper wallet signature verification.
 */

import { NextResponse } from "next/server";
import {
  getStore,
  generateCardNumber,
  generateCVV,
  generateId,
  persistCreateCard,
} from "@/lib/api-store";

import type { ApiResponse, VirtualCard } from "@vantagepay/api";

// ---------------------------------------------------------------------------
// GET — List cards
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<ApiResponse<VirtualCard[]>>> {
  const walletAddress = request.headers.get("x-wallet-address");

  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing x-wallet-address header" },
      { status: 400 },
    );
  }

  const { cards: allCards, cardOwners } = getStore();

  // Collect every card whose owner matches the given wallet
  const userCards: VirtualCard[] = [];
  for (const [cardId, owner] of cardOwners) {
    if (owner === walletAddress) {
      const card = allCards.get(cardId);
      if (card) userCards.push(card);
    }
  }

  return NextResponse.json(
    { success: true, data: userCards },
    { status: 200 },
  );
}

// ---------------------------------------------------------------------------
// POST — Create card
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<ApiResponse<VirtualCard>>> {
  const walletAddress = request.headers.get("x-wallet-address");

  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing x-wallet-address header" },
      { status: 400 },
    );
  }

  const store = getStore();
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setFullYear(expiryDate.getFullYear() + 3);

  const cardNumber = generateCardNumber();
  const cvv = generateCVV();
  const id = generateId("card");

  // Build public view (no sensitive fields)
  const card: VirtualCard = {
    id,
    last4: cardNumber.slice(-4),
    expiryMonth: String(expiryDate.getMonth() + 1).padStart(2, "0"),
    expiryYear: String(expiryDate.getFullYear()),
    brand: "mastercard",
    status: "active",
    balance: 0,
    currency: "USD",
    createdAt: now.toISOString(),
    frozenAt: null,
    label: null,
  };

  // Build full details (sensitive fields included)
  const details = {
    ...card,
    cardNumber,
    cvv,
  };

  // Persist to SQLite (replaces in-memory Map writes)
  persistCreateCard(card, cardNumber, cvv, walletAddress);

  return NextResponse.json(
    { success: true, data: card },
    { status: 201 },
  );
}
