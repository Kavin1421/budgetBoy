import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WizardInput } from "@/utils/validators";
import { optimizeBudgetPreview } from "@/lib/optimizerPreview";
import type { OptimizationResult } from "@/lib/optimizerTypes";

type Mode = "individual" | "family" | "friends";

export type SavedScenario = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: WizardInput;
  analysis: OptimizationResult | null;
};

export type SavedShareLink = {
  shareId: string;
  scenarioId?: string;
  scenarioName: string;
  createdAt: string;
  expiresAt: string;
  revoked?: boolean;
  revokedAt?: string | null;
  viewCount?: number;
  lastViewedAt?: string | null;
};

type StoreState = WizardInput & {
  lastAnalysis: OptimizationResult | null;
  scenarios: SavedScenario[];
  shareLinks: SavedShareLink[];
  activeScenarioId?: string;
  currentScenarioName: string;
  setLastAnalysis: (result: OptimizationResult | null) => void;
  setCurrentScenarioName: (name: string) => void;
  setMode: (mode: Mode) => void;
  setCity: (city: WizardInput["city"]) => void;
  addMember: (member: WizardInput["members"][number]) => void;
  updateMember: (index: number, member: WizardInput["members"][number]) => void;
  removeMember: (index: number) => void;
  setWifi: (wifi: WizardInput["wifi"]) => void;
  addSubscription: (subscription: WizardInput["subscriptions"][number]) => void;
  updateSubscription: (index: number, subscription: WizardInput["subscriptions"][number]) => void;
  removeSubscription: (index: number) => void;
  setIncome: (income?: number) => void;
  saveScenarioFromCurrent: (analysis?: OptimizationResult | null) => string;
  addShareLink: (link: SavedShareLink) => void;
  updateShareLink: (shareId: string, patch: Partial<SavedShareLink>) => void;
  setActiveScenario: (id?: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  loadScenarioToWizard: (id: string) => void;
  reset: () => void;
  getOptimization: () => OptimizationResult;
};

const initialState: WizardInput & {
  lastAnalysis: OptimizationResult | null;
  scenarios: SavedScenario[];
  shareLinks: SavedShareLink[];
  activeScenarioId?: string;
  currentScenarioName: string;
} = {
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
      rechargeIntent: "both-balanced",
      priority: "balanced",
      callingNeed: "regular",
      needsOtt: false,
    },
  ],
  subscriptions: [],
  wifi: { cost: 0, usageType: "moderate" },
  income: undefined,
  scenarios: [],
  shareLinks: [],
  activeScenarioId: undefined,
  currentScenarioName: "My family plan",
  lastAnalysis: null,
};

export const useBudgetStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setLastAnalysis: (result) => set({ lastAnalysis: result }),
      setCurrentScenarioName: (name) => set({ currentScenarioName: name }),
      setMode: (mode) => set({ mode }),
      setCity: (city) => set({ city }),
      addMember: (member) => set((state) => ({ members: [...state.members, member] })),
      updateMember: (index, member) =>
        set((state) => ({ members: state.members.map((m, i) => (i === index ? member : m)) })),
      removeMember: (index) => set((state) => ({ members: state.members.filter((_, i) => i !== index) })),
      setWifi: (wifi) => set({ wifi }),
      addSubscription: (subscription) => set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
      updateSubscription: (index, subscription) =>
        set((state) => ({ subscriptions: state.subscriptions.map((s, i) => (i === index ? subscription : s)) })),
      removeSubscription: (index) => set((state) => ({ subscriptions: state.subscriptions.filter((_, i) => i !== index) })),
      setIncome: (income) => set({ income }),
      saveScenarioFromCurrent: (analysis) => {
        const s = get();
        const now = new Date().toISOString();
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const scenario: SavedScenario = {
          id,
          name: s.currentScenarioName.trim() || "Untitled scenario",
          createdAt: now,
          updatedAt: now,
          data: {
            mode: s.mode,
            city: s.city,
            members: s.members,
            subscriptions: s.subscriptions,
            wifi: s.wifi,
            income: s.income,
          },
          analysis: analysis ?? s.lastAnalysis,
        };
        set((state) => ({
          scenarios: [scenario, ...state.scenarios].slice(0, 30),
          activeScenarioId: scenario.id,
        }));
        return scenario.id;
      },
      addShareLink: (link) =>
        set((state) => ({
          shareLinks: [link, ...state.shareLinks.filter((x) => x.shareId !== link.shareId)].slice(0, 60),
        })),
      updateShareLink: (shareId, patch) =>
        set((state) => ({
          shareLinks: state.shareLinks.map((x) => (x.shareId === shareId ? { ...x, ...patch } : x)),
        })),
      setActiveScenario: (id) => set({ activeScenarioId: id }),
      renameScenario: (id, name) =>
        set((state) => ({
          scenarios: state.scenarios.map((sc) =>
            sc.id === id ? { ...sc, name: name.trim() || sc.name, updatedAt: new Date().toISOString() } : sc
          ),
        })),
      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((sc) => sc.id !== id),
          activeScenarioId: state.activeScenarioId === id ? undefined : state.activeScenarioId,
        })),
      loadScenarioToWizard: (id) =>
        set((state) => {
          const sc = state.scenarios.find((x) => x.id === id);
          if (!sc) return state;
          return {
            ...state,
            ...sc.data,
            lastAnalysis: sc.analysis,
            currentScenarioName: sc.name,
            activeScenarioId: sc.id,
          };
        }),
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
    {
      name: "budgetboy-store-v3",
      merge: (persistedState, currentState) => {
        const state = (persistedState ?? {}) as Partial<StoreState> & {
          playlists?: SavedScenario[];
          activePlaylistId?: string;
          currentPlaylistName?: string;
          sharedLinks?: SavedShareLink[];
        };
        return {
          ...currentState,
          ...state,
          scenarios: Array.isArray(state.scenarios) ? state.scenarios : Array.isArray(state.playlists) ? state.playlists : [],
          shareLinks: Array.isArray(state.shareLinks) ? state.shareLinks : Array.isArray(state.sharedLinks) ? state.sharedLinks : [],
          activeScenarioId: state.activeScenarioId ?? state.activePlaylistId ?? undefined,
          currentScenarioName: state.currentScenarioName ?? state.currentPlaylistName ?? initialState.currentScenarioName,
        };
      },
    }
  )
);
