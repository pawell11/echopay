/**
 * GET /api/transaction/[id] — Single transaction by ID
 */

import { NextResponse } from "next/server";
import { getStore } from "@/lib/api-store";

import type { ApiResponse, Transaction } from "@vantagepay/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Transaction>>> {
  const { id } = await params;

  const { transactions } = getStore();
  const tx = transactions.find((t) => t.id === id);

  if (!tx) {
    return NextResponse.json(
      { success: false, error: "Transaction not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { success: true, data: tx },
    { status: 200 },
  );
}
