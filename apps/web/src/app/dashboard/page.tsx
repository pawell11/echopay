"use client";

import React, { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Snowflake,
  ArrowUp,
  Zap,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  History,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "@vantagepay/ui";
import {
  formatUSD,
  formatDate,
  formatRelativeTime,
  truncateAddress,
} from "@vantagepay/utils";
import { useAppStore } from "@/lib/store";
import { StatsCard } from "@/components/dashboard/stats-card";
import { CardVisual } from "@/components/dashboard/card-visual";
import { cardsApi, transactionApi, userApi } from "@vantagepay/api";
import type { VirtualCard, Transaction, UserProfile } from "@vantagepay/api";
import Link from "next/link";

/* --------------------------------------------------------------------------
   Types & helpers
   -------------------------------------------------------------------------- */

type TxAmountDisplay = {
  value: string;
  isCredit: boolean;
};

function formatTxAmount(tx: Transaction): TxAmountDisplay {
  const isCredit = tx.type === "topup" || tx.type === "refund" || tx.type === "cashback";
  const absAmount = Math.abs(tx.amount);
  const sign = isCredit ? "+" : "−";
  return {
    value: `${sign}${formatUSD(absAmount / 100)}`,
    isCredit,
  };
}

function cardStatusBadge(status: VirtualCard["status"]) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "frozen":
      return <Badge variant="warning">Frozen</Badge>;
    case "closed":
      return <Badge variant="secondary">Closed</Badge>;
  }
}

function txStatusBadge(status: Transaction["status"]) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
  }
}

/* --------------------------------------------------------------------------
   Sub-components
   -------------------------------------------------------------------------- */

