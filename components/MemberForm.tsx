"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PlanSearchDropdown } from "@/components/PlanSearchDropdown";
import {
  ACTUAL_USAGE_PER_DAY,
  BILL_SHOCK_TOLERANCE,
  CALLING_NEEDS,
  CALL_QUALITY_SENSITIVITY,
  DATA_ROLLOVER_RISK_WINDOWS,
  DATA_PER_DAY,
  MEMBER_LINE_USAGE,
  MEMBER_PRIORITIES,
  MEMBER_RECHARGE_INTENTS,
  PROVIDERS,
  RECHARGE_FRICTION_PREFERENCES,
  VALIDITIES,
} from "@/utils/constants";
import type { MemberMobileLine } from "@/utils/validators";

const presets: {
  id: string;
  label: string;
  values: Pick<MemberMobileLine, "rechargeIntent" | "lineUsageType" | "actualUsagePerDay" | "callingNeed" | "needsOtt" | "priority">;
}[] = [
  {
    id: "mother",
    label: "Mother",
    values: { rechargeIntent: "calls-only", lineUsageType: "calls-only", actualUsagePerDay: "0.5GB", callingNeed: "high", needsOtt: false, priority: "balanced" },
  },
  {
    id: "father",
    label: "Father",
    values: { rechargeIntent: "both-balanced", lineUsageType: "medium", actualUsagePerDay: "1GB", callingNeed: "regular", needsOtt: false, priority: "balanced" },
  },
  {
    id: "grandparent",
    label: "Grandparent",
    values: { rechargeIntent: "senior-basic", lineUsageType: "calls-only", actualUsagePerDay: "0.5GB", callingNeed: "high", needsOtt: false, priority: "lowest-cost" },
  },
  {
    id: "teen",
    label: "Teen",
    values: { rechargeIntent: "streaming-heavy", lineUsageType: "heavy", actualUsagePerDay: "2GB+", callingNeed: "regular", needsOtt: true, priority: "balanced" },
  },
  {
    id: "worker",
    label: "Worker",
    values: { rechargeIntent: "work-business", lineUsageType: "medium", actualUsagePerDay: "1.5GB", callingNeed: "unlimited-needed", needsOtt: false, priority: "best-network" },
  },
];

function mapDataPerDayToEnum(gb: number): (typeof DATA_PER_DAY)[number] | null {
  if (gb <= 0) return "No data";
  if (Math.abs(gb - 1) < 0.001) return "1GB";
  if (Math.abs(gb - 1.5) < 0.001) return "1.5GB";
  if (Math.abs(gb - 2) < 0.001) return "2GB";
  if (Math.abs(gb - 2.5) < 0.001) return "2.5GB";
  if (Math.abs(gb - 3) < 0.001) return "3GB";
  return null;
}

function dedupePlans<T extends { planId: string; price: number; validityDays: number; dataPerDayGB: number; totalDataGB: number }>(plans: T[]) {
  const byFingerprint = new Map<string, T>();
  for (const p of plans) {
    const key = `${p.price}|${p.validityDays}|${p.dataPerDayGB}|${p.totalDataGB}`;
    const existing = byFingerprint.get(key);
    if (!existing || p.planId.localeCompare(existing.planId) < 0) {
      byFingerprint.set(key, p);
    }
  }
  return [...byFingerprint.values()];
}

