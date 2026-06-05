// VantagePay configuration constants

export const APP = {
  NAME: "VantagePay",
  DESCRIPTION: "Spend your crypto like real money. Instant virtual Mastercards funded with SOL, USDT, or $ECHO.",
  URL: "https://vantagepay.cards",
  TWITTER: "@VantagePaySol",
} as const;

export const TOKEN = {
  SYMBOL: "ECHO",
  DECIMALS: 6,
  MINT: "Echooooooooooooooooooooooooooooooooooooooooooo", // placeholder
} as const;

export const FEES = {
  DEFAULT: 5,    // 5% base fee
  ECHO: 1,       // 1% fee when using $ECHO
  CASHBACK: 2,   // 2% cashback in $ECHO
} as const;

export const LIMITS = {
  NO_KYC_DAILY: 500,
  NO_KYC_MONTHLY: 1000,
  KYC_DAILY: 10000,
  KYC_MONTHLY: 50000,
} as const;

export const NETWORKS = {
  SOLANA_MAINNET: "https://api.mainnet-beta.solana.com",
  HELIUS_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com",
} as const;

export { tailwindPreset } from "./tailwind";