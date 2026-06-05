/**
 * GET /api/transaction — List transactions with optional filters
 *
 * Query parameters:
 *   cardId   — filter by card (optional)
 *   type     — filter by type: purchase | topup | refund | fee (optional)
 *   limit    — max results (default 20, max 100)
 */

import { NextResponse } from "next/server";
import { getStore } from "@/lib/api-store";

import type { ApiResponse, Transaction } from "@vantagepay/api";

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Transaction[]>>> {
  const { searchParams } = new URL(request.url);

  const cardId = searchParams.get("cardId");
  const type = searchParams.get("type");
  const rawLimit = searchParams.get("limit");

  // Parse & clamp limit
  let limit = 20;
  if (rawLimit) {
    const parsed = parseInt(rawLimit, 10);
    if (!isNaN(parsed)) {
      limit = Math.min(Math.max(1, parsed), 100);
    }
  }

  const { transactions } = getStore();

  // Filter
  let filtered = transactions;

  if (cardId) {
    filtered = filtered.filter((tx) => tx.cardId === cardId);
  }

  if (type) {
    filtered = filtered.filter((tx) => tx.type === type);
  }

  // Sort newest first → limit
  const result = [...filtered]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json(
    { success: true, data: result },
    { status: 200 },
  );
}
