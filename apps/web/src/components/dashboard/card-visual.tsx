"use client";

import React from "react";
import { cn } from "@vantagepay/ui";
import { formatUSD, formatCardNumber } from "@vantagepay/utils";

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export interface CardVisualProps {
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  brand: "mastercard" | "visa";
  balance: number; // USD cents
  status: "active" | "frozen" | "closed";
  label?: string | null;
  className?: string;
  /** Show the full masked number "•••• •••• •••• 1234" instead of just last4 */
  showMaskedNumber?: boolean;
  /** Show brand logo instead of VantagePay logo */
  showBrandLogo?: boolean;
}

/* --------------------------------------------------------------------------
   Sub-components
   -------------------------------------------------------------------------- */

/** Tiny chip SVG icon — mimics the look of an EMV chip. */
function ChipIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-10 h-7 rounded-md bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 border border-amber-400/40 relative overflow-hidden shrink-0",
        className,
      )}
    >
      {/* Inner border */}
      <div className="absolute inset-[3px] rounded-[3px] border border-amber-400/30" />
      {/* Horizontal lines simulating chip contacts */}
      <div className="absolute top-1 left-1 right-1 h-[1px] bg-amber-400/40" />
      <div className="absolute top-[10px] left-1 right-1 h-[1px] bg-amber-400/40" />
      <div className="absolute top-[14px] left-1 right-1 h-[1px] bg-amber-400/40" />
      <div className="absolute top-[18px] left-1 right-1 h-[1px] bg-amber-400/40" />
      <div className="absolute bottom-1 left-1 right-1 h-[1px] bg-amber-400/40" />
      {/* Vertical dividers */}
      <div className="absolute inset-y-1 left-[10px] w-[1px] bg-amber-400/30" />
      <div className="absolute inset-y-1 right-[10px] w-[1px] bg-amber-400/30" />
    </div>
  );
}

/** Mastercard overlapping circles. */
function MastercardLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="w-7 h-7 rounded-full bg-red-500/80" />
      <div className="w-7 h-7 rounded-full bg-amber-500/80 -ml-2.5" />
    </div>
  );
}

/** Visa logo — simple wordmark. */
function VisaLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-white font-extrabold text-lg italic tracking-tight",
        className,
      )}
    >
      VISA
    </span>
  );
}

/* --------------------------------------------------------------------------
   CardVisual
   -------------------------------------------------------------------------- */

/**
 * Premium virtual card display component.
 *
 * A dark, metallic-gradient card with chip icon, brand logo, masked number,
 * balance, expiry, and optional frozen overlay. Responds to hover with a
 * subtle scale-up and shadow.
 */
export function CardVisual({
  last4,
  expiryMonth,
  expiryYear,
  brand,
  balance,
  status,
  label,
  className,
  showMaskedNumber = true,
  showBrandLogo = false,
}: CardVisualProps) {
  const isFrozen = status === "frozen";
  const isClosed = status === "closed";

  const formattedBalance = formatUSD(balance / 100);

  return (
    <div
      className={cn(
        "group relative w-full max-w-[360px] rounded-2xl p-[1px]",
        "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800",
        "transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10",
        isClosed && "opacity-60",
        className,
      )}
    >
      {/* Card body */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900",
          "p-5 md:p-6",
        )}
      >
        {/* Subtle shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />

        {/* ── Header row: brand / logo ── */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm shadow-indigo-600/30">
              E
            </div>
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">
              VantagePay
            </span>
          </div>

          {showBrandLogo ? (
            brand === "mastercard" ? (
              <MastercardLogo />
            ) : (
              <VisaLogo />
            )
          ) : (
            <MastercardLogo />
          )}
        </div>

        {/* ── Chip ── */}
        <div className="relative mb-6">
          <ChipIcon />
        </div>

        {/* ── Card number ── */}
        <div className="relative mb-5">
          {showMaskedNumber ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-base md:text-lg tracking-[0.15em] text-white/60">
                ••••
              </span>
              <span className="font-mono text-base md:text-lg tracking-[0.15em] text-white/60">
                ••••
              </span>
              <span className="font-mono text-base md:text-lg tracking-[0.15em] text-white/60">
                ••••
              </span>
              <span className="font-mono text-base md:text-lg tracking-[0.15em] text-white font-medium">
                {last4}
              </span>
            </div>
          ) : (
            <span className="font-mono text-base md:text-lg tracking-[0.15em] text-white font-medium">
              {last4}
            </span>
          )}
        </div>

        {/* ── Footer: balance + label, expiry ── */}
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">
              Balance
            </p>
            <p className="text-sm font-semibold text-white/90 tabular-nums">
              {formattedBalance}
            </p>
            {label && (
              <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                {label}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">
              Expires
            </p>
            <p className="text-sm font-semibold text-white/90 tabular-nums">
              {expiryMonth}/{expiryYear.slice(-2)}
            </p>
          </div>
        </div>

        {/* ── Status overlay (frozen / closed) ── */}
        {isFrozen && (
          <div className="absolute inset-0 rounded-2xl bg-red-950/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-red-300 font-semibold text-sm tracking-wide uppercase">
                Frozen
              </p>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="absolute inset-0 rounded-2xl bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
            <p className="text-slate-400 font-semibold text-sm tracking-wide uppercase">
              Closed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
