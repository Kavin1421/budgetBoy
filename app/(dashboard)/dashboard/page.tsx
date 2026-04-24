"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useBudgetStore } from "@/store/useBudgetStore";
import { ResultCard } from "@/components/ResultCard";
import { Charts } from "@/components/Charts";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyEquivalentFromRecharge } from "@/lib/billingUtils";
import { monthlyEquivalent } from "@/lib/telecomPlanQuery";
import type { MemberOptimizationResult } from "@/lib/optimizerTypes";

const RECHARGE_LINKS: Record<string, string> = {
  Jio: "https://www.jio.com/selfcare/recharge/",
  Airtel: "https://www.airtel.in/recharge",
  VI: "https://www.myvi.in/recharge",
  BSNL: "https://portal2.bsnl.in/",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function DashboardPage() {
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const store = useBudgetStore();
  const result = store.getOptimization();

  const yearly = result.currentCost * 12;
  const optYearly = result.optimizedCost * 12;

  const plansCost = store.members.reduce(
    (sum, m) => sum + monthlyEquivalentFromRecharge(m.currentPlanPrice, Number(m.validity) || 28),
    0
  );
  const subsCost = store.subscriptions.reduce((sum, s) => sum + s.cost, 0);

  const memberRows: MemberOptimizationResult[] =
    result.memberOptimizations?.length ? result.memberOptimizations : [];

  const displayName = store.members[0]?.name?.trim() || "there";
  const firstName = displayName.includes(" ") ? displayName.split(/\s+/)[0] : displayName;

  const openRecharge = (provider: string) => {
    const url = RECHARGE_LINKS[provider] ?? "https://www.google.com/search?q=recharge+" + encodeURIComponent(provider);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.message("Opened operator recharge page in a new tab.");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 ring-2 ring-white"
            aria-hidden
          >
            {initials(displayName === "there" ? "You" : displayName)}
          </div>
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{firstName}</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Per-line telecom savings, household totals, and charts — refresh the wizard when your plans change.
            </p>
            {store.lastAnalysis ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Latest analyzed results
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm"
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
          <Link href="/wizard" className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2 shadow-emerald-900/15")}>
            Open wizard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {store.members.length === 0 ? (
        <Card className="border-slate-200/90 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>No data yet</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">Run the wizard and add at least one member with their line details.</CardContent>
        </Card>
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { title: "Monthly cost", value: `Rs.${result.currentCost.toFixed(0)}`, accent: "teal" as const },
              { title: "Yearly cost", value: `Rs.${yearly.toFixed(0)}`, accent: "teal" as const },
              { title: "Optimized monthly", value: `Rs.${result.optimizedCost.toFixed(0)}`, accent: "teal" as const },
              { title: "Potential savings", value: `Rs.${result.savings.toFixed(0)}`, accent: "green" as const },
            ].map((k) => (
              <motion.div
                key={k.title}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                className={cn(k.accent === "green" && "rounded-2xl p-[2px] bg-gradient-to-br from-emerald-400/70 to-teal-500/50 shadow-md shadow-emerald-900/10")}
              >
                <div className={cn(k.accent === "green" && "rounded-[14px] bg-white")}>
                  <ResultCard title={k.title} value={k.value} accent={k.accent} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {typeof result.totalFamilyTelecomSavings === "number" && (
            <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm">
              Total family telecom savings (lines only): Rs.{result.totalFamilyTelecomSavings}/mo
            </p>
          )}

          {result.overpaySummary && (
            <Card className="mb-4 border-amber-200 bg-amber-50/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-950">Overpay check</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-950">{result.overpaySummary}</CardContent>
            </Card>
          )}

          <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-6">
            <Charts
              currentCost={result.currentCost}
              optimizedCost={result.optimizedCost}
              wifiCost={store.wifi.cost}
              plansCost={plansCost}
              subsCost={subsCost}
            />
          </div>

          {memberRows.length > 0 && (
            <Card className="border-slate-200/90 shadow-md">
              <CardHeader>
                <CardTitle>Per-member optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {memberRows.map((row) => (
                  <div key={row.memberIndex} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-inner">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500">Network score in your city: {row.networkScore}/10</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => openRecharge(row.currentPlan.provider)}>
                        Switch plan <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</p>
                        <p className="mt-1 text-slate-800">
                          {row.currentPlan.provider} · ₹{row.currentPlan.currentPlanPrice} / {row.currentPlan.validityDays}d · allowance{" "}
                          {row.currentPlan.planDataPerDay} · uses ~{row.currentPlan.actualUsagePerDay}
                        </p>
                        <p className="mt-1 text-slate-600">~Rs.{Math.round(row.currentPlan.currentMonthlyEquivalent)}/mo equivalent</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 shadow-sm">
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
                          </>
                        ) : (
                          <p className="mt-1 text-emerald-900">No stronger catalog pick — keep monitoring offers.</p>
                        )}
                      </div>
                    </div>
                    {row.reason.length > 0 && (
                      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
                        {row.reason.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                    {row.alternatives.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">
                        Alternatives: {row.alternatives.map((a) => `${a.planId} (~Rs.${Math.round(monthlyEquivalent(a))}/mo)`).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.planRecommendations?.some((r) => r.bestPlan) && memberRows.length === 0 && (
            <Card className="mt-4 border-slate-200/90 shadow-md">
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

          {(result.bestValuePlan || (result.trendingPlans && result.trendingPlans.length > 0)) && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {result.bestValuePlan && (
                <Card className="border-slate-200/90 shadow-sm">
                  <CardHeader>
                    <CardTitle>Best value (catalog)</CardTitle>
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
                <Card className="border-slate-200/90 shadow-sm">
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

          <Card className="mt-6 overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Keep going</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-emerald-50">
              <p>
                Small plan tweaks add up. Re-run the wizard after each recharge cycle to stay on the cheapest fit for your real usage.
              </p>
              <Link href="/wizard" className="inline-flex items-center gap-1 font-semibold text-white underline-offset-4 hover:underline">
                Adjust your setup
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="mt-4 border-slate-200/90 shadow-sm">
            <CardHeader>
              <CardTitle>Household suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                {result.suggestions.map((s) => (
                  <li key={s} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">Optimized yearly spend: Rs.{optYearly.toFixed(0)}</p>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
