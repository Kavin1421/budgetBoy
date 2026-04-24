import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WizardInput } from "@/utils/validators";
import { optimizeBudgetPreview } from "@/lib/optimizerPreview";
import type { OptimizationResult } from "@/lib/optimizerTypes";

type Mode = "individual" | "family" | "friends";

type StoreState = WizardInput & {
  lastAnalysis: OptimizationResult | null;
  setLastAnalysis: (result: OptimizationResult | null) => void;
  setMode: (mode: Mode) => void;
  setCity: (city: WizardInput["city"]) => void;
  addMember: (member: WizardInput["members"][number]) => void;
  removeMember: (index: number) => void;
  setWifi: (wifi: WizardInput["wifi"]) => void;
  addSubscription: (subscription: WizardInput["subscriptions"][number]) => void;
  removeSubscription: (index: number) => void;
  setIncome: (income?: number) => void;
  reset: () => void;
  getOptimization: () => OptimizationResult;
};

const initialState: WizardInput & { lastAnalysis: OptimizationResult | null } = {
  mode: "individual",
  city: "Bangalore",
  members: [
    {
      name: "You",
      provider: "Jio",
      currentPlanPrice: 299,
      validity: "28",
      planDataPerDay: "2GB",
      actualUsagePerDay: "1GB",
      lineUsageType: "medium",
    },
  ],
  subscriptions: [],
  wifi: { cost: 0, usageType: "moderate" },
  income: undefined,
  lastAnalysis: null,
};

export const useBudgetStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setLastAnalysis: (result) => set({ lastAnalysis: result }),
      setMode: (mode) => set({ mode }),
      setCity: (city) => set({ city }),
      addMember: (member) => set((state) => ({ members: [...state.members, member] })),
      removeMember: (index) => set((state) => ({ members: state.members.filter((_, i) => i !== index) })),
      setWifi: (wifi) => set({ wifi }),
      addSubscription: (subscription) => set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
      removeSubscription: (index) => set((state) => ({ subscriptions: state.subscriptions.filter((_, i) => i !== index) })),
      setIncome: (income) => set({ income }),
      reset: () => set(initialState),
      getOptimization: () => {
        const s = get();
        if (s.lastAnalysis) {
          return {
            ...s.lastAnalysis,
            memberOptimizations: s.lastAnalysis.memberOptimizations ?? [],
            totalFamilyTelecomSavings: s.lastAnalysis.totalFamilyTelecomSavings ?? 0,
          };
        }
        return optimizeBudgetPreview(s);
      },
    }),
    { name: "budgetboy-store-v3" }
  )
);
