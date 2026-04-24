"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DATA_PER_DAY, MEMBER_LINE_USAGE, PROVIDERS, VALIDITIES } from "@/utils/constants";
import type { CatalogTelecomPlan } from "@/lib/telecomTypes";
import { monthlyEquivalent } from "@/lib/telecomPlanQuery";

type WizardPlan = {
  provider: (typeof PROVIDERS)[number];
  planId?: string;
  cost: number;
  validity: (typeof VALIDITIES)[number];
  dataPerDay: (typeof DATA_PER_DAY)[number];
  usageType: (typeof MEMBER_LINE_USAGE)[number];
};

function catalogToDataPerDay(gb: number): (typeof DATA_PER_DAY)[number] {
  const ordered: (typeof DATA_PER_DAY)[number][] = ["1GB", "1.5GB", "2GB", "3GB"];
  let best = ordered[0];
  let bestDiff = Infinity;
  for (const o of ordered) {
    const v = o === "1GB" ? 1 : o === "1.5GB" ? 1.5 : o === "2GB" ? 2 : 3;
    const d = Math.abs(v - gb);
    if (d < bestDiff) {
      bestDiff = d;
      best = o;
    }
  }
  return best;
}

function closestValidity(days: number): (typeof VALIDITIES)[number] {
  const nums = VALIDITIES.map(Number);
  let best: (typeof VALIDITIES)[number] = VALIDITIES[0];
  let diff = Infinity;
  for (let i = 0; i < nums.length; i++) {
    const d = Math.abs(nums[i] - days);
    if (d < diff) {
      diff = d;
      best = VALIDITIES[i] as (typeof VALIDITIES)[number];
    }
  }
  return best;
}

export function PlanForm({ onAdd }: { onAdd: (plan: WizardPlan) => void }) {
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("Jio");
  const [cost, setCost] = useState(299);
  const [validity, setValidity] = useState<(typeof VALIDITIES)[number]>("28");
  const [dataPerDay, setDataPerDay] = useState<(typeof DATA_PER_DAY)[number]>("2GB");
  const [usageType, setUsageType] = useState<(typeof MEMBER_LINE_USAGE)[number]>("medium");
  const [planId, setPlanId] = useState<string | undefined>(undefined);
  const [catalog, setCatalog] = useState<CatalogTelecomPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/telecom/plans?provider=${encodeURIComponent(provider)}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        setCatalog(body.plans ?? []);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  const applyCatalog = (p: CatalogTelecomPlan) => {
    setPlanId(p.planId);
    setCost(p.price);
    setValidity(closestValidity(p.validityDays));
    setDataPerDay(catalogToDataPerDay(p.dataPerDayGB));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-6">
        <div>
          <Label>Provider</Label>
          <Select
            value={provider}
            onChange={(e) => {
              setLoading(true);
              setProvider(e.target.value as (typeof PROVIDERS)[number]);
              setPlanId(undefined);
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Cost</Label>
          <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        </div>
        <div>
          <Label>Validity</Label>
          <Select value={validity} onChange={(e) => setValidity(e.target.value as (typeof VALIDITIES)[number])}>
            {VALIDITIES.map((v) => (
              <option key={v} value={v}>
                {v} days
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Data/Day</Label>
          <Select value={dataPerDay} onChange={(e) => setDataPerDay(e.target.value as (typeof DATA_PER_DAY)[number])}>
            {DATA_PER_DAY.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Usage</Label>
          <Select value={usageType} onChange={(e) => setUsageType(e.target.value as (typeof MEMBER_LINE_USAGE)[number])}>
            {MEMBER_LINE_USAGE.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </Select>
        </div>
        <div className="self-end">
          <Button
            className="w-full"
            onClick={() => {
              if (cost <= 0) return;
              onAdd({ provider, planId, cost, validity, dataPerDay, usageType });
            }}
          >
            Add Plan
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
        <Label>Suggested plans ({provider})</Label>
        {loading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : catalog.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No catalog entries. Run sync or check API config.</p>
        ) : (
          <Select
            className="mt-2"
            value={planId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const found = catalog.find((c) => c.planId === id);
              if (found) applyCatalog(found);
            }}
          >
            <option value="">Pick a catalog plan (optional)</option>
            {catalog.map((p) => (
              <option key={p.planId} value={p.planId}>
                {p.planId} — Rs.{p.price} / {p.validityDays}d — {p.dataPerDayGB}GB/day (~Rs.{Math.round(monthlyEquivalent(p))}/mo eq.)
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
}
