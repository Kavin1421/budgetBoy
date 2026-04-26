"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PlanSearchDropdown } from "@/components/PlanSearchDropdown";
import { MemberForm } from "@/components/MemberForm";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { WizardRail } from "@/components/wizard/WizardRail";
import { useBudgetStore } from "@/store/useBudgetStore";
import {
  ACTUAL_USAGE_PER_DAY,
  BILL_SHOCK_TOLERANCE,
  CALLING_NEEDS,
  CALL_QUALITY_SENSITIVITY,
  DATA_PER_DAY,
  DATA_ROLLOVER_RISK_WINDOWS,
  INDIAN_CITIES,
  MEMBER_LINE_USAGE,
  MEMBER_PRIORITIES,
  MEMBER_RECHARGE_INTENTS,
  PROVIDERS,
  RECHARGE_FRICTION_PREFERENCES,
  SUBSCRIPTION_BILLING_CYCLES,
  VALIDITIES,
  WIFI_USAGE_TYPES,
} from "@/utils/constants";
import { type MemberMobileLine, wizardSchema } from "@/utils/validators";
import { normalizeWizardFromStore, validateWizardStep } from "@/utils/wizardFlow";

const steps = ["Mode", "City", "Members", "WiFi", "Subscriptions", "Income", "Review"] as const;

const panelVariants = {
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -14, filter: "blur(4px)" },
};

function mapPlanDataPerDayToEnum(gb: number): (typeof DATA_PER_DAY)[number] | null {
  if (gb <= 0) return "No data";
  if (Math.abs(gb - 1) < 0.001) return "1GB";
  if (Math.abs(gb - 1.5) < 0.001) return "1.5GB";
  if (Math.abs(gb - 2) < 0.001) return "2GB";
  if (Math.abs(gb - 2.5) < 0.001) return "2.5GB";
  if (Math.abs(gb - 3) < 0.001) return "3GB";
  return null;
}

function dedupePlans<T extends { planId: string; price: number; validityDays: number; dataPerDayGB: number; totalDataGB?: number }>(plans: T[]) {
  const byFingerprint = new Map<string, T>();
  for (const p of plans) {
    const key = `${p.price}|${p.validityDays}|${p.dataPerDayGB}|${p.totalDataGB ?? 0}`;
    const existing = byFingerprint.get(key);
    if (!existing || p.planId.localeCompare(existing.planId) < 0) {
      byFingerprint.set(key, p);
    }
  }
  return [...byFingerprint.values()];
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: unknown;
      requestId?: string;
    };
    if (typeof body.error === "string") return body.error;
    if (body.error && typeof body.error === "object" && body.error !== null) {
      const errObj = body.error as Record<string, unknown>;
      if (typeof errObj.message === "string") {
        const code = typeof errObj.code === "string" ? ` [${errObj.code}]` : "";
        const rid = body.requestId ? ` (ref: ${body.requestId})` : "";
        return `${errObj.message}${code}${rid}`;
      }
      const flat = body.error as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
      if ("formErrors" in flat || "fieldErrors" in flat) {
        const first =
          flat.formErrors?.[0] ??
          Object.values(flat.fieldErrors ?? {})
            .flat()
            .find(Boolean);
        if (first) return first;
      }
    }
  } catch {
    /* ignore */
  }
  return res.status === 400 ? "Invalid data sent to the server." : `Request failed (${res.status}).`;
}

function memberConfidence(member: MemberMobileLine, selectedPlanId: string, loadingPlans: boolean): { level: "Low" | "Medium" | "High"; score: number } {
  let score = 35;
  if (member.name.trim().length >= 2) score += 15;
  if (selectedPlanId) score += 15;
  if (member.actualUsagePerDay !== "No data") score += 10;
  if (member.networkConfidence >= 1 && member.networkConfidence <= 5) score += 10;
  if (member.dataRolloverRiskWindow !== "1-3") score += 5;
  if (member.hotspotNeeded) score += 5;
  if (member.callQualitySensitivity !== "medium") score += 5;
  if (member.billShockTolerance === "no") score += 5;
  if (loadingPlans) score = Math.max(30, score - 10);
  return { level: score >= 75 ? "High" : score >= 55 ? "Medium" : "Low", score: Math.min(100, score) };
}

