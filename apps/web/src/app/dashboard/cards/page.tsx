"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  Snowflake,
  Zap,
  XCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@vantagepay/ui";
import { formatUSD, formatDate } from "@vantagepay/utils";
import { CardVisual } from "@/components/dashboard/card-visual";
import { cardsApi } from "@vantagepay/api";
import type { VirtualCard } from "@vantagepay/api";

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------
   Sub-components
   -------------------------------------------------------------------------- */

/** Empty state when user has no cards. */
function EmptyCardsState({ onIssue }: { onIssue: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
          No virtual cards yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Issue your first virtual Mastercard in seconds. Works anywhere
          Mastercard is accepted online.
        </p>
        <Button onClick={onIssue} size="lg" className="font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Issue Your First Card
        </Button>
      </CardContent>
    </Card>
  );
}

/** Confirmation dialog for closing a card. */
function CloseCardDialog({
  open,
  onClose,
  onConfirm,
  cardLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cardLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to close{" "}
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {cardLabel}
            </span>
            ? This action cannot be undone. Any remaining balance will be
            forfeited.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <XCircle className="w-4 h-4 mr-1.5" />
            Close Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Issue card confirmation dialog. */
function IssueCardDialog({
  open,
  onClose,
  onConfirm,
  isIssuing,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isIssuing: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue a New Virtual Card</DialogTitle>
          <DialogDescription>
            You&apos;ll get a virtual Mastercard with a 16-digit number, CVV,
            and expiry — instantly. Free to issue, no strings attached.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Preview card */}
          <div className="flex justify-center">
            <div className="w-full max-w-[280px] h-44 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 p-5 flex flex-col justify-between border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[8px] font-bold">
                    E
                  </div>
                  <span className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                    VantagePay
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500/80" />
                  <div className="w-4 h-4 rounded-full bg-amber-500/80 -ml-1.5" />
                </div>
              </div>
              <div>
                <p className="font-mono text-sm tracking-[0.15em] text-white/50 mb-3">
                  •••• •••• •••• ••••
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  Pending issuance...
                </p>
              </div>
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-700 dark:text-indigo-300">
              <p className="font-medium">What you get:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-indigo-600/80 dark:text-indigo-400/80">
                <li>Instant 16-digit Mastercard number</li>
                <li>CVV and expiry date</li>
                <li>Works anywhere Mastercard is accepted</li>
                <li>Free to issue — zero upfront cost</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isIssuing}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isIssuing}>
            {isIssuing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Issuing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Confirm & Issue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Individual card detail card in the grid. */
function CardDetail({
  card,
  onFreezeToggle,
  onCloseCard,
}: {
  card: VirtualCard;
  onFreezeToggle: (card: VirtualCard) => void;
  onCloseCard: (card: VirtualCard) => void;
}) {
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card visual */}
      <div className="px-4 pt-4">
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
      </div>

      {/* Card details */}
      <CardContent className="space-y-3 pt-4">
        {/* Status + label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {cardStatusBadge(card.status)}
            {card.label && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Created {formatDate(card.createdAt)}
          </span>
        </div>

        {/* Balance */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current Balance
          </p>
          <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {formatUSD(card.balance / 100)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {card.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => onFreezeToggle(card)}
            >
              <Snowflake className="w-3 h-3 mr-1" />
              Freeze
            </Button>
          ) : card.status === "frozen" ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => onFreezeToggle(card)}
            >
              <Zap className="w-3 h-3 mr-1" />
              Unfreeze
            </Button>
          ) : null}

          {card.status !== "closed" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => onCloseCard(card)}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------------------
   Cards Page
   -------------------------------------------------------------------------- */

export default function CardsPage() {
  const queryClient = useQueryClient();

  // Dialogs
  const [issueOpen, setIssueOpen] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [closeTarget, setCloseTarget] = useState<VirtualCard | null>(null);

  // Fetch cards
  const {
    data: cards,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const res = await cardsApi.list();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  // Freeze / Unfreeze toggle
  const handleFreezeToggle = useCallback(
    (card: VirtualCard) => {
      // In production this would call the API:
      // if (card.status === "active") await cardsApi.freeze(card.id);
      // else await cardsApi.unfreeze(card.id);
      queryClient.setQueryData<VirtualCard[]>(["cards"], (prev) =>
        prev?.map((c) =>
          c.id === card.id
            ? {
                ...c,
                status: c.status === "active" ? "frozen" : "active",
                frozenAt:
                  c.status === "active" ? new Date().toISOString() : null,
              }
            : c,
        ),
      );
    },
    [queryClient],
  );

  // Issue card
  const handleIssueCard = useCallback(async () => {
    setIsIssuing(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    const newCard: VirtualCard = {
      id: `card_${Date.now()}`,
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      expiryMonth: String(Math.floor(1 + Math.random() * 12)).padStart(2, "0"),
      expiryYear: String(new Date().getFullYear() + 3),
      brand: "mastercard",
      status: "active",
      balance: 0,
      currency: "USD",
      createdAt: new Date().toISOString(),
      frozenAt: null,
      label: null,
    };

    queryClient.setQueryData<VirtualCard[]>(["cards"], (prev) =>
      prev ? [newCard, ...prev] : [newCard],
    );

    setIsIssuing(false);
    setIssueOpen(false);
  }, [queryClient]);

  // Close card
  const handleCloseCardConfirm = useCallback(() => {
    if (!closeTarget) return;
    queryClient.setQueryData<VirtualCard[]>(["cards"], (prev) =>
      prev?.map((c) =>
        c.id === closeTarget.id ? { ...c, status: "closed" as const } : c,
      ),
    );
    setCloseTarget(null);
  }, [closeTarget, queryClient]);

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-60 bg-slate-100 dark:bg-slate-800 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
          Failed to load cards
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

  /* ---- Empty state ---- */
  if (!cards?.length) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Virtual Cards
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your VantagePay virtual cards
            </p>
          </div>
        </div>
        <EmptyCardsState onIssue={() => setIssueOpen(true)} />

        <IssueCardDialog
          open={issueOpen}
          onClose={() => setIssueOpen(false)}
          onConfirm={handleIssueCard}
          isIssuing={isIssuing}
        />
      </div>
    );
  }

  /* ---- Cards grid ---- */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Virtual Cards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {cards.length} card{cards.length !== 1 ? "s" : ""} · Manage,
            freeze, and top up
          </p>
        </div>
        <Button onClick={() => setIssueOpen(true)} size="sm" className="font-semibold">
          <Plus className="w-4 h-4 mr-1.5" />
          Issue New Card
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <CardDetail
            key={card.id}
            card={card}
            onFreezeToggle={handleFreezeToggle}
            onCloseCard={setCloseTarget}
          />
        ))}
      </div>

      {/* Issue card dialog */}
      <IssueCardDialog
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onConfirm={handleIssueCard}
        isIssuing={isIssuing}
      />

      {/* Close card confirmation dialog */}
      <CloseCardDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleCloseCardConfirm}
        cardLabel={
          closeTarget
            ? closeTarget.label || `Card ending in ${closeTarget.last4}`
            : ""
        }
      />
    </div>
  );
}
