"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  ArrowDownToLine,
  Globe,
  Zap,
  Shield,
  Gift,
  Layers,
  Eye,
  Gem,
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  CircleDollarSign,
  Coins,
  BadgeCheck,
  Bot,
  Gamepad2,
  ShoppingBag,
  Plane,
  GraduationCap,
  Smartphone,
  Apple,
  ShoppingCart,
  BarChart3,
  Check,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@vantagepay/ui";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const NAV_LINKS = [
  { label: "Product", href: "#how-it-works" },
  { label: "Token", href: "#token-utility" },
  { label: "FAQ", href: "#faq" },
];

const TRUST_BADGES = [
  {
    icon: Shield,
    label: "No KYC up to $1k/mo",
    description: "Start spending instantly",
  },
  {
    icon: Zap,
    label: "Mastercard in 30 sec",
    description: "Virtual card issued on-chain",
  },
  {
    icon: Sparkles,
    label: "1% fee with $ECHO",
    description: "80% cheaper than standard",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    icon: Wallet,
    title: "Connect a Solana wallet",
    description:
      "Phantom, Solflare, Backpack — or sign in via Telegram bot. No extensions? Use the web wallet.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Issue a virtual card",
    description:
      "One tap. Get a 16-digit number, CVV and expiry instantly. Your card lives on-chain.",
  },
  {
    number: "03",
    icon: ArrowDownToLine,
    title: "Top up with SOL or USDT",
    description:
      "Or pay in $ECHO for a discounted 1% fee. Funds settle to USD on the card balance instantly.",
  },
  {
    number: "04",
    icon: Globe,
    title: "Spend anywhere",
    description:
      "Mastercard online, plus Apple Pay and Google Pay. Works everywhere Mastercard is accepted.",
  },
];

const FUNDING_OPTIONS = [
  {
    icon: Coins,
    name: "SOL",
    ticker: "SOL",
    description:
      "Native Solana token. Sub-second finality, sub-cent fees. The fastest way to fund.",
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: CircleDollarSign,
    name: "USDT",
    ticker: "USDT",
    description:
      "The world's largest stablecoin. Pegged 1:1 to USD. Zero volatility when you top up.",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Gem,
    name: "ECHO",
    ticker: "$ECHO",
    description:
      "VantagePay's native token. 1% top-up fee (vs 5% standard) + 2% cashback on every purchase.",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-500/10",
    featured: true,
  },
];

const TOKEN_UTILITY = [
  {
    icon: Sparkles,
    title: "Discounted fees",
    description:
      "Standard top-up is 5%. Pay with $ECHO and it drops to just 1% — that's 80% cheaper.",
  },
  {
    icon: Gift,
    title: "Cashback rewards",
    description:
      "Earn 2% back in $ECHO on every purchase. Rewards are distributed weekly, on-chain.",
  },
  {
    icon: Layers,
    title: "Card tiers via staking",
    description:
      "Stake $ECHO to unlock higher limits, premium card designs, and priority support.",
  },
  {
    icon: BarChart3,
    title: "Governance",
    description:
      "$ECHO holders vote on fee parameters, new features, and treasury allocations.",
  },
];

const USE_CASES = [
  {
    icon: Bot,
    name: "AI Services",
    examples: "ChatGPT, Claude, Midjourney, Perplexity",
  },
  {
    icon: Smartphone,
    name: "Subscriptions",
    examples: "Netflix, Spotify, YouTube Premium, Notion",
  },
  {
    icon: Apple,
    name: "App Store & iCloud",
    examples: "Apple services, in-app purchases, iCloud+",
  },
  {
    icon: Gamepad2,
    name: "Games",
    examples: "Steam, PlayStation, Xbox, Epic Games",
  },
  {
    icon: BarChart3,
    name: "Ad Accounts",
    examples: "Google Ads, Meta Ads, TikTok Ads, Twitter Ads",
  },
  {
    icon: ShoppingCart,
    name: "Online Shopping",
    examples: "Amazon, Shopify stores, eBay, AliExpress",
  },
  {
    icon: Plane,
    name: "Travel",
    examples: "Booking.com, Airbnb, airline tickets, Uber",
  },
  {
    icon: GraduationCap,
    name: "Education",
    examples: "Coursera, Udemy, MasterClass, Duolingo",
  },
];

