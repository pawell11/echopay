/**
 * POST /api/card/[id]/freeze — Freeze a card (status → frozen)
 *
 * Frozen cards cannot be used for purchases until unfrozen.
 */

import { NextResponse } from "next/server";
import { getStore, persistFreezeCard } from "@/lib/api-store";

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
      { success: false, error: "Cannot freeze a closed card" },
      { status: 400 },
    );
  }

  if (card.status === "frozen") {
    return NextResponse.json(
      { success: false, error: "Card is already frozen" },
      { status: 400 },
    );
  }

  // --- Freeze ---
  const frozenCard: VirtualCard = {
    ...card,
    status: "frozen",
    frozenAt: new Date().toISOString(),
  };

  persistFreezeCard(id);

  return NextResponse.json(
    { success: true, data: frozenCard },
    { status: 200 },
  );
}
