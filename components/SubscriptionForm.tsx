"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SubscriptionForm({ onAdd }: { onAdd: (sub: { name: string; cost: number; used: boolean }) => void }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState(199);
  const [used, setUsed] = useState(true);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, YouTube Premium" /></div>
      <div>
        <Label>Monthly Cost</Label>
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
      <div className="flex items-end gap-2 text-sm"><input type="checkbox" checked={used} onChange={(e) => setUsed(e.target.checked)} /> Actively used</div>
      <div className="self-end"><Button className="w-full" onClick={() => { if (!name || cost <= 0) return; onAdd({ name, cost, used }); setName(""); }}>Add Subscription</Button></div>
    </div>
  );
}
