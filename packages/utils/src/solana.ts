import { Connection } from "@solana/web3.js";

const SOLANA_MAINNET = "https://api.mainnet-beta.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Create a Solana Connection with sensible defaults.
 * @param rpcUrl - RPC endpoint (defaults to mainnet-beta)
 */
export function createConnection(rpcUrl?: string): Connection {
  return new Connection(rpcUrl || SOLANA_MAINNET, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
  });
}

/**
 * Get the Solana Explorer URL for an address or transaction.
 * @param address - Solana address or tx signature
 * @param cluster - Cluster name (default: "mainnet-beta")
 */
export function getExplorerUrl(
  address: string,
  cluster: string = "mainnet-beta"
): string {
  const baseUrl =
    cluster === "mainnet-beta"
      ? "https://explorer.solana.com"
      : `https://explorer.solana.com/?cluster=${cluster}`;

  // Heuristic: tx signatures are ~88 chars, addresses are 32–44
  const type = address.length > 64 ? "tx" : "address";
  return `${baseUrl}/${type}/${address}`;
}

/**
 * Convert lamports to SOL.
 * @example lamportsToSol(1_000_000_000) → 1
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports.
 * @example solToLamports(1) → 1_000_000_000
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
