"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-phantom";
import {
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import { Toaster } from "@vantagepay/ui";
import { Sidebar } from "@/components/dashboard/sidebar";

// CSS required by Solana wallet adapter UI
import "@solana/wallet-adapter-react-ui/styles.css";

/* --------------------------------------------------------------------------
   Dashboard Layout
   -------------------------------------------------------------------------- */

/**
 * Root layout for the authenticated dashboard area.
 *
 * Wraps children in Solana wallet providers and renders the persistent
 * sidebar + main content shell.
 *
 * Note: TanStack QueryProvider and ThemeProvider are in the root layout
 * (apps/web/src/app/layout.tsx) — they already wrap everything.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Solana connection endpoint — env var with mainnet fallback
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC ||
      clusterApiUrl("mainnet-beta"),
    [],
  );

  // Wallet adapters — memoized so they are stable across renders
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
            {/* Sidebar: fixed on desktop, overlay on mobile */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 overflow-auto custom-scrollbar">
              <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>

          {/* Toast notifications */}
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
