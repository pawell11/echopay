import type {
  ApiResponse,
  VirtualCard,
  CardDetails,
  Transaction,
  TopUpRequest,
  TopUpResponse,
  UserProfile,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Request failed" };
    }
    return { success: true, data: json.data ?? json };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// Cards API
export const cardsApi = {
  list: () => fetchApi<VirtualCard[]>("/card"),
  get: (id: string) => fetchApi<CardDetails>(`/card/${id}`),
  create: () => fetchApi<VirtualCard>("/card", { method: "POST" }),
  freeze: (id: string) => fetchApi<VirtualCard>(`/card/${id}/freeze`, { method: "POST" }),
  unfreeze: (id: string) => fetchApi<VirtualCard>(`/card/${id}/unfreeze`, { method: "POST" }),
  close: (id: string) => fetchApi<void>(`/card/${id}`, { method: "DELETE" }),
};

// Top-up API
export const topUpApi = {
  create: (req: TopUpRequest) =>
    fetchApi<TopUpResponse>("/topup", {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// Transaction API
export const transactionApi = {
  list: (cardId?: string) =>
    fetchApi<Transaction[]>(`/transaction${cardId ? `?cardId=${cardId}` : ""}`),
  get: (id: string) => fetchApi<Transaction>(`/transaction/${id}`),
};

// User API
export const userApi = {
  profile: (walletAddress: string) =>
    fetchApi<UserProfile>(`/user/${walletAddress}`),
};