function confidenceTone(level: "Low" | "Medium" | "High") {
  if (level === "High") {
    return {
      container: "border-emerald-200 bg-emerald-50/70",
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      bar: "bg-emerald-500",
      sub: "text-emerald-800",
    };
  }
  if (level === "Medium") {
    return {
      container: "border-amber-200 bg-amber-50/70",
      badge: "bg-amber-100 text-amber-900 border-amber-200",
      bar: "bg-amber-500",
      sub: "text-amber-800",
    };
  }
  return {
    container: "border-rose-200 bg-rose-50/70",
    badge: "bg-rose-100 text-rose-900 border-rose-200",
    bar: "bg-rose-500",
    sub: "text-rose-800",
  };
}

export default function WizardPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<MemberMobileLine | null>(null);
  const [editingShowAdvancedTuning, setEditingShowAdvancedTuning] = useState(false);
  const [editingSelectedPlanId, setEditingSelectedPlanId] = useState("");
  const [editingProviderPlans, setEditingProviderPlans] = useState<
    Array<{ planId: string; price: number; validityDays: number; dataPerDayGB: number; ottBenefits: string[] }>
  >([]);
  const [loadingEditingPlans, setLoadingEditingPlans] = useState(false);
  const [editingPlanError, setEditingPlanError] = useState<string | null>(null);
  const [editingSubscriptionIndex, setEditingSubscriptionIndex] = useState<number | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<{
    name: string;
    cost: number;
    billingCycle: (typeof SUBSCRIPTION_BILLING_CYCLES)[number];
    used: boolean;
  } | null>(null);
  const router = useRouter();
  const store = useBudgetStore();
  const optimization = store.getOptimization();
  const progress = ((step + 1) / steps.length) * 100;

  const data = useMemo(
    () =>
      normalizeWizardFromStore({
        mode: store.mode,
        city: store.city,
        members: store.members,
        subscriptions: store.subscriptions,
        wifi: store.wifi,
        income: store.income,
      }),
    [store.mode, store.city, store.members, store.subscriptions, store.wifi, store.income]
  );

  const stepCheck = useMemo(() => validateWizardStep(step, data), [step, data]);
  const canGoNext = stepCheck.ok && step < steps.length - 1;
  const canSubmit = step === steps.length - 1 && stepCheck.ok;

  const goNext = () => {
    const v = validateWizardStep(step, data);
    if (!v.ok) {
      toast.error(v.message);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = async () => {
    const normalized = normalizeWizardFromStore({
      mode: store.mode,
      city: store.city,
      members: store.members,
      subscriptions: store.subscriptions,
      wifi: store.wifi,
      income: store.income,
    });
    const parsed = wizardSchema.safeParse(normalized);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please fix validation errors");
      return;
    }

    setSubmitting(true);
    try {
      const analysisRes = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!analysisRes.ok) {
        const msg = await readErrorMessage(analysisRes);
        toast.error(msg);
        return;
      }

      const analysis = await analysisRes.json();
      store.setLastAnalysis(analysis);
      store.saveScenarioFromCurrent(analysis);
      if ((analysis.savings ?? optimization.savings) > 0) confetti({ particleCount: 80, spread: 75, origin: { y: 0.7 } });

      void fetch("/api/v1/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      }).then(async (saveRes) => {
        if (!saveRes.ok) {
          const saveMsg = await readErrorMessage(saveRes);
          toast.message("Analysis saved locally. Server profile save failed: " + saveMsg);
        }
      });

      toast.success("Opening your full analysis on the dashboard…");
      router.push("/dashboard");
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepHint = !stepCheck.ok ? stepCheck.message : null;

  const startMemberEdit = (index: number) => {
    setEditingMemberIndex(index);
    setEditingMember({ ...store.members[index] });
    setEditingShowAdvancedTuning(false);
    setEditingSelectedPlanId("");
    setEditingProviderPlans([]);
    setEditingPlanError(null);
  };

  const cancelMemberEdit = () => {
    setEditingMemberIndex(null);
    setEditingMember(null);
    setEditingShowAdvancedTuning(false);
    setEditingSelectedPlanId("");
    setEditingProviderPlans([]);
    setEditingPlanError(null);
  };

  const editingCompatiblePlans = useMemo(() => {
    const validValidity = new Set<string>(VALIDITIES);
    const filtered = editingProviderPlans.filter(
      (p) => validValidity.has(String(p.validityDays)) && mapPlanDataPerDayToEnum(p.dataPerDayGB) !== null
    );
    return dedupePlans(filtered);
  }, [editingProviderPlans]);

  const editingPlanOptions = useMemo(
    () =>
      editingCompatiblePlans.map((p) => ({
        value: p.planId,
        label: `${p.planId} - Rs.${p.price} / ${p.validityDays}d / ${p.dataPerDayGB}GB-day`,
      })),
    [editingCompatiblePlans]
  );

  const editingValidityOptions = useMemo(() => {
    const fromPlans = [...new Set(editingCompatiblePlans.map((p) => String(p.validityDays)))].sort((a, b) => Number(a) - Number(b));
    return fromPlans.length ? fromPlans : [...VALIDITIES];
  }, [editingCompatiblePlans]);

  const editingDataPerDayOptions = useMemo(() => {
    const fromPlans = [
      ...new Set(
        editingCompatiblePlans
          .map((p) => mapPlanDataPerDayToEnum(p.dataPerDayGB))
          .filter((v): v is (typeof DATA_PER_DAY)[number] => Boolean(v))
      ),
    ];
    const order = new Map(DATA_PER_DAY.map((v, i) => [v, i]));
    fromPlans.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    return fromPlans.length ? fromPlans : [...DATA_PER_DAY];
  }, [editingCompatiblePlans]);

  useEffect(() => {
    if (!editingMember) return;
    const controller = new AbortController();
    const loadPlans = async () => {
      setLoadingEditingPlans(true);
      setEditingPlanError(null);
      try {
        const res = await fetch(`/api/v1/telecom/plans?provider=${encodeURIComponent(editingMember.provider)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load plans (${res.status})`);
        const body = (await res.json()) as {
          plans?: Array<{
            planId: string;
            price: number;
            validityDays: number;
            dataPerDayGB: number;
            ottBenefits?: string[];
          }>;
          data?: {
            plans?: Array<{
              planId: string;
              price: number;
              validityDays: number;
              dataPerDayGB: number;
              ottBenefits?: string[];
            }>;
          };
        };
        const plans = (body.plans ?? body.data?.plans ?? []).map((p) => ({
          planId: p.planId,
          price: Number(p.price) || 0,
          validityDays: Number(p.validityDays) || 0,
          dataPerDayGB: Number(p.dataPerDayGB) || 0,
          ottBenefits: p.ottBenefits ?? [],
        }));
        setEditingProviderPlans(plans);
      } catch (e) {
        if (controller.signal.aborted) return;
        setEditingProviderPlans([]);
        setEditingPlanError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        if (!controller.signal.aborted) setLoadingEditingPlans(false);
      }
    };
    void loadPlans();
    return () => controller.abort();
  }, [editingMember?.provider, editingMember]);

  const applyEditingPlan = (planId: string) => {
    if (!editingMember) return;
    setEditingSelectedPlanId(planId);
    const plan = editingCompatiblePlans.find((p) => p.planId === planId);
    if (!plan) return;
    const mappedData = mapPlanDataPerDayToEnum(plan.dataPerDayGB);
    if (!mappedData) return;
    setEditingMember({
      ...editingMember,
      currentPlanPrice: plan.price,
      validity: String(plan.validityDays) as (typeof VALIDITIES)[number],
      planDataPerDay: mappedData,
      needsOtt: plan.ottBenefits.length > 0 ? true : editingMember.needsOtt,
    });
  };

  const saveMemberEdit = () => {
    if (editingMemberIndex === null || !editingMember) return;
    const parsed = wizardSchema.shape.members.element.safeParse(editingMember);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix member fields before saving.");
      return;
    }
    store.updateMember(editingMemberIndex, parsed.data);
    toast.success("Member details updated.");
    cancelMemberEdit();
  };

  const startSubscriptionEdit = (index: number) => {
    setEditingSubscriptionIndex(index);
    const sub = store.subscriptions[index];
    setEditingSubscription({ ...sub, billingCycle: sub.billingCycle ?? "monthly" });
  };

  const cancelSubscriptionEdit = () => {
    setEditingSubscriptionIndex(null);
    setEditingSubscription(null);
  };

  const saveSubscriptionEdit = () => {
    if (editingSubscriptionIndex === null || !editingSubscription) return;
    const parsed = wizardSchema.shape.subscriptions.element.safeParse({
      name: editingSubscription.name.trim(),
      cost: editingSubscription.cost,
      billingCycle: editingSubscription.billingCycle,
      used: editingSubscription.used,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix subscription fields before saving.");
      return;
    }
    store.updateSubscription(editingSubscriptionIndex, parsed.data);
    toast.success("Subscription updated.");
    cancelSubscriptionEdit();
  };

  return (
    <main className="relative mx-auto w-full max-w-6xl px-2 py-5 sm:px-4 md:py-12 lg:max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/55 bg-white/92 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/60 backdrop-blur-2xl md:rounded-3xl"
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-0 lg:grid-cols-[minmax(200px,240px)_1fr] lg:min-h-[560px]">
          <aside className="border-b border-slate-200/80 bg-slate-50/80 p-4 lg:border-b-0 lg:border-r lg:p-6">
            <div className="mb-4 flex items-center gap-2 lg:mb-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/20">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">BudgetBoy</p>
                <p className="text-sm font-semibold text-slate-900">Setup wizard</p>
              </div>
            </div>
            <WizardRail steps={steps} currentStep={step} onSelect={(i) => setStep(i)} />
          </aside>

          <div className="flex min-w-0 flex-col p-3 sm:p-6 md:p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                <span>
                  Step {step + 1} of {steps.length}
                </span>
                <span className="tabular-nums text-emerald-700">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/90">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                />
              </div>
            </div>

            <Card className="flex-1 border-slate-200/90 bg-white/90 shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{steps[step]}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-slate-600">
                  {step === 0 && "Choose how you track spend — we tune defaults for individuals, families, or shared flats."}
                  {step === 1 && "Your city shapes network scores for Jio, Airtel, VI, and BSNL in recommendations."}
                  {step === 2 && "Add each mobile line with mandatory intent (calls/data/both) so recommendations fit real needs."}
                  {step === 3 && "Broadband cost and how heavily you rely on home WiFi."}
                  {step === 4 && "OTT, apps, and recurring subscriptions — mark what you actually use. You can continue with none."}
                  {step === 5 && "Optional income helps us frame savings as a share of cash flow."}
                  {step === 6 && "Confirm everything looks right, then run the full optimizer on the server."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stepHint ? (
                  <p
                    role="alert"
                    className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
                  >
                    {stepHint}
                  </p>
                ) : null}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    variants={panelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-[200px] space-y-4 pb-24 sm:pb-0"
                  >
                    {step === 0 && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Plan list name</Label>
                          <Input
                            value={store.currentScenarioName}
                            onChange={(e) => store.setCurrentScenarioName(e.target.value)}
                            placeholder="e.g. Kumar family April plans"
                          />
                          <p className="mt-2 text-xs text-slate-500">Saved to dashboard as a reusable scenario.</p>
                        </div>
                        <div>
                          <Label>Household mode</Label>
                          <Select
                            value={store.mode}
                            onChange={(e) => store.setMode(e.target.value as "individual" | "family" | "friends")}
                          >
                            <option value="individual">Individual</option>
                            <option value="family">Family</option>
                            <option value="friends">Friends / flatmates</option>
                          </Select>
                        </div>
                      </div>
                    )}
                    {step === 1 && (
                      <div className="w-full max-w-md">
                        <Label>City (network quality)</Label>
                        <Select value={store.city} onChange={(e) => store.setCity(e.target.value as (typeof INDIAN_CITIES)[number])}>
                          {INDIAN_CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          We weight operators using realistic coverage for your area.
                        </p>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="space-y-4">
                        <MemberForm onAdd={store.addMember} />
                        <div className="grid gap-2">
                          {store.members.map((m, i) => (
                            <motion.div key={`${m.name}-${i}`} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 text-sm text-slate-800">
                                <span className="min-w-0 flex-1 break-words">
                                  {m.name} · {m.provider} · ₹{m.currentPlanPrice}/{m.validity}d · plan {m.planDataPerDay} · ~{m.actualUsagePerDay} ·{" "}
                                  {m.lineUsageType} · intent {m.rechargeIntent} · {m.callingNeed}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => startMemberEdit(i)}>
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => store.removeMember(i)}>
                                    Remove
                                  </Button>
                                </div>
                              </div>
                              {editingMemberIndex === i && editingMember && (
                                <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                                  {(() => {
                                    const conf = memberConfidence(editingMember, editingSelectedPlanId, loadingEditingPlans);
                                    const tone = confidenceTone(conf.level);
                                    return (
                                      <>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Edit member</p>
                                  <div className={`mb-2 rounded-lg border px-2 py-2 ${tone.container}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-semibold text-slate-900">Recommendation confidence</p>
                                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tone.badge}`}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        {conf.level} ({conf.score}/100)
                                      </span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                                      <div
                                        className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out motion-reduce:transition-none ${tone.bar}`}
                                        style={{ width: `${conf.score}%` }}
                                      />
                                    </div>
                                    <p className={`mt-1 text-[11px] ${tone.sub}`}>
                                      Better confidence comes from real usage + selected plan + advanced tuning details.
                                    </p>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    <div className="sm:col-span-2">
                                      <Label>Name</Label>
                                      <Input
                                        value={editingMember.name}
                                        onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Provider</Label>
                                      <Select
                                        value={editingMember.provider}
                                        onChange={(e) => {
                                          setEditingMember({ ...editingMember, provider: e.target.value as (typeof PROVIDERS)[number] });
                                          setEditingSelectedPlanId("");
                                        }}
                                      >
                                        {PROVIDERS.map((p) => (
                                          <option key={p}>{p}</option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <Label>Current plan (from catalog)</Label>
                                      <PlanSearchDropdown
                                        value={editingSelectedPlanId}
                                        onChange={applyEditingPlan}
                                        options={editingPlanOptions}
                                        disabled={loadingEditingPlans || editingPlanOptions.length === 0}
                                        placeholder="Select current plan"
                                        loadingLabel="Loading plans..."
                                        emptyLabel="No matching plans"
                                      />
                                      <p className="mt-1 text-xs text-slate-500">
                                        Using {editingMember.provider} catalog plans from DB ({editingCompatiblePlans.length} unique plans from{" "}
                                        {editingProviderPlans.length} records).
                                      </p>
                                      {editingPlanError ? <p className="mt-1 text-xs text-amber-700">{editingPlanError}</p> : null}
                                    </div>
                                    <div>
                                      <Label>Recharge (₹)</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={editingMember.currentPlanPrice}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            currentPlanPrice: Math.max(1, Number(e.target.value) || 1),
                                          })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label>Validity</Label>
                                      <Select
                                        value={editingMember.validity}
                                        onChange={(e) =>
                                          setEditingMember({ ...editingMember, validity: e.target.value as (typeof VALIDITIES)[number] })
                                        }
                                      >
                                        {editingValidityOptions.map((v) => (
                                          <option key={v} value={v}>
                                            {v} days
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Plan data / day</Label>
                                      <Select
                                        value={editingMember.planDataPerDay}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            planDataPerDay: e.target.value as (typeof DATA_PER_DAY)[number],
                                          })
                                        }
                                      >
                                        {editingDataPerDayOptions.map((d) => (
                                          <option key={d}>{d}</option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Actual usage / day</Label>
                                      <Select
                                        value={editingMember.actualUsagePerDay}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            actualUsagePerDay: e.target.value as (typeof ACTUAL_USAGE_PER_DAY)[number],
                                          })
                                        }
                                      >
                                        {ACTUAL_USAGE_PER_DAY.map((d) => (
                                          <option key={d}>{d}</option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Line profile</Label>
                                      <Select
                                        value={editingMember.lineUsageType}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            lineUsageType: e.target.value as (typeof MEMBER_LINE_USAGE)[number],
                                          })
                                        }
                                      >
                                        {MEMBER_LINE_USAGE.map((t) => (
                                          <option key={t} value={t}>
                                            {t}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Recharge intent</Label>
                                      <Select
                                        value={editingMember.rechargeIntent}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            rechargeIntent: e.target.value as (typeof MEMBER_RECHARGE_INTENTS)[number],
                                          })
                                        }
                                      >
                                        {MEMBER_RECHARGE_INTENTS.map((intent) => (
                                          <option key={intent} value={intent}>
                                            {intent}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Calling need</Label>
                                      <Select
                                        value={editingMember.callingNeed}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            callingNeed: e.target.value as (typeof CALLING_NEEDS)[number],
                                          })
                                        }
                                      >
                                        {CALLING_NEEDS.map((need) => (
                                          <option key={need} value={need}>
                                            {need}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Priority</Label>
                                      <Select
                                        value={editingMember.priority}
                                        onChange={(e) =>
                                          setEditingMember({
                                            ...editingMember,
                                            priority: e.target.value as (typeof MEMBER_PRIORITIES)[number],
                                          })
                                        }
                                      >
                                        {MEMBER_PRIORITIES.map((p) => (
                                          <option key={p} value={p}>
                                            {p}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                    <div className="flex items-end gap-2 text-sm">
                                      <input
                                        id={`edit-needs-ott-${i}`}
                                        type="checkbox"
                                        checked={editingMember.needsOtt}
                                        onChange={(e) => setEditingMember({ ...editingMember, needsOtt: e.target.checked })}
                                      />
                                      <Label htmlFor={`edit-needs-ott-${i}`}>Needs OTT benefits</Label>
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900">Advanced tuning</p>
                                            <p className="text-xs text-slate-500">Optional inputs to improve plan-fit confidence and stability.</p>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="min-w-44"
                                            onClick={() => setEditingShowAdvancedTuning((v) => !v)}
                                          >
                                            {editingShowAdvancedTuning ? "Hide options" : "Show options"}
                                          </Button>
                                        </div>
                                        {editingShowAdvancedTuning ? (
                                          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            <div>
                                              <Label>Local network confidence</Label>
                                              <Select
                                                value={String(editingMember.networkConfidence)}
                                                onChange={(e) =>
                                                  setEditingMember({ ...editingMember, networkConfidence: Number(e.target.value) || 3 })
                                                }
                                              >
                                                <option value="1">1 - Poor</option>
                                                <option value="2">2</option>
                                                <option value="3">3 - Okay</option>
                                                <option value="4">4</option>
                                                <option value="5">5 - Excellent</option>
                                              </Select>
                                            </div>
                                            <div>
                                              <Label>Prefer fewer recharges</Label>
                                              <Select
                                                value={editingMember.rechargeFrictionPreference}
                                                onChange={(e) =>
                                                  setEditingMember({
                                                    ...editingMember,
                                                    rechargeFrictionPreference: e.target.value as (typeof RECHARGE_FRICTION_PREFERENCES)[number],
                                                  })
                                                }
                                              >
                                                {RECHARGE_FRICTION_PREFERENCES.map((v) => (
                                                  <option key={v} value={v}>
                                                    {v}
                                                  </option>
                                                ))}
                                              </Select>
                                            </div>
                                            <div>
                                              <Label>Run out of data early</Label>
                                              <Select
                                                value={editingMember.dataRolloverRiskWindow}
                                                onChange={(e) =>
                                                  setEditingMember({
                                                    ...editingMember,
                                                    dataRolloverRiskWindow: e.target.value as (typeof DATA_ROLLOVER_RISK_WINDOWS)[number],
                                                  })
                                                }
                                              >
                                                {DATA_ROLLOVER_RISK_WINDOWS.map((v) => (
                                                  <option key={v} value={v}>
                                                    {v} days/mo
                                                  </option>
                                                ))}
                                              </Select>
                                            </div>
                                            <div>
                                              <Label>Call quality sensitivity</Label>
                                              <Select
                                                value={editingMember.callQualitySensitivity}
                                                onChange={(e) =>
                                                  setEditingMember({
                                                    ...editingMember,
                                                    callQualitySensitivity: e.target.value as (typeof CALL_QUALITY_SENSITIVITY)[number],
                                                  })
                                                }
                                              >
                                                {CALL_QUALITY_SENSITIVITY.map((v) => (
                                                  <option key={v} value={v}>
                                                    {v}
                                                  </option>
                                                ))}
                                              </Select>
                                            </div>
                                            <div>
                                              <Label>Occasional top-up tolerance</Label>
                                              <Select
                                                value={editingMember.billShockTolerance}
                                                onChange={(e) =>
                                                  setEditingMember({
                                                    ...editingMember,
                                                    billShockTolerance: e.target.value as (typeof BILL_SHOCK_TOLERANCE)[number],
                                                  })
                                                }
                                              >
                                                {BILL_SHOCK_TOLERANCE.map((v) => (
                                                  <option key={v} value={v}>
                                                    {v}
                                                  </option>
                                                ))}
                                              </Select>
                                            </div>
                                            <div className="flex items-end">
                                              <label
                                                htmlFor={`edit-hotspot-needed-${i}`}
                                                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                              >
                                                <input
                                                  id={`edit-hotspot-needed-${i}`}
                                                  type="checkbox"
                                                  checked={editingMember.hotspotNeeded}
                                                  onChange={(e) => setEditingMember({ ...editingMember, hotspotNeeded: e.target.checked })}
                                                />
                                                Uses hotspot/tethering
                                              </label>
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                      </>
                                    );
                                  })()}
                                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={cancelMemberEdit}>
                                      Cancel
                                    </Button>
                                    <Button size="sm" className="w-full sm:w-auto" onClick={saveMemberEdit}>
                                      Save changes
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Monthly WiFi cost (₹)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={Number.isFinite(store.wifi.cost) ? store.wifi.cost : 0}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const n = raw === "" ? 0 : Number(raw);
                              store.setWifi({
                                ...store.wifi,
                                cost: Number.isFinite(n) && n >= 0 ? n : 0,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label>WiFi usage</Label>
                          <Select
                            value={store.wifi.usageType}
                            onChange={(e) => store.setWifi({ ...store.wifi, usageType: e.target.value as (typeof WIFI_USAGE_TYPES)[number] })}
                          >
                            {WIFI_USAGE_TYPES.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    )}
                    {step === 4 && (
                      <div className="space-y-4">
                        <SubscriptionForm onAdd={store.addSubscription} />
                        <div className="grid gap-2">
                          {store.subscriptions.length === 0 ? (
                            <p className="text-sm text-slate-500">No subscriptions added — that&apos;s fine; tap Continue when ready.</p>
                          ) : (
                            store.subscriptions.map((s, i) => (
                              <motion.div key={`${s.name}-${i}`} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm">
                                  <span className="min-w-0 flex-1 break-words">
                                    {s.name} · Rs.{s.cost}/{s.billingCycle === "yearly" ? "yr" : "mo"} · {s.used ? "Used" : "Unused"}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => startSubscriptionEdit(i)}>
                                      Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => store.removeSubscription(i)}>
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                                {editingSubscriptionIndex === i && editingSubscription && (
                                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Edit subscription</p>
                                    <div className="grid gap-3 md:grid-cols-4">
                                      <div className="md:col-span-2">
                                        <Label>Name</Label>
                                        <Input
                                          value={editingSubscription.name}
                                          onChange={(e) => setEditingSubscription({ ...editingSubscription, name: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Cost</Label>
                                        <Input
                                          type="number"
                                          min={1}
                                          value={editingSubscription.cost}
                                          onChange={(e) =>
                                            setEditingSubscription({
                                              ...editingSubscription,
                                              cost: Math.max(1, Number(e.target.value) || 1),
                                            })
                                          }
                                        />
                                      </div>
                                      <div>
                                        <Label>Billing</Label>
                                        <Select
                                          value={editingSubscription.billingCycle}
                                          onChange={(e) =>
                                            setEditingSubscription({
                                              ...editingSubscription,
                                              billingCycle: e.target.value as (typeof SUBSCRIPTION_BILLING_CYCLES)[number],
                                            })
                                          }
                                        >
                                          {SUBSCRIPTION_BILLING_CYCLES.map((cycle) => (
                                            <option key={cycle} value={cycle}>
                                              {cycle}
                                            </option>
                                          ))}
                                        </Select>
                                      </div>
                                      <div className="flex items-end gap-2 text-sm">
                                        <input
                                          id={`edit-subscription-used-${i}`}
                                          type="checkbox"
                                          checked={editingSubscription.used}
                                          onChange={(e) =>
                                            setEditingSubscription({ ...editingSubscription, used: e.target.checked })
                                          }
                                        />
                                        <Label htmlFor={`edit-subscription-used-${i}`}>Actively used</Label>
                                      </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={cancelSubscriptionEdit}>
                                        Cancel
                                      </Button>
                                      <Button size="sm" className="w-full sm:w-auto" onClick={saveSubscriptionEdit}>
                                        Save changes
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {step === 5 && (
                      <div className="w-full max-w-sm">
                        <Label>Monthly income (optional, ₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={store.income === undefined || store.income === null ? "" : store.income}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") store.setIncome(undefined);
                            else {
                              const n = Number(v);
                              store.setIncome(Number.isFinite(n) ? n : undefined);
                            }
                          }}
                        />
                        <p className="mt-2 text-xs text-slate-500">Leave blank if you prefer not to share.</p>
                      </div>
                    )}
                    {step === 6 && (
                      <div className="space-y-4 text-sm">
                        <p className="leading-relaxed text-slate-600">
                          Quick <strong>review</strong>. After submit you land on the <strong>dashboard</strong> with per-member picks, savings, and charts.
                        </p>
                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 text-slate-800">
                          <p>
                            <strong>Mode:</strong> {store.mode}
                          </p>
                          <p>
                            <strong>City:</strong> {store.city}
                          </p>
                          <p>
                            <strong>Members:</strong> {store.members.length}
                          </p>
                          <p>
                            <strong>Subscriptions:</strong> {store.subscriptions.length}
                          </p>
                          <p>
                            <strong>Current monthly (preview):</strong> Rs.{Math.round(optimization.currentCost)}
                          </p>
                          <p>
                            <strong>Estimated savings (preview):</strong> Rs.{Math.round(optimization.savings)}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                        >
                          Skip to dashboard
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="sticky bottom-0 z-20 -mx-1 mt-8 flex flex-col-reverse gap-3 border-t border-slate-200/90 bg-white px-1 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 shadow-[0_-8px_20px_-16px_rgba(15,23,42,0.35)] sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-8 sm:shadow-none sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="muted"
                    className="h-11 w-full justify-center text-sm font-semibold !text-slate-900 sm:w-auto"
                    disabled={step === 0}
                    onClick={() => setStep((s) => Math.max(s - 1, 0))}
                  >
                    <span className="!text-slate-900">Back</span>
                  </Button>
                  {step < steps.length - 1 ? (
                    <Button
                      type="button"
                      disabled={!canGoNext}
                      onClick={goNext}
                      className="h-11 w-full justify-center gap-2 text-sm font-semibold !text-white shadow-md shadow-emerald-900/15 sm:w-auto"
                    >
                      <span className="!text-white">Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      disabled={!canSubmit || submitting}
                      onClick={submit}
                      className="h-11 w-full justify-center gap-2 text-sm font-semibold !text-white shadow-md sm:w-auto"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span className="!text-white">Submit &amp; analyze</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
