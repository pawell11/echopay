/**
 * GET /api/user — Get user profile via x-wallet-address header
 */
import { NextResponse } from "next/server";
import { wallets } from "@/lib/db";
import { ensureDemoData } from "@/lib/api-helpers";
import type { ApiResponse, UserProfile } from "@vantagepay/api";

export async function GET(request: Request): Promise<NextResponse<ApiResponse<UserProfile>>> {
  ensureDemoData();
  const address = request.headers.get("x-wallet-address");
  if (!address) {
    return NextResponse.json({ success: false, error: "Missing x-wallet-address header" }, { status: 400 });
  }

  const w = wallets.getOrCreate(address);
  const profile: UserProfile = {
    walletAddress: w.address,
    tier: w.tier as "anonymous" | "verified",
    monthlyVolume: w.monthly_volume,
    totalCashback: w.total_cashback,
    createdAt: w.created_at,
  };

  return NextResponse.json({ success: true, data: profile });
}
