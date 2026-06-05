/**
 * GET /api/user/[address] — User profile by wallet address
 *
 * Aggregates card count, monthly volume, and total cashback from
 * the in-memory store.
 */

import { NextResponse } from "next/server";
import { getStore } from "@/lib/api-store";

import type { ApiResponse, UserProfile } from "@vantagepay/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const { address: walletAddress } = await params;

  const { cards, cardOwners, transactions } = getStore();

  // Find all cards owned by this wallet
  const ownedCardIds: string[] = [];
  for (const [cardId, owner] of cardOwners) {
    if (owner === walletAddress) {
      ownedCardIds.push(cardId);
    }
  }

  if (ownedCardIds.length === 0) {
    return NextResponse.json(
      { success: false, error: "No user found for this wallet address" },
      { status: 404 },
    );
  }

  // Calculate monthly volume (last 30 days in cents)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let monthlyVolume = 0;
  let totalCashback = 0;

  for (const tx of transactions) {
    if (!ownedCardIds.includes(tx.cardId)) continue;

    const txTime = new Date(tx.createdAt).getTime();

    if (txTime >= thirtyDaysAgo) {
      if (tx.type === "topup" && tx.currency !== "ECHO") {
        // Only count fiat/crypto top-ups toward monthly volume
        monthlyVolume += tx.amount;
      }
    }

    // Accumulate cashback (ECHO top-up transactions that are cashback rewards)
    if (
      tx.type === "topup" &&
      tx.currency === "ECHO" &&
      tx.description.toLowerCase().includes("cashback")
    ) {
      totalCashback += tx.amount;
    }
  }

  // Determine tier based on monthly volume
  const tier: "anonymous" | "verified" =
    monthlyVolume >= 500_00 ? "verified" : "anonymous";

  // Derive the earliest card creation date as the user's "createdAt"
  let createdAt = new Date().toISOString();
  for (const cid of ownedCardIds) {
    const card = cards.get(cid);
    if (card && card.createdAt < createdAt) {
      createdAt = card.createdAt;
    }
  }

  const profile: UserProfile = {
    id: `user_${walletAddress.slice(0, 12)}`,
    walletAddress,
    tier,
    monthlyVolume,
    cardsCount: ownedCardIds.length,
    totalCashback,
    createdAt,
  };

  return NextResponse.json(
    { success: true, data: profile },
    { status: 200 },
  );
}