const WHY_VANTAGEPAY = [
  {
    icon: Zap,
    title: "Solana-fast",
    description:
      "Sub-second confirmations. No waiting for block finality like on EVM chains. Your card funds settle instantly.",
  },
  {
    icon: Shield,
    title: "No KYC default",
    description:
      "Start with an anonymous tier — up to $1,000/month without submitting documents. Upgrade when you need more.",
  },
  {
    icon: Gift,
    title: "Native rewards",
    description:
      "Earn $ECHO cashback on every purchase. No points systems, no complex tiers — just real tokens to your wallet.",
  },
  {
    icon: Wallet,
    title: "Wallet-first UX",
    description:
      "Connect any Solana wallet. No email, no password, no seed phrases to manage — just your wallet.",
  },
  {
    icon: Layers,
    title: "Multiple cards",
    description:
      "Issue multiple virtual cards for different purposes — subscriptions, shopping, travel — each with its own balance.",
  },
  {
    icon: Eye,
    title: "On-chain transparency",
    description:
      "Every top-up, every spend, every reward — verifiable on Solana. No hidden fees, no surprises.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Do I need to verify (KYC)?",
    answer:
      "No. VantagePay offers an anonymous tier by default with limits of $500/day and $1,000/month. If you need higher limits, you can optionally complete KYC to unlock up to $10,000/month. The choice is yours.",
  },
  {
    question: "What does a card cost?",
    answer:
      "Card issuance is completely free. Top-ups carry a standard 5% fee, but if you pay with $ECHO tokens the fee drops to just 1%. There are no monthly fees, no maintenance fees, and no hidden charges.",
  },
  {
    question: "What are the limits?",
    answer:
      "Without KYC: $500 per day, $1,000 per month. With KYC verification: limits increase to $2,500/day and $10,000/month. Premium tiers unlocked by staking $ECHO can go even higher.",
  },
  {
    question: "Where is the card accepted?",
    answer:
      "Anywhere Mastercard is accepted online. That means millions of merchants worldwide — e-commerce stores, subscription services, SaaS platforms, ad networks, travel booking sites, and more. Apple Pay and Google Pay are also supported.",
  },
  {
    question: "Why Solana?",
    answer:
      "Solana gives us sub-second transaction finality, sub-cent fees, and a thriving DeFi ecosystem. No EVM congestion, no $50 gas fees, no waiting for blocks. When you top up your card, the funds are available in under a second.",
  },
];

const FOOTER_LINKS = {
  Product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Token Utility", href: "#token-utility" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "FAQ", href: "#faq" },
  ],
  Developers: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "GitHub", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  Social: [
    { label: "Twitter", href: "#" },
    { label: "Telegram", href: "#" },
    { label: "Discord", href: "#" },
  ],
};

/* ==========================================================================
   ANIMATION VARIANTS
   ========================================================================== */

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

/* ==========================================================================
   SECTIONS
   ========================================================================== */

/**
 * NavBar — Fixed glass-morphism navigation with mobile drawer.
 */
function NavBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass border-b border-slate-200/10 dark:border-slate-800/10 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="container-custom flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/25">
              E
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Echo<span className="text-indigo-600">Pay</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {!mounted ? <span className="w-4.5 h-4.5 block" /> : theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <Button size="lg" className="font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40" asChild>
              <Link href="/dashboard">
                Launch App
                <ChevronRight className="ml-1.5 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {!mounted ? <span className="w-4 h-4 block" /> : theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile slide-out drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 pt-20 shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button size="lg" className="w-full font-semibold" asChild>
                    <Link href="/dashboard">
                      Launch App
                      <ChevronRight className="ml-1.5 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * VirtualCardVisual — CSS-only premium card design.
 */
function VirtualCardVisual() {
  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl blur-2xl" />
      {/* Card */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 dark:from-slate-600 dark:via-slate-500 dark:to-slate-700">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 md:p-8">
          {/* Card header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                E
              </div>
              <span className="text-white/90 font-bold text-sm tracking-wide">
                VANTAGEPAY
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-red-500/80" />
              <div className="w-8 h-8 rounded-full bg-amber-500/80 -ml-3" />
            </div>
          </div>
          {/* Chip */}
          <div className="mb-8">
            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-100 to-amber-300 border border-amber-400/50 relative overflow-hidden">
              <div className="absolute inset-1 rounded-sm border border-amber-400/40" />
              <div className="absolute top-0 left-0 w-full h-1/2 bg-amber-200/50" />
            </div>
          </div>
          {/* Card number */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              {["4872", "9015", "6348", "2193"].map((group, i) => (
                <span
                  key={i}
                  className={`font-mono text-lg md:text-xl tracking-[0.15em] ${
                    i === 3 ? "text-white font-medium" : "text-white/60"
                  }`}
                >
                  {i === 3 ? group : "••••"}
                </span>
              ))}
            </div>
          </div>
          {/* Card footer */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">
                Card Holder
              </div>
              <div className="text-white/80 font-medium text-sm">VantagePay User</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">
                Expires
              </div>
              <div className="text-white/80 font-medium text-sm">12/28</div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500/30 border border-indigo-400/20 flex items-center justify-center">
                <span className="text-white/70 text-[10px] font-bold">MC</span>
              </div>
            </div>
          </div>
          {/* Shine effect */}
          <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

/**
 * Section wrapper with fade-in-scroll animation.
 */
function Section({
  id,
  children,
  className = "",
  dark = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  const [inView, setInView] = useState(false);

  return (
    <section
      id={id}
      className={`section-padding relative ${dark ? "bg-slate-900 dark:bg-slate-900/50" : ""} ${className}`}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="container-custom relative z-10"
      >
        {children}
      </motion.div>
    </section>
  );
}

/**
 * SectionHeader — consistent title + subtitle pattern.
 */
function SectionHeader({
  title,
  subtitle,
  className = "",
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={`text-center max-w-3xl mx-auto mb-16 md:mb-20 ${className}`}>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        {title}
      </h2>
      <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="relative overflow-hidden">
      {/* ─── NAVIGATION ─── */}
      <NavBar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  $ECHO · Built on Solana
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
                <span className="text-slate-900 dark:text-white">
                  Spend your crypto
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  like real money.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                VantagePay is a Web3 virtual-card service on Solana. Issue a
                Mastercard in seconds and top it up with SOL, USDT, or $ECHO
                — funds settle to USD on the card balance instantly.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-12">
                <Button size="lg" className="font-semibold text-base px-8 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-shadow" asChild>
                  <Link href="/dashboard">
                    Launch App
                    <ChevronRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </Button>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="font-medium text-base px-8">
                    See How It Works
                  </Button>
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                {TRUST_BADGES.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.label}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                          {badge.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {badge.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Virtual card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden lg:flex justify-center"
            >
              <VirtualCardVisual />
            </motion.div>

            {/* Mobile card below */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:hidden flex justify-center"
            >
              <VirtualCardVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <Section id="how-it-works" dark>
        <SectionHeader
          title="How it works"
          subtitle="From wallet to checkout in under a minute. No banks, no paperwork, no waiting."
        />
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                className="group relative p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300"
              >
                {/* Step number */}
                <span className="absolute top-6 right-6 text-6xl font-extrabold text-slate-100 dark:text-slate-800/50 select-none">
                  {step.number}
                </span>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ─── THREE WAYS TO FUND ─── */}
      <Section id="funding">
        <SectionHeader
          title="Solana-native by design"
          subtitle="One network. Three ways to fund a card. Pick the asset that works for you."
        />
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {FUNDING_OPTIONS.map((option, i) => (
            <motion.div
              key={option.ticker}
              variants={fadeInUp}
              className={`group relative p-6 md:p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                option.featured
                  ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5"
                  : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/30"
              }`}
            >
              {option.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="shadow-md">
                    Recommended
                  </Badge>
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center mb-5`}>
                <option.icon className={`w-6 h-6 bg-gradient-to-br ${option.color} bg-clip-text text-transparent`} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {option.name}
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {option.ticker}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {option.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ─── TOKEN UTILITY ─── */}
      <Section id="token-utility" dark>
        <SectionHeader
          title="More than a payment token."
          subtitle="$ECHO powers fees, rewards, premium tiers, and governance. It's the key to the VantagePay ecosystem."
        />
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {TOKEN_UTILITY.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className="flex gap-4 p-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ─── USE CASES ─── */}
      <Section id="use-cases">
        <SectionHeader
          title="What you can pay for"
          subtitle="An VantagePay card works anywhere Mastercard does — that's millions of merchants worldwide."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {USE_CASES.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.name}
                variants={fadeInUp}
                className="group p-5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {useCase.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {useCase.examples}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ─── WHY VANTAGEPAY ─── */}
      <Section id="why-vantagepay" dark>
        <SectionHeader
          title="Why VantagePay"
          subtitle="Traditional crypto cards are slow, expensive, and require KYC. VantagePay is different — here's why."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_VANTAGEPAY.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/20 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section id="faq">
        <SectionHeader
          title="Frequently asked questions"
          subtitle="Everything you need to know about VantagePay virtual cards."
        />
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium text-slate-900 dark:text-white hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <section className="section-padding relative">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-indigo-950/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              Ready to spend your crypto?
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
              Issue your first virtual card in 30 seconds. No paperwork, no
              KYC required. Just connect your wallet and go.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="font-semibold text-base px-10 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-shadow" asChild>
                <Link href="/dashboard">
                  Launch App
                  <ChevronRight className="ml-1.5 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-400" />
                AES-256 encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-indigo-400" />
                Solana on-chain settlement
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-indigo-400" />
                Mastercard network
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="container-custom py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <a href="#" className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  E
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Echo<span className="text-indigo-600">Pay</span>
                </span>
              </a>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                The fastest way to spend crypto. Virtual Mastercards on Solana — no KYC, no banks, no waiting.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  {category}
                </h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              &copy; 2025 VantagePay. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
