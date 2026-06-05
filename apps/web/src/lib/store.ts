import { create } from "zustand";

interface AppStore {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Active card
  activeCardId: string | null;
  setActiveCard: (id: string | null) => void;

  // Preferences
  currencyDisplay: "USD" | "SOL";
  setCurrencyDisplay: (currency: "USD" | "SOL") => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeCardId: null,
  setActiveCard: (id) => set({ activeCardId: id }),
  currencyDisplay: "USD",
  setCurrencyDisplay: (currency) => set({ currencyDisplay: currency }),
}));