/** Displayed when no wallet is connected. */
function ConnectPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-6 flex flex-col items-center gap-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Connect your wallet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Connect a Solana wallet to manage your virtual cards, top up,
              and view transactions.
            </p>
          </div>
          <div className="mt-2">
            <Button
              size="lg"
              className="font-semibold"
              onClick={() => {
                // The sidebar has its own connect button; this is a visual prompt.
                // We can't directly trigger the modal here without react-ui.
                // Fallback: prompt user to use the sidebar button.
              }}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Phantom · Solflare · Backpack
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Card item displayed in the "Your Cards" section. */
function DashboardCardItem({ card }: { card: VirtualCard }) {
  const { setActiveCard } = useAppStore();

  return (
    <div className="group">
      <CardVisual
        last4={card.last4}
        expiryMonth={card.expiryMonth}
        expiryYear={card.expiryYear}
        brand={card.brand}
        balance={card.balance}
        status={card.status}
        label={card.label}
        showMaskedNumber
        className="w-full max-w-none"
      />

      {/* Quick actions row */}
      <div className="flex items-center gap-2 mt-3 px-1">
        {card.status === "active" ? (
          <Button variant="outline" size="sm" className="text-xs h-8">
            <Snowflake className="w-3 h-3 mr-1" />
            Freeze
          </Button>
        ) : card.status === "frozen" ? (
          <Button variant="outline" size="sm" className="text-xs h-8">
            <Zap className="w-3 h-3 mr-1" />
            Unfreeze
          </Button>
        ) : null}

        <Button variant="outline" size="sm" className="text-xs h-8" asChild>
          <Link href={`/dashboard/top-up?card=${card.id}`}>
            <ArrowUp className="w-3 h-3 mr-1" />
            Top Up
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 ml-auto"
          onClick={() => setActiveCard(card.id)}
          asChild
        >
          <Link href="/dashboard/cards">
            Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Error state for any query failure. */
function QueryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShieldAlert className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
        Failed to load data
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        Retry
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Dashboard Page
   -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();

  // Fetch cards from API
  const {
    data: cardsData,
    isLoading: cardsLoading,
    error: cardsError,
    refetch: refetchCards,
  } = useQuery({
    queryKey: ["dashboard-cards", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];
      const res = await cardsApi.list();
      if (!res.success) throw new Error(res.error);
      return (res.data ?? []).filter((c) => c.status !== "closed");
    },
    enabled: connected && !!publicKey,
  });

  // Fetch user profile from API
  const {
    data: userProfile,
  } = useQuery({
    queryKey: ["user-profile", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      const res = await userApi.profile(publicKey.toBase58());
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: connected && !!publicKey,
  });

  // Fetch recent transactions from API
  const {
    data: txsData,
    isLoading: txsLoading,
    error: txsError,
    refetch: refetchTxs,
  } = useQuery({
    queryKey: ["dashboard-transactions", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];
      const res = await transactionApi.list();
      if (!res.success) throw new Error(res.error);
      return (res.data ?? []).slice(0, 8);
    },
    enabled: connected && !!publicKey,
  });

  // Compute stats
  const stats = useMemo(() => {
    const cards = cardsData ?? [];
    const txs = txsData ?? [];

    const totalBalance = cards.reduce(
      (sum, c) => (c.status !== "closed" ? sum + c.balance : sum),
      0,
    );
    const activeCards = cards.filter(
      (c) => c.status === "active" || c.status === "frozen",
    );
    const monthlyVolume = userProfile?.monthlyVolume ?? 0;
    const totalCashback = userProfile?.totalCashback ?? 0;

    return {
      totalBalance: formatUSD(totalBalance / 100),
      cardsIssued: activeCards.length,
      monthlyVolume: formatUSD(monthlyVolume / 100),
      cashbackEarned: formatUSD(totalCashback / 100),
    };
  }, [cardsData, txsData]);

  const isCardsLoading = cardsLoading;
  const isTxsLoading = txsLoading;
  const hasCardsError = cardsError;
  const hasTxsError = txsError;

  /* ---- Not connected ---- */
  if (!connected) {
    return <ConnectPrompt />;
  }

  /* ---- Connected dashboard ---- */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Welcome header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome back
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-sm font-mono text-slate-500 dark:text-slate-400">
              {publicKey ? truncateAddress(publicKey.toBase58(), 6) : "—"}
            </code>
            <Badge variant={userProfile?.tier === "verified" ? "success" : "secondary"}>
              {userProfile?.tier === "verified" ? "Verified" : "Anonymous"} tier
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          icon={Wallet}
          label="Total Balance"
          value={stats.totalBalance}
          variant="indigo"
        />
        <StatsCard
          icon={CreditCard}
          label="Cards Issued"
          value={String(stats.cardsIssued)}
          variant="default"
        />
        <StatsCard
          icon={TrendingUp}
          label="Monthly Volume"
          value={stats.monthlyVolume}
          variant="emerald"
          trend={12.5}
        />
        <StatsCard
          icon={Gift}
          label="Cashback Earned"
          value={stats.cashbackEarned}
          variant="amber"
        />
      </div>

      {/* ── Your Cards ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Your Cards
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/cards">
              View all
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {isCardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : hasCardsError ? (
          <QueryError
            message={(cardsError as Error).message}
            onRetry={() => refetchCards()}
          />
        ) : !cardsData?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No cards yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">
                Issue your first virtual card to get started.
              </p>
              <Button size="sm" asChild>
                <Link href="/dashboard/cards">
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Issue New Card
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cardsData.map((card) => (
              <DashboardCardItem key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent Transactions ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Recent Transactions
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/transactions">
              View all
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {isTxsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : hasTxsError ? (
          <QueryError
            message={(txsError as Error).message}
            onRetry={() => refetchTxs()}
          />
        ) : !txsData?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No transactions yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Your transaction history will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {txsData.map((tx) => {
                const { value, isCredit } = formatTxAmount(tx);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-4 md:px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Left: description + meta */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === "topup"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                            : tx.type === "refund"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : tx.type === "fee"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            : tx.type === "cashback"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {tx.type === "topup" || tx.type === "cashback" ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : tx.type === "refund" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                          {tx.merchant || tx.description}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(tx.createdAt)} · Card ending {tx.cardId.slice(-4)}
                        </p>
                      </div>
                    </div>

                    {/* Right: amount + status */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isCredit
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-slate-50"
                        }`}
                      >
                        {value}
                      </span>
                      {txStatusBadge(tx.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
