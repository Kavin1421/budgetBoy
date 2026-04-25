"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import CountUp from "react-countup";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderOpen,
  GitCompareArrows,
  Link2,
  Loader2,
  RefreshCcw,
  PiggyBank,
  Pencil,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useBudgetStore } from "@/store/useBudgetStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { monthlyEquivalentFromRecharge } from "@/lib/billingUtils";
import { optimizeBudgetPreview } from "@/lib/optimizerPreview";
import { monthlyEquivalent } from "@/lib/telecomPlanQuery";
import type { MemberOptimizationResult, OptimizationResult } from "@/lib/optimizerTypes";
import type { SavedScenario, SavedShareLink } from "@/store/useBudgetStore";

const RECHARGE_LINKS: Record<string, string> = {
  Jio: "https://www.jio.com/selfcare/recharge/",
  Airtel: "https://www.airtel.in/recharge",
  VI: "https://www.myvi.in/recharge",
  BSNL: "https://portal2.bsnl.in/",
};

function normalizeMemberRows(rows: MemberOptimizationResult[]): MemberOptimizationResult[] {
  return rows.map((row) => ({
    ...row,
    verdict: row.verdict ?? "keep_current",
    currentFitScore: row.currentFitScore ?? 60,
    recommendedFitScore: row.recommendedFitScore ?? row.currentFitScore ?? 60,
    confidence: row.confidence ?? "medium",
    wasteBreakdown: {
      unusedDataCost: row.wasteBreakdown?.unusedDataCost ?? 0,
      overSpecCost: row.wasteBreakdown?.overSpecCost ?? 0,
      networkPenaltyCost: row.wasteBreakdown?.networkPenaltyCost ?? 0,
      ottMismatchCost: row.wasteBreakdown?.ottMismatchCost ?? 0,
    },
  }));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function toRangeAmount(monthlyValue: number, range: "daily" | "weekly") {
  return range === "daily" ? monthlyValue / 30 : monthlyValue / 4.345;
}

const sectionStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const sectionItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

type ScenarioSnapshot = {
  id: string;
  name: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  avoidableWaste: number;
  members: number;
  subscriptions: number;
  updatedAtLabel: string;
};

type ShareManageItem = SavedShareLink & {
  shareUrl: string;
};

function snapshotFromAnalysis(id: string, name: string, analysis: OptimizationResult, members: number, subscriptions: number, updatedAtLabel: string): ScenarioSnapshot {
  const memberRows = normalizeMemberRows(analysis.memberOptimizations ?? []);
  const avoidableWaste = memberRows.reduce(
    (sum, r) =>
      sum +
      r.wasteBreakdown.unusedDataCost +
      r.wasteBreakdown.overSpecCost +
      r.wasteBreakdown.networkPenaltyCost +
      r.wasteBreakdown.ottMismatchCost,
    0
  );
  return {
    id,
    name,
    currentCost: analysis.currentCost,
    optimizedCost: analysis.optimizedCost,
    savings: analysis.savings,
    avoidableWaste,
    members,
    subscriptions,
    updatedAtLabel,
  };
}

function snapshotFromScenario(scenario: SavedScenario): ScenarioSnapshot {
  const analysis = scenario.analysis ?? optimizeBudgetPreview(scenario.data);
  return snapshotFromAnalysis(
    scenario.id,
    scenario.name,
    analysis,
    scenario.data.members.length,
    scenario.data.subscriptions.length,
    new Date(scenario.updatedAt).toLocaleDateString()
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const [editingScenarioName, setEditingScenarioName] = useState(false);
  const [scenarioNameDraft, setScenarioNameDraft] = useState("");
  const [expandedMember, setExpandedMember] = useState<number | null>(0);
  const [compareBaseId, setCompareBaseId] = useState<string>("__current__");
  const [compareTargetId, setCompareTargetId] = useState<string>("");
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [shareExpiryPreset, setShareExpiryPreset] = useState<7 | 30>(30);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);
  const router = useRouter();
  const store = useBudgetStore();
  const hydrated = useSyncExternalStore(
    (onStoreChange) => {
      const unsubHydrate = useBudgetStore.persist.onHydrate(() => onStoreChange());
      const unsubFinish = useBudgetStore.persist.onFinishHydration(() => onStoreChange());
      return () => {
        unsubHydrate();
        unsubFinish();
      };
    },
    () => useBudgetStore.persist.hasHydrated(),
    () => false
  );
  const chartsReady = hydrated;
  const activeScenario = useMemo(
    () => store.scenarios.find((sc) => sc.id === store.activeScenarioId),
    [store.scenarios, store.activeScenarioId]
  );
  const dashboardData = useMemo(
    () =>
      activeScenario?.data ?? {
        mode: store.mode,
        city: store.city,
        members: store.members,
        subscriptions: store.subscriptions,
        wifi: store.wifi,
        income: store.income,
      },
    [activeScenario, store.mode, store.city, store.members, store.subscriptions, store.wifi, store.income]
  );
  const result = useMemo(() => activeScenario?.analysis ?? store.getOptimization(), [activeScenario, store]);

  const yearly = useMemo(() => result.currentCost * 12, [result.currentCost]);
  const optYearly = useMemo(() => result.optimizedCost * 12, [result.optimizedCost]);

  const plansCost = useMemo(
    () => dashboardData.members.reduce((sum, m) => sum + monthlyEquivalentFromRecharge(m.currentPlanPrice, Number(m.validity) || 28), 0),
    [dashboardData.members]
  );
  const subsCost = useMemo(() => dashboardData.subscriptions.reduce((sum, s) => sum + s.cost, 0), [dashboardData.subscriptions]);

  const memberRows: MemberOptimizationResult[] = useMemo(
    () => normalizeMemberRows(result.memberOptimizations?.length ? result.memberOptimizations : []),
    [result.memberOptimizations]
  );
  const avoidableWaste = useMemo(
    () =>
      memberRows.reduce(
        (sum, r) =>
          sum +
          r.wasteBreakdown.unusedDataCost +
          r.wasteBreakdown.overSpecCost +
          r.wasteBreakdown.networkPenaltyCost +
          r.wasteBreakdown.ottMismatchCost,
        0
      ),
    [memberRows]
  );
  const displayName = dashboardData.members[0]?.name?.trim() || "there";
  const firstName = displayName.includes(" ") ? displayName.split(/\s+/)[0] : displayName;
  const titleName = activeScenario?.name || store.currentScenarioName || `${firstName} plan`;
  const currentSnapshot = useMemo(
    () =>
      snapshotFromAnalysis(
        "__current__",
        `${titleName} (current view)`,
        result,
        dashboardData.members.length,
        dashboardData.subscriptions.length,
        "Now"
      ),
    [titleName, result, dashboardData.members.length, dashboardData.subscriptions.length]
  );
  const compareBaseScenario = compareBaseId === "__current__" ? null : store.scenarios.find((sc) => sc.id === compareBaseId);
  const compareBaseSnapshot = compareBaseScenario ? snapshotFromScenario(compareBaseScenario) : currentSnapshot;
  const defaultCompareTargetId = (store.scenarios.find((sc) => sc.id !== compareBaseScenario?.id) ?? store.scenarios[0])?.id ?? "";
  const effectiveCompareTargetId =
    compareTargetId === "__current__" || store.scenarios.some((sc) => sc.id === compareTargetId)
      ? compareTargetId
      : defaultCompareTargetId;
  const compareTargetScenario = effectiveCompareTargetId ? store.scenarios.find((sc) => sc.id === effectiveCompareTargetId) : undefined;
  const compareTargetSnapshot =
    effectiveCompareTargetId === "__current__"
      ? currentSnapshot
      : compareTargetScenario
        ? snapshotFromScenario(compareTargetScenario)
        : null;

  const shareItems: ShareManageItem[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    return store.shareLinks.map((s) => ({
      ...s,
      shareUrl: `${window.location.origin}/share/${s.shareId}`,
    }));
  }, [store.shareLinks]);

  const refreshShareStats = async () => {
    if (!store.shareLinks.length) return;
    setSharesLoading(true);
    try {
      const res = await fetch("/api/v1/share/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareIds: store.shareLinks.map((s) => s.shareId) }),
      });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        shares?: Array<{
          shareId: string;
          scenarioName: string;
          createdAt: string;
          expiresAt: string;
          revoked: boolean;
          revokedAt: string | null;
          viewCount: number;
          lastViewedAt: string | null;
        }>;
      };
      for (const item of payload.shares ?? []) {
        store.updateShareLink(item.shareId, {
          scenarioName: item.scenarioName,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt,
          revoked: item.revoked,
          revokedAt: item.revokedAt,
          viewCount: item.viewCount,
          lastViewedAt: item.lastViewedAt,
        });
      }
    } finally {
      setSharesLoading(false);
    }
  };

  const shareScenarioLink = async () => {
    try {
      const res = await fetch("/api/v1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: activeScenario?.name || titleName,
          expiresInDays: shareExpiryPreset,
          snapshot: {
            currentCost: result.currentCost,
            optimizedCost: result.optimizedCost,
            savings: result.savings,
            avoidableWaste,
            members: dashboardData.members.length,
            subscriptions: dashboardData.subscriptions.length,
            suggestions: result.suggestions.slice(0, 6),
          },
        }),
      });

      if (!res.ok) {
        toast.error("Could not create share link.");
        return;
      }

      const payload = (await res.json()) as { shareId?: string; expiresAt?: string };
      if (!payload.shareId) {
        toast.error("Invalid share response.");
        return;
      }
      const createdAt = new Date().toISOString();
      store.addShareLink({
        shareId: payload.shareId,
        scenarioId: activeScenario?.id,
        scenarioName: activeScenario?.name || titleName,
        createdAt,
        expiresAt: payload.expiresAt ?? new Date(Date.now() + shareExpiryPreset * 24 * 60 * 60 * 1000).toISOString(),
        revoked: false,
        viewCount: 0,
        lastViewedAt: null,
      });

      const shareUrl = `${window.location.origin}/share/${payload.shareId}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: "BudgetBoy shared plan",
            url: shareUrl,
          });
          toast.success("Share link sent.");
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied and saved.");
        return;
      }
      toast.message(shareUrl);
    } catch {
      toast.error("Share link failed. Try again.");
    }
  };

  const openComparePanel = () => {
    if (showComparePanel) {
      setShowComparePanel(false);
      return;
    }
    setShowComparePanel(true);
    setTimeout(() => {
      document.getElementById("compare-plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const beginRenameScenario = () => {
    if (!activeScenario) return;
    setScenarioNameDraft(activeScenario.name);
    setEditingScenarioName(true);
  };

  const cancelRenameScenario = () => {
    setEditingScenarioName(false);
    setScenarioNameDraft("");
  };

  const saveRenameScenario = () => {
    if (!activeScenario) return;
    const nextName = scenarioNameDraft.trim();
    if (!nextName) {
      toast.error("Scenario name cannot be empty.");
      return;
    }
    store.renameScenario(activeScenario.id, nextName);
    toast.success("Scenario name updated.");
    cancelRenameScenario();
  };

  const deleteScenario = () => {
    if (!activeScenario) return;
    store.deleteScenario(activeScenario.id);
    toast.success("Scenario deleted.");
    setEditingScenarioName(false);
    setScenarioNameDraft("");
    setConfirmDeleteOpen(false);
  };

  const trackRecommendationAction = async (
    action: "accepted_switch" | "dismissed_switch" | "kept_current",
    row: MemberOptimizationResult
  ) => {
    try {
      await fetch("/api/v1/recommendations/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: row.currentPlan.provider,
          recommendedPlanId: row.recommendedPlan?.planId,
          action,
          city: dashboardData.city,
          memberName: row.name,
        }),
      });
    } catch {
      // Non-blocking telemetry.
    }
  };

  const openRecharge = (row: MemberOptimizationResult) => {
    void trackRecommendationAction("accepted_switch", row);
    const provider = row.currentPlan.provider;
    const url = RECHARGE_LINKS[provider] ?? "https://www.google.com/search?q=recharge+" + encodeURIComponent(provider);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.message("Opened operator recharge page in a new tab.");
  };

  if (!hydrated) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="relative h-28 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-white to-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  const rangeLabel = range === "daily" ? "Daily" : "Weekly";
  const rangeSuffix = range === "daily" ? "/day" : "/week";
  const rangeCurrent = toRangeAmount(result.currentCost, range);
  const rangeOptimized = toRangeAmount(result.optimizedCost, range);
  const rangeSavings = Math.max(0, rangeCurrent - rangeOptimized);
  const metricCards = [
    { label: `${rangeLabel} Cost`, value: rangeCurrent, icon: BadgeDollarSign, accent: "from-indigo-500 to-blue-600", pulse: false },
    { label: "Yearly Cost", value: yearly, icon: BarChart3, accent: "from-violet-500 to-indigo-600", pulse: false },
    { label: `Optimized ${rangeLabel}`, value: rangeOptimized, icon: Target, accent: "from-cyan-500 to-blue-600", pulse: false },
    { label: `${rangeLabel} Savings`, value: rangeSavings, icon: PiggyBank, accent: "from-emerald-500 to-green-600", pulse: true },
  ] as const;

  const pieData = [
    { name: "Telecom Lines", value: toRangeAmount(plansCost, range) },
    { name: "Subscriptions", value: toRangeAmount(subsCost, range) },
    { name: "WiFi", value: toRangeAmount(dashboardData.wifi.cost, range) },
  ];
  const barData = [
    { name: `Current (${rangeLabel})`, value: rangeCurrent },
    { name: `Optimized (${rangeLabel})`, value: rangeOptimized },
  ];
  const pieColors = ["#4f46e5", "#0ea5e9", "#10b981"];

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={confirmDeleteOpen && Boolean(activeScenario)}
        title="Delete scenario?"
        description={activeScenario ? `Delete ${activeScenario.name}? This cannot be undone.` : ""}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={deleteScenario}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass mb-2 flex flex-col gap-4 rounded-2xl border border-indigo-100/80 bg-white/70 p-5 shadow-sm backdrop-blur-md"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 ring-2 ring-white"
            aria-hidden
          >
            {initials(displayName === "there" ? "You" : displayName)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Welcome back</p>
            {!editingScenarioName ? (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{titleName}</h1>
            ) : (
              <div className="mt-1 flex w-full flex-wrap items-center gap-2">
                <Input
                  value={scenarioNameDraft}
                  onChange={(e) => setScenarioNameDraft(e.target.value)}
                  className="h-9 w-full bg-white sm:w-[260px]"
                  placeholder="Scenario name"
                />
                <Button type="button" size="sm" onClick={saveRenameScenario} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={cancelRenameScenario} className="gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            )}
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Per-line telecom savings, household totals, and charts — refresh the wizard when your plans change.
            </p>
            {result ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-indigo-200/90 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                Latest analyzed results
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 border-t border-indigo-100/80 pt-4">
          <Select
            value={store.activeScenarioId ?? "__live__"}
            onChange={(e) => store.setActiveScenario(e.target.value === "__live__" ? undefined : e.target.value)}
            className="h-10 w-full rounded-xl bg-white sm:min-w-[220px] sm:w-auto"
          >
            <option value="__live__">Live current inputs</option>
            {store.scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </Select>
          {activeScenario ? (
            <>
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto" onClick={beginRenameScenario}>
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 sm:w-auto"
                onClick={() => {
                  store.loadScenarioToWizard(activeScenario.id);
                  router.push("/wizard");
                }}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Open in wizard
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-rose-700 sm:w-auto"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          ) : null}
          <div
            className="inline-flex w-full justify-center rounded-full border border-slate-200 bg-white p-1 shadow-sm sm:w-auto sm:justify-start"
            role="group"
            aria-label="View range"
          >
            {(["daily", "weekly"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  range === r ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Link
            href="/wizard"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "w-full gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg sm:w-auto"
            )}
          >
            Open wizard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300 hover:shadow-md sm:w-auto"
            onClick={openComparePanel}
          >
            <GitCompareArrows className="h-4 w-4" />
            {showComparePanel ? "Hide compare" : "Compare plans"}
          </Button>
          <Select
            value={String(shareExpiryPreset)}
            onChange={(e) => setShareExpiryPreset((Number(e.target.value) === 7 ? 7 : 30) as 7 | 30)}
            className="h-10 w-full rounded-xl bg-white sm:w-auto"
          >
            <option value="7">Share expiry: 7 days</option>
            <option value="30">Share expiry: 30 days</option>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300 hover:shadow-md sm:w-auto"
            onClick={shareScenarioLink}
          >
            <Link2 className="h-4 w-4" />
            Share link
          </Button>
        </div>
      </motion.div>

      {dashboardData.members.length === 0 ? (
        <Card className="border-slate-200/90 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>No data yet</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">Run the wizard and add at least one member with their line details.</CardContent>
        </Card>
      ) : (
        <>
          <div className="relative mb-1">
            <p className="text-sm font-semibold text-slate-900">Performance Overview</p>
            <span className="mt-1 block h-0.5 w-16 rounded-full bg-indigo-300" />
          </div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={sectionStagger}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {metricCards.map((k) => (
              <motion.div
                key={k.label}
                variants={sectionItem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-2xl"
              >
                <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:border-indigo-300 hover:shadow-xl">
                  <div className="flex items-start justify-between">
                    <span className={cn("inline-flex rounded-xl bg-gradient-to-r p-2.5 text-white shadow-md", k.accent)}>
                      <k.icon className="h-4 w-4" />
                    </span>
                    {k.label.includes("Savings") && (
                      <span className={cn("rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700", k.pulse ? "animate-pulse" : "")}>
                        + Value
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    Rs.<CountUp end={k.value} duration={1.1} separator="," decimals={0} />
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid gap-3 lg:grid-cols-2">
            {typeof result.totalFamilyTelecomSavings === "number" && (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm">
                Total family telecom savings: <span className="font-bold">Rs.{result.totalFamilyTelecomSavings}/mo</span>{" "}
                <span className="text-xs text-emerald-700">
                  (~Rs.{toRangeAmount(result.totalFamilyTelecomSavings, range).toFixed(0)} {rangeSuffix})
                </span>
              </p>
            )}
            {avoidableWaste > 0 && (
              <p className="rounded-2xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
                Avoidable waste estimate: <span className="font-bold">~Rs.{avoidableWaste}/mo</span>{" "}
                <span className="text-xs text-amber-700">(~Rs.{toRangeAmount(avoidableWaste, range).toFixed(0)} {rangeSuffix})</span>
              </p>
            )}
          </div>

          {result.overpaySummary && (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}>
            <Card className="border-amber-200 bg-amber-50/60 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-amber-950">
                  <AlertTriangle className="h-4 w-4" />
                  Overpay alert
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-950">{result.overpaySummary}</CardContent>
            </Card>
            </motion.div>
          )}

          <div className="relative mb-1 mt-1">
            <p className="text-sm font-semibold text-slate-900">Analytics</p>
            <span className="mt-1 block h-0.5 w-12 rounded-full bg-indigo-300" />
          </div>
          <motion.div
            id="analytics"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionStagger}
            className="grid gap-4 lg:grid-cols-2"
          >
            <motion.div variants={sectionItem} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
            <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl">
              <p className="mb-3 text-sm font-semibold text-slate-900">Cost Breakdown</p>
              <div className="h-[240px] min-w-0">
                {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <PieChart>
                    <defs>
                      <linearGradient id="pieA" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                      <linearGradient id="pieB" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                      <linearGradient id="pieC" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={88} paddingAngle={3} labelLine={false}>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? "url(#pieA)" : idx === 1 ? "url(#pieB)" : "url(#pieC)"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {pieData.map((d, i) => (
                  <span key={d.name} className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </Card>
            </motion.div>
            <motion.div variants={sectionItem} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
            <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl">
              <p className="mb-3 text-sm font-semibold text-slate-900">Current vs Optimized</p>
              <div className="h-[240px] min-w-0">
                {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <BarChart data={barData}>
                    <defs>
                      <linearGradient id="barCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                      <linearGradient id="barOptimized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      <Cell fill="url(#barCurrent)" />
                      <Cell fill="url(#barOptimized)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
                )}
              </div>
            </Card>
            </motion.div>
          </motion.div>

          <AnimatePresence initial={false}>
          {showComparePanel ? (
          <motion.div
            key="compare-panel"
            initial={{ opacity: 0, y: 16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
          <Card id="compare-plans" className="border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitCompareArrows className="h-4 w-4 text-indigo-600" />
                Compare plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {store.scenarios.length === 0 ? (
                <p className="text-sm text-slate-600">Save at least one scenario from the wizard to compare scenarios.</p>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Base scenario</p>
                      <Select value={compareBaseId} onChange={(e) => setCompareBaseId(e.target.value)} className="h-10 rounded-xl bg-white">
                        <option value="__current__">{currentSnapshot.name}</option>
                        {store.scenarios.map((sc) => (
                          <option key={`base-${sc.id}`} value={sc.id}>
                            {sc.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Compare against</p>
                      <Select
                        value={effectiveCompareTargetId}
                        onChange={(e) => setCompareTargetId(e.target.value)}
                        className="h-10 rounded-xl bg-white"
                      >
                        <option value="">Select a scenario</option>
                        <option value="__current__">{currentSnapshot.name}</option>
                        {store.scenarios.map((sc) => (
                          <option key={`target-${sc.id}`} value={sc.id}>
                            {sc.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {compareTargetSnapshot ? (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-700">
                        <p>
                          <span className="font-semibold text-slate-900">{compareBaseSnapshot.name}</span>{" "}
                          <span className="text-slate-500">({compareBaseSnapshot.updatedAtLabel})</span>
                        </p>
                        <p className="mt-1">
                          vs <span className="font-semibold text-slate-900">{compareTargetSnapshot.name}</span>{" "}
                          <span className="text-slate-500">({compareTargetSnapshot.updatedAtLabel})</span>
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Savings delta</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">
                            Rs.{(compareTargetSnapshot.savings - compareBaseSnapshot.savings).toFixed(0)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current cost delta</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">
                            Rs.{(compareTargetSnapshot.currentCost - compareBaseSnapshot.currentCost).toFixed(0)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Optimized cost delta</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">
                            Rs.{(compareTargetSnapshot.optimizedCost - compareBaseSnapshot.optimizedCost).toFixed(0)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Waste delta</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">
                            Rs.{(compareTargetSnapshot.avoidableWaste - compareBaseSnapshot.avoidableWaste).toFixed(0)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm text-indigo-900">
                          <p className="font-semibold">Base snapshot</p>
                          <p className="mt-1">Savings: Rs.{compareBaseSnapshot.savings.toFixed(0)} /mo</p>
                          <p>Members: {compareBaseSnapshot.members}</p>
                          <p>Subscriptions: {compareBaseSnapshot.subscriptions}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-900">
                          <p className="font-semibold">Compared snapshot</p>
                          <p className="mt-1">Savings: Rs.{compareTargetSnapshot.savings.toFixed(0)} /mo</p>
                          <p>Members: {compareTargetSnapshot.members}</p>
                          <p>Subscriptions: {compareTargetSnapshot.subscriptions}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">Choose a target scenario to see clear deltas.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          </motion.div>
          ) : null}
          </AnimatePresence>

          <Card className="border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="inline-flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-indigo-600" />
                  Share link manager
                </span>
                <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => void refreshShareStats()}>
                  {sharesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shareItems.length === 0 ? (
                <p className="text-sm text-slate-600">No share links yet. Create one from the header controls.</p>
              ) : (
                shareItems.slice(0, 12).map((item) => (
                  <div key={item.shareId} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.scenarioName}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          item.revoked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {item.revoked ? "Revoked" : "Active"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Views: {item.viewCount ?? 0} · Expires: {new Date(item.expiresAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.shareUrl);
                          toast.success("Share URL copied.");
                        }}
                      >
                        Copy
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => window.open(item.shareUrl, "_blank")}>
                        Open
                      </Button>
                      {!item.revoked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1 text-rose-700"
                          onClick={async () => {
                            const res = await fetch(`/api/v1/share/${item.shareId}/revoke`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                            });
                            if (!res.ok) {
                              toast.error("Could not revoke link.");
                              return;
                            }
                            store.updateShareLink(item.shareId, { revoked: true, revokedAt: new Date().toISOString() });
                            toast.success("Share link revoked.");
                          }}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {memberRows.length > 0 && (
            <Card className="border-slate-200/90 shadow-md">
              <CardHeader>
                <CardTitle className="relative inline-flex w-fit items-center pb-2 text-lg">
                  Per-member optimization
                  <span className="absolute -bottom-0 left-0 h-0.5 w-14 rounded-full bg-indigo-300" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {memberRows.map((row) => (
                  <motion.div
                    key={row.memberIndex}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm transition-all duration-300 ease-out hover:border-indigo-300 hover:shadow-xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{row.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">{row.currentPlan.rechargeIntent}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{row.currentPlan.callingNeed}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{row.currentPlan.priority}</span>
                          <span className={cn("rounded-full px-2 py-0.5 font-semibold", row.verdict === "switch_recommended" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900")}>
                            {row.verdict === "switch_recommended" ? "Switch recommended" : "Current plan is OK"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 animate-pulse">Save Rs.{row.savings}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 transition-all duration-300 hover:scale-105 hover:shadow-md"
                          onClick={() => openRecharge(row)}
                        >
                          Switch plan <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-slate-600"
                          onClick={() => {
                            void trackRecommendationAction("kept_current", row);
                            toast.message(`Marked ${row.name} as keep current.`);
                          }}
                        >
                          Keep current
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => setExpandedMember((prev) => (prev === row.memberIndex ? null : row.memberIndex))}
                        >
                          {expandedMember === row.memberIndex ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          Details
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                    {expandedMember === row.memberIndex && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                          <div className="rounded-xl border border-white bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</p>
                            <p className="mt-1 text-slate-800">
                              {row.currentPlan.provider} · ₹{row.currentPlan.currentPlanPrice} / {row.currentPlan.validityDays}d · allowance{" "}
                              {row.currentPlan.planDataPerDay} · uses ~{row.currentPlan.actualUsagePerDay}
                            </p>
                            <p className="mt-1 text-slate-600">~Rs.{Math.round(row.currentPlan.currentMonthlyEquivalent)}/mo equivalent</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">Current fit score: {row.currentFitScore}/100</p>
                          </div>
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Recommended</p>
                            {row.recommendedPlan ? (
                              <>
                                <p className="mt-1 font-medium text-emerald-950">
                                  {row.recommendedPlan.planId} · ₹{row.recommendedPlan.price} / {row.recommendedPlan.validityDays}d ·{" "}
                                  {row.recommendedPlan.dataPerDayGB}GB/day
                                </p>
                                <p className="mt-1 text-emerald-900">
                                  ~Rs.{Math.round(monthlyEquivalent(row.recommendedPlan))}/mo eq. · Save ~Rs.{row.savings}/mo
                                </p>
                                <p className="mt-1 text-xs font-medium text-emerald-900">
                                  Recommended fit score: {row.recommendedFitScore}/100 · Confidence: {row.confidence}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-emerald-900">No stronger catalog pick — keep monitoring offers.</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 md:grid-cols-4">
                          <p>Unused data waste: Rs.{row.wasteBreakdown.unusedDataCost}</p>
                          <p>Over-spec validity: Rs.{row.wasteBreakdown.overSpecCost}</p>
                          <p>Network mismatch: Rs.{row.wasteBreakdown.networkPenaltyCost}</p>
                          <p>OTT mismatch: Rs.{row.wasteBreakdown.ottMismatchCost}</p>
                        </div>
                        {row.reason.length > 0 && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Why this recommendation
                            </p>
                            <ul className="space-y-1.5 text-sm text-slate-700">
                              {row.reason.map((r) => (
                                <li key={r} className="flex items-start gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                    </AnimatePresence>
                    {row.alternatives.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">
                        Alternatives: {row.alternatives.map((a) => `${a.planId} (~Rs.${Math.round(monthlyEquivalent(a))}/mo)`).join(" · ")}
                      </p>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-start">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvancedInsights((v) => !v)}>
              {showAdvancedInsights ? "Hide extra insights" : "Load extra insights"}
            </Button>
          </div>

          {showAdvancedInsights && result.planRecommendations?.some((r) => r.bestPlan) && memberRows.length === 0 && (
            <Card className="border-slate-200/90 shadow-md transition-all duration-300 hover:border-indigo-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle>Legacy recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700">
                {result.planRecommendations
                  .filter((r) => r.bestPlan)
                  .map((rec) => (
                    <div key={rec.userPlanLabel} className="rounded-xl border bg-slate-50 p-3">
                      <p className="font-medium">{rec.userPlanLabel}</p>
                      <p className="text-emerald-800">→ {rec.bestPlan?.planId} · save ~Rs.{rec.savingsAmount}/mo</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {showAdvancedInsights && (result.bestValuePlan || (result.trendingPlans && result.trendingPlans.length > 0)) && (
            <div className="grid gap-4 md:grid-cols-2">
              {result.bestValuePlan && (
                <Card className="border-slate-200/90 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Best value (catalog)
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Top pick</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-700">
                    <p className="font-semibold">{result.bestValuePlan.planId}</p>
                    <p>
                      {result.bestValuePlan.provider} · Rs.{result.bestValuePlan.price} / {result.bestValuePlan.validityDays}d ·{" "}
                      {result.bestValuePlan.dataPerDayGB}GB/day
                    </p>
                  </CardContent>
                </Card>
              )}
              {result.trendingPlans && result.trendingPlans.length > 0 && (
                <Card className="border-slate-200/90 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl">
                  <CardHeader>
                    <CardTitle>Trending picks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {result.trendingPlans.map((p) => (
                        <li key={p.planId}>
                          {p.provider} {p.planId} — Rs.{p.price}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {showAdvancedInsights ? (
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Keep going</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-emerald-50">
              <p>
                Small plan tweaks add up. Re-run the wizard after each recharge cycle to stay on the cheapest fit for your real usage.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/wizard"
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-white underline-offset-4 transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-lg"
                >
                  Adjust your setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {activeScenario ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-white/90 underline-offset-4 hover:underline"
                    onClick={() => {
                      store.loadScenarioToWizard(activeScenario.id);
                      router.push("/wizard");
                    }}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Open this scenario in wizard
                  </button>
                ) : null}
              </div>
            </CardContent>
          </Card>
          ) : null}

          {showAdvancedInsights ? (
          <Card className="border-slate-200/90 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="relative inline-flex w-fit items-center pb-2 text-lg">
                Action checklist
                <span className="absolute -bottom-0 left-0 h-0.5 w-14 rounded-full bg-indigo-300" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                {result.suggestions.map((s) => (
                  <li key={s} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 leading-relaxed">
                    <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Insight
                    </span>
                    <span className="ml-2">{s}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">Optimized yearly spend: Rs.{optYearly.toFixed(0)}</p>
            </CardContent>
          </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
