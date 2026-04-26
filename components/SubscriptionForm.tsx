"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SUBSCRIPTION_BILLING_CYCLES } from "@/utils/constants";

export function SubscriptionForm({
  onAdd,
}: {
  onAdd: (sub: { name: string; cost: number; billingCycle: (typeof SUBSCRIPTION_BILLING_CYCLES)[number]; used: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState(199);
  const [billingCycle, setBillingCycle] = useState<(typeof SUBSCRIPTION_BILLING_CYCLES)[number]>("monthly");
  const [used, setUsed] = useState(true);

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <div className="md:col-span-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, YouTube Premium" /></div>
      <div>
        <Label>Cost</Label>
        <Input
          type="number"
          min={1}
          value={cost}
          onChange={(e) => {
            const n = Number(e.target.value);
            setCost(Number.isFinite(n) && n > 0 ? n : 1);
          }}
        />
      </div>
      <div>
        <Label>Billing</Label>
        <Select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as (typeof SUBSCRIPTION_BILLING_CYCLES)[number])}>
          {SUBSCRIPTION_BILLING_CYCLES.map((cycle) => (
            <option key={cycle} value={cycle}>
              {cycle}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2 text-sm md:col-span-1">
        <input type="checkbox" checked={used} onChange={(e) => setUsed(e.target.checked)} /> Actively used
      </div>
      <div className="self-end md:col-span-1">
        <Button
          className="w-full"
          onClick={() => {
            if (!name || cost <= 0) return;
            onAdd({ name, cost, billingCycle, used });
            setName("");
          }}
        >
          Add Subscription
        </Button>
      </div>
    </div>
  );
}
