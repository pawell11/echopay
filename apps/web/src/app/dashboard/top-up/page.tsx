"use client";

import React, { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpCircle,
  ArrowUp,
  Check,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Coins,
  CircleDollarSign,
  Gem,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vantagepay/ui";
import { formatUSD, formatRelativeTime } from "@vantagepay/utils";
import { CardVisual } from "@/components/dashboard/card-visual";
import { cardsApi, topUpApi } from "@vantagepay/api";
import type { VirtualCard, Transaction } from "@vantagepay/api";

/* --------------------------------------------------------------------------
   Constants
   -------------------------------------------------------------------------- */

type TopUpCurrency = "SOL" | "USDT" | "ECHO";

const CURRENCY_OPTIONS: {
  value: TopUpCurrency;
  label: string;
  description: string;
  feeRate: number; // percentage
  hasCashback: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    value: "SOL",
    label: "SOL",
    description: "Native Solana token — fastest settlement",
    feeRate: 5,
    hasCashback: false,
    icon: Coins,
    accent: "from-purple-500 to-indigo-500",
  },
  {
    value: "USDT",
    label: "USDT",
    description: "The world's largest stablecoin — zero volatility",
    feeRate: 5,
    hasCashback: false,
    icon: CircleDollarSign,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    value: "ECHO",
    label: "$ECHO",
    description: "VantagePay native token — lowest fees, cashback rewards",
    feeRate: 1,
    hasCashback: true,
    icon: Gem,
    accent: "from-indigo-500 to-purple-500",
  },
];

/* --------------------------------------------------------------------------
   Sub-components
   -------------------------------------------------------------------------- */

