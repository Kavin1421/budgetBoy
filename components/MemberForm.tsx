"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ACTUAL_USAGE_PER_DAY,
  DATA_PER_DAY,
  MEMBER_LINE_USAGE,
  PROVIDERS,
  VALIDITIES,
} from "@/utils/constants";
import type { MemberMobileLine } from "@/utils/validators";

export function MemberForm({ onAdd }: { onAdd: (member: MemberMobileLine) => void }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("Jio");
  const [currentPlanPrice, setCurrentPlanPrice] = useState(299);
  const [validity, setValidity] = useState<(typeof VALIDITIES)[number]>("28");
  const [planDataPerDay, setPlanDataPerDay] = useState<(typeof DATA_PER_DAY)[number]>("2GB");
  const [actualUsagePerDay, setActualUsagePerDay] = useState<(typeof ACTUAL_USAGE_PER_DAY)[number]>("1GB");
  const [lineUsageType, setLineUsageType] = useState<(typeof MEMBER_LINE_USAGE)[number]>("medium");

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
    });
    setName("");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">Add each person with their own SIM / line. Actual usage must not exceed the plan allowance.</p>
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
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={submit}>
            Add member
          </Button>
        </div>
      </div>
    </div>
  );
}
