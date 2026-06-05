/**
 * GET    /api/card/[id]  — Full card details (number + CVV) for the owner
 * DELETE /api/card/[id]  — Close the card (permanent, cannot be reopened)
 */

import { NextResponse } from "next/server";
import { getStore } from "@/lib/api-store";

import type { ApiResponse, CardDetails, VirtualCard } from "@vantagepay/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCardAndOwner(
  cardId: string,
  walletAddress: string | null,
): { card: VirtualCard; details: CardDetails } | NextResponse<ApiResponse<never>> {
  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing x-wallet-address header" },
      { status: 400 },
    );
  }

  const { cards, cardDetails, cardOwners } = getStore();

  const owner = cardOwners.get(cardId);
  if (!owner || !cards.has(cardId)) {
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

  const card = cards.get(cardId)!;
  const details = cardDetails.get(cardId)!;

  return { card, details };
}

// ---------------------------------------------------------------------------
// GET — Card details (sensitive fields)
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<CardDetails>>> {
  const { id } = await params;
  const walletAddress = _request.headers.get("x-wallet-address");

  const result = getCardAndOwner(id, walletAddress);
  if (result instanceof NextResponse) return result;

  return NextResponse.json(
    { success: true, data: result.details },
    { status: 200 },
  );
}

// ---------------------------------------------------------------------------
// DELETE — Close card (permanent)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<VirtualCard>>> {
  const { id } = await params;
  const walletAddress = _request.headers.get("x-wallet-address");

  const result = getCardAndOwner(id, walletAddress);
  if (result instanceof NextResponse) return result;

  const { card } = result;

  if (card.status === "closed") {
    return NextResponse.json(
      { success: false, error: "Card is already closed" },
      { status: 400 },
    );
  }

  // Mark as closed — this is irreversible in the mock
  const closedCard: VirtualCard = {
    ...card,
    status: "closed",
  };

  const store = getStore();
  store.cards.set(id, closedCard);

  // Update details to stay in sync
  const details = store.cardDetails.get(id)!;
  store.cardDetails.set(id, { ...details, status: "closed" });

  return NextResponse.json(
    { success: true, data: closedCard },
    { status: 200 },
  );
}