function CurrencySelector({
  selected,
  onSelect,
}: {
  selected: TopUpCurrency;
  onSelect: (c: TopUpCurrency) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {CURRENCY_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              isSelected
                ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950"
            }`}
          >
            {/* Featured badge for ECHO */}
            {opt.value === "ECHO" && (
              <div className="absolute -top-2 right-2">
                <Badge variant="success" className="text-[10px] px-2 py-0 h-5">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />1% fee
                </Badge>
              </div>
            )}

            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.accent} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {opt.label}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                {opt.description}
              </p>
            </div>

            {/* Check mark when selected */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FeeBreakdown({
  amount,
  currency,
}: {
  amount: number;
  currency: TopUpCurrency;
}) {
  const option = CURRENCY_OPTIONS.find((o) => o.value === currency)!;
  const fee = (amount * option.feeRate) / 100;
  const net = amount - fee;
  const cashback = option.hasCashback ? (net * 2) / 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">Top-up amount</span>
        <span className="font-medium tabular-nums text-slate-900 dark:text-slate-50">
          {formatUSD(amount)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Fee ({option.feeRate}%)
        </span>
        <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
          −{formatUSD(fee)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          You receive
        </span>
        <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatUSD(net)}
        </span>
      </div>
      {cashback > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            2% cashback ($ECHO)
          </span>
          <span className="font-medium tabular-nums text-purple-600 dark:text-purple-400">
            +{formatUSD(cashback)}
          </span>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Top-Up Page
   -------------------------------------------------------------------------- */

export default function TopUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TopUpContent />
    </Suspense>
  );
}

function TopUpContent() {
  const searchParams = useSearchParams();
  const preselectedCardId = searchParams.get("card");
  const queryClient = useQueryClient();

  // Form state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    preselectedCardId,
  );
  const [currency, setCurrency] = useState<TopUpCurrency>("ECHO");
  const [amount, setAmount] = useState<string>("");
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Fetch cards
  const {
    data: cards,
    isLoading: cardsLoading,
    error: cardsError,
    refetch: refetchCards,
  } = useQuery({
    queryKey: ["topup-cards"],
    queryFn: async () => {
      const res = await cardsApi.list();
      if (!res.success) throw new Error(res.error);
      return (res.data ?? []).filter((c) => c.status === "active");
    },
  });

  // Fetch recent top-up transactions for selected card
  const {
    data: recentTxs,
    isLoading: txsLoading,
  } = useQuery({
    queryKey: ["topup-txs", selectedCardId],
    queryFn: async () => {
      const { transactionApi } = await import("@vantagepay/api");
      const res = await transactionApi.list(selectedCardId!);
      if (!res.success) throw new Error(res.error);
      return (res.data ?? []).filter((tx) => tx.type === "topup");
    },
    enabled: !!selectedCardId,
  });

  // Selected card object
  const selectedCard = useMemo(
    () => cards?.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  // Amount as number
  const amountNum = parseFloat(amount) || 0;

  // Handle top-up
  const handleTopUp = useCallback(async () => {
    if (!selectedCard || amountNum <= 0) return;

    setIsToppingUp(true);

    // Update card balance in cache
    const option = CURRENCY_OPTIONS.find((o) => o.value === currency)!;
    const fee = (amountNum * option.feeRate) / 100;
    const net = amountNum - fee;

    queryClient.setQueryData<VirtualCard[]>(["topup-cards"], (prev) =>
      prev?.map((c) =>
        c.id === selectedCard.id
          ? { ...c, balance: c.balance + Math.round(net * 100) }
          : c,
      ),
    );

    setIsToppingUp(false);
    setAmount("");
  }, [selectedCard, amountNum, currency, queryClient]);

  // Auto-select first card if none selected
  React.useEffect(() => {
    if (!selectedCardId && cards && cards.length > 0 && !preselectedCardId) {
      setSelectedCardId(cards[0]!.id);
    }
  }, [cards, selectedCardId, preselectedCardId]);

  /* ---- Loading ---- */
  if (cardsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  /* ---- Error ---- */
  if (cardsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
          Failed to load cards
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {(cardsError as Error).message}
        </p>
        <Button variant="outline" onClick={() => refetchCards()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  /* ---- No active cards ---- */
  if (!cards?.length) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Top Up Card
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add funds to your virtual cards
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowUpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No active cards
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Issue a card first, then come back to top up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Top Up Card
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add funds to your virtual cards with crypto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: form ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Card
            </label>
            <Select
              value={selectedCardId ?? ""}
              onValueChange={setSelectedCardId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a card" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.label || `Card ending in ${card.last4}`} —{" "}
                    {formatUSD(card.balance / 100)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pay with
            </label>
            <CurrencySelector selected={currency} onSelect={setCurrency} />
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium">
                $
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-8 pr-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-lg font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                USD
              </span>
            </div>
          </div>

          {/* Fee breakdown */}
          {amountNum > 0 && (
            <Card>
              <CardContent className="pt-4">
                <FeeBreakdown amount={amountNum} currency={currency} />
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <Button
            onClick={handleTopUp}
            size="lg"
            className="w-full font-semibold"
            disabled={!selectedCard || amountNum <= 0 || isToppingUp}
          >
            {isToppingUp ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing Top-Up...
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4 mr-2" />
                Top Up {amountNum > 0 ? formatUSD(amountNum) : ""}
              </>
            )}
          </Button>
        </div>

        {/* ── Right: card preview + recent history ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card preview */}
          {selectedCard && (
            <CardVisual
              last4={selectedCard.last4}
              expiryMonth={selectedCard.expiryMonth}
              expiryYear={selectedCard.expiryYear}
              brand={selectedCard.brand}
              balance={selectedCard.balance}
              status={selectedCard.status}
              label={selectedCard.label}
              showMaskedNumber
              className="w-full max-w-none"
            />
          )}

          {/* Recent top-ups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Top-Ups</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCardId ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  Select a card to view top-up history
                </p>
              ) : txsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : !recentTxs?.length ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  No top-ups yet for this card
                </p>
              ) : (
                <div className="space-y-1">
                  {recentTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <ArrowUpCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-900 dark:text-slate-50 font-medium truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatRelativeTime(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums shrink-0 ml-2">
                        +{formatUSD(Math.abs(tx.amount) / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
