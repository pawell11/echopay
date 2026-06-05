// Card types
export interface VirtualCard {
  id: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  brand: "mastercard" | "visa";
  status: "active" | "frozen" | "closed";
  balance: number; // USD cents
  currency: string;
  createdAt: string;
  frozenAt: string | null;
  label: string | null;
}

export interface CardDetails extends VirtualCard {
  cardNumber: string;
  cvv: string;
}

// Transaction types
export interface Transaction {
  id: string;
  cardId: string;
  type: "purchase" | "topup" | "refund" | "fee" | "cashback";
  amount: number;
  currency: string;
  merchant: string | null;
  status: "pending" | "completed" | "failed";
  txSignature: string | null;
  createdAt: string;
  description: string;
}

// Top-up types
export interface TopUpRequest {
  cardId: string;
  amount: number;
  currency: "SOL" | "USDT" | "ECHO";
  walletAddress: string;
}

export interface TopUpResponse {
  txSignature: string;
  cardBalance: number;
  fee: number;
  cashback: number;
}

// User types
export interface UserProfile {
  id: string;
  walletAddress: string;
  tier: "anonymous" | "verified";
  monthlyVolume: number;
  cardsCount: number;
  totalCashback: number;
  createdAt: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
