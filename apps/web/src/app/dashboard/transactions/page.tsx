"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  ReceiptText,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
  X,
  RefreshCw,
  ShieldAlert,
  History,
  Search,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vantagepay/ui";
import { formatUSD, formatDate, formatRelativeTime, truncateAddress } from "@vantagepay/utils";
import { transactionApi, cardsApi } from "@vantagepay/api";
import type { Transaction, VirtualCard } from "@vantagepay/api";

/* --------------------------------------------------------------------------
   Constants
   -------------------------------------------------------------------------- */

const TX_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "purchase", label: "Purchases" },
  { value: "topup", label: "Top-Ups" },
  { value: "refund", label: "Refunds" },
  { value: "fee", label: "Fees" },
  { value: "cashback", label: "Cashback" },
];

const PAGE_SIZE = 10;

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

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

function txTypeIcon(type: Transaction["type"]) {
  const base =
    "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "topup":
      return (
        <div className={`${base} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400`}>
          <ArrowUpCircle className="w-4 h-4" />
        </div>
      );
    case "refund":
      return (
        <div className={`${base} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
          <RotateCcw className="w-4 h-4" />
        </div>
      );
    case "cashback":
      return (
        <div className={`${base} bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400`}>
          <ReceiptText className="w-4 h-4" />
        </div>
      );
    case "fee":
      return (
        <div className={`${base} bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`}>
          <ReceiptText className="w-4 h-4" />
        </div>
      );
    case "purchase":
    default:
      return (
        <div className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
          <ArrowDownCircle className="w-4 h-4" />
        </div>
      );
  }
}

function formatTxAmount(tx: Transaction): {
  value: string;
  isCredit: boolean;
} {
  const isCredit =
    tx.type === "topup" || tx.type === "refund" || tx.type === "cashback";
  const absAmount = Math.abs(tx.amount);
  const sign = isCredit ? "+" : "−";
  return {
    value: `${sign}${formatUSD(absAmount / 100)}`,
    isCredit,
  };
}

/* --------------------------------------------------------------------------
   Sub-components
   -------------------------------------------------------------------------- */

/** Filter bar for transactions. */
function FilterBar({
  typeFilter,
  onTypeChange,
  cardFilter,
  onCardChange,
  onClear,
  hasFilters,
  cards,
}: {
  typeFilter: string;
  onTypeChange: (v: string) => void;
  cardFilter: string;
  onCardChange: (v: string) => void;
  onClear: () => void;
  hasFilters: boolean;
  cards: VirtualCard[];
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Type filter */}
      <div className="flex items-center gap-2">
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TX_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Card filter */}
      <div className="flex items-center gap-2">
        <Select value={cardFilter} onValueChange={onCardChange}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="All Cards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cards</SelectItem>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.label || `Card ····${card.last4}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs h-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <X className="w-3 h-3 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

/** Transaction row — desktop table row. */
function TransactionRow({ tx, cards }: { tx: Transaction; cards: VirtualCard[] }) {
  const { value, isCredit } = formatTxAmount(tx);
  const card = cards.find((c) => c.id === tx.cardId);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
      {/* Date */}
      <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
            {formatDate(tx.createdAt)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatRelativeTime(tx.createdAt)}
          </p>
        </div>
      </td>

      {/* Description */}
      <td className="px-4 md:px-6 py-3.5 min-w-[180px]">
        <div className="flex items-center gap-2.5">
          {txTypeIcon(tx.type)}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate max-w-[200px]">
              {tx.merchant || tx.description}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
              {tx.type}
            </p>
          </div>
        </div>
      </td>

      {/* Card */}
      <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
        {card ? (
          <div>
            <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
              ••••{card.last4}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {card.label || "—"}
            </p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>

      {/* Amount */}
      <td className="px-4 md:px-6 py-3.5 whitespace-nowrap text-right">
        <span
          className={`text-sm font-semibold tabular-nums ${
            isCredit
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-900 dark:text-slate-50"
          }`}
        >
          {value}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
        {txStatusBadge(tx.status)}
      </td>

      {/* TX Signature */}
      <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
        {tx.txSignature ? (
          <a
            href={`https://solscan.io/tx/${tx.txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            {truncateAddress(tx.txSignature, 6)}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
    </tr>
  );
}

/** Mobile-optimized transaction card (visible on small screens). */
function TransactionMobileCard({ tx, cards }: { tx: Transaction; cards: VirtualCard[] }) {
  const { value, isCredit } = formatTxAmount(tx);
  const card = cards.find((c) => c.id === tx.cardId);

  return (
    <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {txTypeIcon(tx.type)}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
              {tx.merchant || tx.description}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                {tx.type}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                •
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {formatRelativeTime(tx.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span
            className={`text-sm font-semibold tabular-nums ${
              isCredit
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-900 dark:text-slate-50"
            }`}
          >
            {value}
          </span>
          <div className="mt-0.5">{txStatusBadge(tx.status)}</div>
        </div>
      </div>

      {/* Extra row: card + signature */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
        {card ? (
          <span className="text-xs font-mono text-slate-400">
            Card ••••{card.last4}
          </span>
        ) : (
          <span />
        )}
        {tx.txSignature ? (
          <a
            href={`https://solscan.io/tx/${tx.txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {truncateAddress(tx.txSignature, 6)}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Transactions Page
   -------------------------------------------------------------------------- */

export default function TransactionsPage() {
  // Filter state
  const [typeFilter, setTypeFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch cards for filter dropdown
  const { data: cardsList } = useQuery({
    queryKey: ["tx-cards"],
    queryFn: async () => {
      const res = await cardsApi.list();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  // Fetch transactions
  const {
    data: allTransactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await transactionApi.list();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  // Apply filters
  const filtered = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (cardFilter !== "all" && tx.cardId !== cardFilter) return false;
      return true;
    });
  }, [allTransactions, typeFilter, cardFilter]);

  // Paginate
  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;
  const hasFilters = typeFilter !== "all" || cardFilter !== "all";

  const handleClearFilters = useCallback(() => {
    setTypeFilter("all");
    setCardFilter("all");
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  /* ---- Loading ---- */
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
          Failed to load transactions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {(error as Error).message}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Transactions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " matching filters" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setVisibleCount(PAGE_SIZE);
        }}
        cardFilter={cardFilter}
        onCardChange={(v) => {
          setCardFilter(v);
          setVisibleCount(PAGE_SIZE);
        }}
        onClear={handleClearFilters}
        hasFilters={hasFilters}
        cards={cardsList ?? []}
      />

      {/* Transactions */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            {hasFilters ? (
              <>
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No transactions match your filters
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">
                  Try clearing your filters or adjusting the criteria.
                </p>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No transactions yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Your transaction history will appear here once you start
                  using your cards.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Card
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Signature
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visible.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} cards={cardsList ?? []} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden">
            <Card className="overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visible.map((tx) => (
                  <TransactionMobileCard key={tx.id} tx={tx} cards={cardsList ?? []} />
                ))}
              </div>
            </Card>
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="text-sm"
              >
                <ChevronDown className="w-4 h-4 mr-1.5" />
                Load More ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
