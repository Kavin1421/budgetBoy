"use client";

import { useMemo, useState } from "react";
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
import { MemberForm } from "@/components/MemberForm";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { WizardRail } from "@/components/wizard/WizardRail";
import { useBudgetStore } from "@/store/useBudgetStore";
import { INDIAN_CITIES, WIFI_USAGE_TYPES } from "@/utils/constants";
import { wizardSchema } from "@/utils/validators";
import { normalizeWizardFromStore, validateWizardStep } from "@/utils/wizardFlow";

const steps = ["Mode", "City", "Members", "WiFi", "Subscriptions", "Income", "Review"] as const;

const panelVariants = {
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -14, filter: "blur(4px)" },
};

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

export default function WizardPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
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
      localStorage.setItem("budgetboy-result", JSON.stringify(analysis));
      store.setLastAnalysis(analysis);
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

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-8 md:py-12 lg:max-w-6xl">
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

          <div className="flex flex-col p-5 sm:p-8">
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
                  {step === 2 && "Add each mobile line with real daily data usage so we match catalog plans fairly."}
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
                    className="min-h-[200px] space-y-4"
                  >
                    {step === 0 && (
                      <div className="max-w-md">
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
                    )}
                    {step === 1 && (
                      <div className="max-w-md">
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
                            <motion.div
                              key={`${m.name}-${i}`}
                              layout
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 text-sm text-slate-800"
                            >
                              <span>
                                {m.name} · {m.provider} · ₹{m.currentPlanPrice}/{m.validity}d · plan {m.planDataPerDay} · ~{m.actualUsagePerDay}{" "}
                                · {m.lineUsageType}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => store.removeMember(i)}>
                                Remove
                              </Button>
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
                              <motion.div
                                key={`${s.name}-${i}`}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm"
                              >
                                <span>
                                  {s.name} · Rs.{s.cost} · {s.used ? "Used" : "Unused"}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => store.removeSubscription(i)}>
                                  Remove
                                </Button>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {step === 5 && (
                      <div className="max-w-sm">
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

                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-8">
                  <Button variant="muted" disabled={step === 0} onClick={() => setStep((s) => Math.max(s - 1, 0))}>
                    Back
                  </Button>
                  {step < steps.length - 1 ? (
                    <Button
                      type="button"
                      disabled={!canGoNext}
                      onClick={goNext}
                      className="gap-2 shadow-md shadow-emerald-900/10"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="success" disabled={!canSubmit || submitting} onClick={submit} className="gap-2 shadow-md">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Submit &amp; analyze
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