export function MemberForm({ onAdd }: { onAdd: (member: MemberMobileLine) => void }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("Jio");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [currentPlanPrice, setCurrentPlanPrice] = useState(299);
  const [validity, setValidity] = useState<(typeof VALIDITIES)[number]>("28");
  const [planDataPerDay, setPlanDataPerDay] = useState<(typeof DATA_PER_DAY)[number]>("2GB");
  const [actualUsagePerDay, setActualUsagePerDay] = useState<(typeof ACTUAL_USAGE_PER_DAY)[number]>("1GB");
  const [lineUsageType, setLineUsageType] = useState<(typeof MEMBER_LINE_USAGE)[number]>("medium");
  const [rechargeIntent, setRechargeIntent] = useState<(typeof MEMBER_RECHARGE_INTENTS)[number]>("both-balanced");
  const [priority, setPriority] = useState<(typeof MEMBER_PRIORITIES)[number]>("balanced");
  const [callingNeed, setCallingNeed] = useState<(typeof CALLING_NEEDS)[number]>("regular");
  const [needsOtt, setNeedsOtt] = useState(false);
  const [networkConfidence, setNetworkConfidence] = useState(3);
  const [rechargeFrictionPreference, setRechargeFrictionPreference] =
    useState<(typeof RECHARGE_FRICTION_PREFERENCES)[number]>("medium");
  const [dataRolloverRiskWindow, setDataRolloverRiskWindow] =
    useState<(typeof DATA_ROLLOVER_RISK_WINDOWS)[number]>("1-3");
  const [hotspotNeeded, setHotspotNeeded] = useState(false);
  const [callQualitySensitivity, setCallQualitySensitivity] = useState<(typeof CALL_QUALITY_SENSITIVITY)[number]>("medium");
  const [billShockTolerance, setBillShockTolerance] = useState<(typeof BILL_SHOCK_TOLERANCE)[number]>("yes");
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planLoadError, setPlanLoadError] = useState<string | null>(null);
  const [providerPlans, setProviderPlans] = useState<
    Array<{
      planId: string;
      price: number;
      validityDays: number;
      dataPerDayGB: number;
      totalDataGB: number;
      ottBenefits: string[];
    }>
  >([]);

  const compatiblePlans = useMemo(() => {
    const validValidity = new Set<string>(VALIDITIES);
    const filtered = providerPlans.filter((p) => validValidity.has(String(p.validityDays)) && mapDataPerDayToEnum(p.dataPerDayGB) !== null);
    return dedupePlans(filtered);
  }, [providerPlans]);

  const planOptions = useMemo(
    () =>
      compatiblePlans.map((p) => ({
        value: p.planId,
        label: `${p.planId} - Rs.${p.price} / ${p.validityDays}d / ${p.dataPerDayGB}GB-day`,
      })),
    [compatiblePlans]
  );

  const validityOptions = useMemo(() => {
    const fromPlans = [...new Set(compatiblePlans.map((p) => String(p.validityDays)))].sort((a, b) => Number(a) - Number(b));
    return fromPlans.length ? fromPlans : [...VALIDITIES];
  }, [compatiblePlans]);

  const dataPerDayOptions = useMemo(() => {
    const fromPlans = [
      ...new Set(
        compatiblePlans
          .map((p) => mapDataPerDayToEnum(p.dataPerDayGB))
          .filter((v): v is (typeof DATA_PER_DAY)[number] => Boolean(v))
      ),
    ];
    const order = new Map(DATA_PER_DAY.map((v, i) => [v, i]));
    fromPlans.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    return fromPlans.length ? fromPlans : [...DATA_PER_DAY];
  }, [compatiblePlans]);

  const confidence = useMemo(() => {
    let score = 35;
    if (name.trim().length >= 2) score += 15;
    if (selectedPlanId) score += 15;
    if (actualUsagePerDay !== "No data") score += 10;
    if (Number(networkConfidence) >= 1 && Number(networkConfidence) <= 5) score += 10;
    if (dataRolloverRiskWindow !== "1-3") score += 5;
    if (hotspotNeeded) score += 5;
    if (callQualitySensitivity !== "medium") score += 5;
    if (billShockTolerance === "no") score += 5;
    if (loadingPlans) score = Math.max(30, score - 10);
    const level = score >= 75 ? "High" : score >= 55 ? "Medium" : "Low";
    return { score: Math.min(100, score), level };
  }, [
    name,
    selectedPlanId,
    actualUsagePerDay,
    networkConfidence,
    dataRolloverRiskWindow,
    hotspotNeeded,
    callQualitySensitivity,
    billShockTolerance,
    loadingPlans,
  ]);
  const confidenceTone =
    confidence.level === "High"
      ? {
          container: "border-emerald-200 bg-emerald-50/70",
          badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
          bar: "bg-emerald-500",
          sub: "text-emerald-800",
        }
      : confidence.level === "Medium"
        ? {
            container: "border-amber-200 bg-amber-50/70",
            badge: "bg-amber-100 text-amber-900 border-amber-200",
            bar: "bg-amber-500",
            sub: "text-amber-800",
          }
        : {
            container: "border-rose-200 bg-rose-50/70",
            badge: "bg-rose-100 text-rose-900 border-rose-200",
            bar: "bg-rose-500",
            sub: "text-rose-800",
          };

  useEffect(() => {
    const controller = new AbortController();
    const loadPlans = async () => {
      setLoadingPlans(true);
      setPlanLoadError(null);
      try {
        const res = await fetch(`/api/v1/telecom/plans?provider=${encodeURIComponent(provider)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load plans (${res.status})`);
        const body = (await res.json()) as {
          plans?: Array<{
            planId: string;
            price: number;
            validityDays: number;
            dataPerDayGB: number;
            totalDataGB: number;
            ottBenefits?: string[];
          }>;
          data?: {
            plans?: Array<{
              planId: string;
              price: number;
              validityDays: number;
              dataPerDayGB: number;
              totalDataGB: number;
              ottBenefits?: string[];
            }>;
          };
        };
        const plans = (body.plans ?? body.data?.plans ?? []).map((p) => ({
          planId: p.planId,
          price: Number(p.price) || 0,
          validityDays: Number(p.validityDays) || 0,
          dataPerDayGB: Number(p.dataPerDayGB) || 0,
          totalDataGB: Number(p.totalDataGB) || 0,
          ottBenefits: p.ottBenefits ?? [],
        }));
        setProviderPlans(plans);
      } catch (e) {
        if (controller.signal.aborted) return;
        setProviderPlans([]);
        setPlanLoadError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        if (!controller.signal.aborted) setLoadingPlans(false);
      }
    };
    void loadPlans();
    return () => controller.abort();
  }, [provider]);

  const applyPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = compatiblePlans.find((p) => p.planId === planId);
    if (!plan) return;
    const mappedData = mapDataPerDayToEnum(plan.dataPerDayGB);
    if (!mappedData) return;
    setCurrentPlanPrice(plan.price);
    setValidity(String(plan.validityDays) as (typeof VALIDITIES)[number]);
    setPlanDataPerDay(mappedData);
    if (plan.ottBenefits.length > 0) setNeedsOtt(true);
  };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      provider,
      currentPlanPrice,
      validity,
      planDataPerDay,
      actualUsagePerDay,
      lineUsageType,
      rechargeIntent,
      priority,
      callingNeed,
      needsOtt,
      networkConfidence,
      rechargeFrictionPreference,
      dataRolloverRiskWindow,
      hotspotNeeded,
      callQualitySensitivity,
      billShockTolerance,
    });
    setName("");
    setSelectedPlanId("");
  };

  const applyPreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setRechargeIntent(p.values.rechargeIntent);
    setLineUsageType(p.values.lineUsageType);
    setActualUsagePerDay(p.values.actualUsagePerDay);
    setCallingNeed(p.values.callingNeed);
    setNeedsOtt(p.values.needsOtt);
    setPriority(p.values.priority);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">
        Add each person with their own SIM / line. Intent fields are mandatory so recommendations match calls/data reality.
      </p>
      <div className={`rounded-xl border px-3 py-2 ${confidenceTone.container}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-900">Recommendation confidence</p>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${confidenceTone.badge}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {confidence.level} ({confidence.score}/100)
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out motion-reduce:transition-none ${confidenceTone.bar}`}
            style={{ width: `${confidence.score}%` }}
          />
        </div>
        <p className={`mt-1 text-[11px] ${confidenceTone.sub}`}>
          Higher confidence comes from plan match + realistic usage + optional advanced tuning.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2">
        <Label className="text-xs">Quick profile preset</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button key={p.id} type="button" size="sm" variant="outline" onClick={() => applyPreset(p.id)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Father" />
        </div>
        <div>
          <Label>Provider</Label>
          <Select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as (typeof PROVIDERS)[number]);
              setSelectedPlanId("");
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <Label>Current plan (from catalog)</Label>
          <PlanSearchDropdown
            value={selectedPlanId}
            onChange={applyPlan}
            options={planOptions}
            disabled={loadingPlans || planOptions.length === 0}
            placeholder="Select current plan"
            loadingLabel="Loading plans..."
            emptyLabel="No matching plans"
          />
          <p className="mt-1 text-xs text-slate-500">
            Using {provider} catalog plans from DB ({compatiblePlans.length} unique plans from {providerPlans.length} records).
          </p>
          {planLoadError ? <p className="mt-1 text-xs text-amber-700">{planLoadError}</p> : null}
        </div>
        <div>
          <Label>Recharge (₹)</Label>
          <Input type="number" min={1} value={currentPlanPrice} onChange={(e) => setCurrentPlanPrice(Number(e.target.value))} />
        </div>
        <div>
          <Label>Validity</Label>
          <Select value={validity} onChange={(e) => setValidity(e.target.value as (typeof VALIDITIES)[number])}>
            {validityOptions.map((v) => (
              <option key={v} value={v}>
                {v} days
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Plan data / day</Label>
          <Select value={planDataPerDay} onChange={(e) => setPlanDataPerDay(e.target.value as (typeof DATA_PER_DAY)[number])}>
            {dataPerDayOptions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Actual usage / day</Label>
          <Select
            value={actualUsagePerDay}
            onChange={(e) => setActualUsagePerDay(e.target.value as (typeof ACTUAL_USAGE_PER_DAY)[number])}
          >
            {ACTUAL_USAGE_PER_DAY.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Line profile</Label>
          <Select
            value={lineUsageType}
            onChange={(e) => setLineUsageType(e.target.value as (typeof MEMBER_LINE_USAGE)[number])}
          >
            <option value="calls-only">Calls only</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
          </Select>
        </div>
        <div>
          <Label>Recharge intent *</Label>
          <Select value={rechargeIntent} onChange={(e) => setRechargeIntent(e.target.value as (typeof MEMBER_RECHARGE_INTENTS)[number])}>
            <option value="calls-only">Calls only</option>
            <option value="data-only">Data only</option>
            <option value="both-balanced">Both (balanced)</option>
            <option value="streaming-heavy">Streaming heavy</option>
            <option value="senior-basic">Senior basic</option>
            <option value="work-business">Work/business</option>
          </Select>
        </div>
        <div>
          <Label>Calling need *</Label>
          <Select value={callingNeed} onChange={(e) => setCallingNeed(e.target.value as (typeof CALLING_NEEDS)[number])}>
            <option value="rare">Rare</option>
            <option value="regular">Regular</option>
            <option value="high">High</option>
            <option value="unlimited-needed">Unlimited needed</option>
          </Select>
        </div>
        <div>
          <Label>Priority *</Label>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as (typeof MEMBER_PRIORITIES)[number])}>
            <option value="lowest-cost">Lowest cost</option>
            <option value="best-network">Best network</option>
            <option value="balanced">Balanced</option>
          </Select>
        </div>
        <div className="flex items-end gap-2 text-sm sm:col-span-2 lg:col-span-1">
          <input id="needs-ott" type="checkbox" checked={needsOtt} onChange={(e) => setNeedsOtt(e.target.checked)} />
          <Label htmlFor="needs-ott">Needs OTT benefits</Label>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Advanced tuning</p>
                <p className="text-xs text-slate-500">Optional inputs to improve plan-fit confidence and stability.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="min-w-44" onClick={() => setShowAdvancedTuning((v) => !v)}>
                {showAdvancedTuning ? "Hide options" : "Show options"}
              </Button>
            </div>
            {showAdvancedTuning ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <Label>Local network confidence</Label>
                  <Select value={String(networkConfidence)} onChange={(e) => setNetworkConfidence(Number(e.target.value) || 3)}>
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
                    value={rechargeFrictionPreference}
                    onChange={(e) => setRechargeFrictionPreference(e.target.value as (typeof RECHARGE_FRICTION_PREFERENCES)[number])}
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
                    value={dataRolloverRiskWindow}
                    onChange={(e) => setDataRolloverRiskWindow(e.target.value as (typeof DATA_ROLLOVER_RISK_WINDOWS)[number])}
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
                    value={callQualitySensitivity}
                    onChange={(e) => setCallQualitySensitivity(e.target.value as (typeof CALL_QUALITY_SENSITIVITY)[number])}
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
                  <Select value={billShockTolerance} onChange={(e) => setBillShockTolerance(e.target.value as (typeof BILL_SHOCK_TOLERANCE)[number])}>
                    {BILL_SHOCK_TOLERANCE.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end">
                  <label htmlFor="hotspot-needed" className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <input id="hotspot-needed" type="checkbox" checked={hotspotNeeded} onChange={(e) => setHotspotNeeded(e.target.checked)} />
                    Uses hotspot/tethering
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button type="button" className="w-full" onClick={submit}>
            Add member
          </Button>
        </div>
      </div>
    </div>
  );
}
