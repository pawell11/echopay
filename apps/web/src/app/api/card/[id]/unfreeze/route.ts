/**
 * POST /api/card/[id]/unfreeze — Unfreeze a card (status → active)
 *
 * Reverts a previously frozen card back to active.
 */

import { NextResponse } from "next/server";
import { getStore, persistUnfreezeCard } from "@/lib/api-store";

import type { ApiResponse, VirtualCard } from "@vantagepay/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<VirtualCard>>> {
  const { id } = await params;
  const walletAddress = request.headers.get("x-wallet-address");

  // --- Auth guard ---
  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing x-wallet-address header" },
      { status: 400 },
    );
  }

  const { cards, cardOwners } = getStore();

  const owner = cardOwners.get(id);
  if (!owner || !cards.has(id)) {
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

  const card = cards.get(id)!;

  if (card.status === "closed") {
    return NextResponse.json(
      { success: false, error: "Cannot unfreeze a closed card" },
      { status: 400 },
    );
  }

  if (card.status === "active") {
    return NextResponse.json(
      { success: false, error: "Card is already active" },
      { status: 400 },
    );
  }

  // --- Unfreeze ---
  const activeCard: VirtualCard = {
    ...card,
    status: "active",
    frozenAt: null,
  };

  persistUnfreezeCard(id);

  return NextResponse.json(
    { success: true, data: activeCard },
    { status: 200 },
  );
}
