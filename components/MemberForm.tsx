"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ACTUAL_USAGE_PER_DAY,
  CALLING_NEEDS,
  DATA_PER_DAY,
  MEMBER_LINE_USAGE,
  MEMBER_PRIORITIES,
  MEMBER_RECHARGE_INTENTS,
  PROVIDERS,
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

export function MemberForm({ onAdd }: { onAdd: (member: MemberMobileLine) => void }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("Jio");
  const [currentPlanPrice, setCurrentPlanPrice] = useState(299);
  const [validity, setValidity] = useState<(typeof VALIDITIES)[number]>("28");
  const [planDataPerDay, setPlanDataPerDay] = useState<(typeof DATA_PER_DAY)[number]>("2GB");
  const [actualUsagePerDay, setActualUsagePerDay] = useState<(typeof ACTUAL_USAGE_PER_DAY)[number]>("1GB");
  const [lineUsageType, setLineUsageType] = useState<(typeof MEMBER_LINE_USAGE)[number]>("medium");
  const [rechargeIntent, setRechargeIntent] = useState<(typeof MEMBER_RECHARGE_INTENTS)[number]>("both-balanced");
  const [priority, setPriority] = useState<(typeof MEMBER_PRIORITIES)[number]>("balanced");
  const [callingNeed, setCallingNeed] = useState<(typeof CALLING_NEEDS)[number]>("regular");
  const [needsOtt, setNeedsOtt] = useState(false);

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
    });
    setName("");
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
          <Select value={provider} onChange={(e) => setProvider(e.target.value as (typeof PROVIDERS)[number])}>
            {PROVIDERS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Recharge (₹)</Label>
          <Input type="number" min={1} value={currentPlanPrice} onChange={(e) => setCurrentPlanPrice(Number(e.target.value))} />
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
          <Label>Plan data / day</Label>
          <Select value={planDataPerDay} onChange={(e) => setPlanDataPerDay(e.target.value as (typeof DATA_PER_DAY)[number])}>
            {DATA_PER_DAY.map((d) => (
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
        <div className="flex items-end gap-2 text-sm">
          <input id="needs-ott" type="checkbox" checked={needsOtt} onChange={(e) => setNeedsOtt(e.target.checked)} />
          <Label htmlFor="needs-ott">Needs OTT benefits</Label>
        </div>
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={submit}>
            Add member
          </Button>
        </div>
      </div>
    </div>
  );
}
