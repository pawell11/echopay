"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/lib/store";
import { truncateAddress } from "@vantagepay/utils";
import { Button } from "@vantagepay/ui";
import {
  LayoutDashboard,
  CreditCard,
  ArrowUpCircle,
  History,
  Settings,
  LogOut,
  Wallet,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { cn } from "@vantagepay/ui";

/* --------------------------------------------------------------------------
   Constants
   -------------------------------------------------------------------------- */

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/cards", label: "Cards", icon: CreditCard },
  { href: "/dashboard/top-up", label: "Top Up", icon: ArrowUpCircle },
  { href: "/dashboard/transactions", label: "Transactions", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/* --------------------------------------------------------------------------
   Sidebar
   -------------------------------------------------------------------------- */

/**
 * Dashboard sidebar — fixed on desktop, overlay on mobile.
 *
 * Responsibilities:
 * - VantagePay logo + home link
 * - Primary navigation with active-state highlighting
 * - Wallet connect / disconnect at the bottom
 * - Theme toggle
 * - Mobile overlay with backdrop
 */
export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { connected, publicKey, disconnect, select, wallets } = useWallet();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const resolved = theme === "system" ? "dark" : theme;

  useEffect(() => setMounted(true), []);

  // Close sidebar on route change (mobile)
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // Close mobile sidebar on navigation
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  const handleConnect = useCallback(async () => {
    // Pick the first available wallet adapter
    if (wallets.length > 0) {
      const w = wallets[0]!;
      select(w.adapter.name);
      try {
        await w.adapter.connect();
      } catch {
        // User rejected — no action needed
      }
    }
  }, [wallets, select]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  const toggleTheme = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  /* ---- Desktop sidebar ---- */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-indigo-600/25">
            E
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Echo<span className="text-indigo-600">Pay</span>
          </span>
        </Link>

        {/* Close button (mobile only — visible via CSS) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-800/60",
              )}
            >
              <item.icon
                className={cn(
                  "w-4.5 h-4.5 shrink-0",
                  isActive && "text-indigo-600 dark:text-indigo-400",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: wallet + theme */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle theme"
        >
          {!mounted ? <span className="w-4.5 h-4.5 shrink-0" /> : resolved === "dark" ? (
            <Sun className="w-4.5 h-4.5 shrink-0" />
          ) : (
            <Moon className="w-4.5 h-4.5 shrink-0" />
          )}
          <span>{!mounted ? "" : resolved === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {/* Wallet connect / status */}
        {connected && publicKey ? (
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                  {truncateAddress(publicKey.toBase58(), 4)}
                </span>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Disconnect wallet"
              title="Disconnect"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            variant="default"
            size="sm"
            className="w-full font-semibold text-xs"
          >
            <Wallet className="w-3.5 h-3.5 mr-1.5" />
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0",
          "border-r border-slate-200 dark:border-slate-800",
          "bg-white dark:bg-slate-950",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-[70px]",
        )}
      >
        {/* Collapsed state: different layout */}
        {sidebarOpen ? (
          sidebarContent
        ) : (
          <div className="flex flex-col items-center h-full py-4 gap-4">
            {/* Logo icon only */}
            <Link href="/" className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-indigo-600/25">
              E
            </Link>

            {/* Expand toggle */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Collapsed nav — icon only */}
            <nav className="flex-1 flex flex-col items-center gap-1 mt-2">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                  </Link>
                );
              })}
            </nav>

            {/* Collapsed theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Toggle theme"
            >
              {!mounted ? <span className="w-4 h-4" /> : resolved === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Collapsed wallet */}
            {connected && publicKey ? (
              <div className="relative" title={publicKey.toBase58()}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5" />
                <Wallet className="w-4 h-4 text-slate-400" />
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                aria-label="Connect wallet"
              >
                <Wallet className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Collapse toggle for expanded state */}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm transition-colors z-10"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-3 h-3" />
          </button>
        )}
      </aside>

      {/* ── Mobile: overlay ── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Slide-out panel */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72",
              "border-r border-slate-200 dark:border-slate-800",
              "bg-white dark:bg-slate-950",
              "animate-slide-in-left lg:hidden",
              "shadow-2xl",
            )}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
