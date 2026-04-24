"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Tailwind `h-72` (18rem) — explicit px avoids ResponsiveContainer measuring 0/-1 in grid/flex. */
const CHART_PX = 288;

export function Charts({ currentCost, optimizedCost, wifiCost, plansCost, subsCost }: { currentCost: number; optimizedCost: number; wifiCost: number; plansCost: number; subsCost: number }) {
  const pieData = [
    { name: "Mobile Plans", value: plansCost },
    { name: "WiFi", value: wifiCost },
    { name: "Subscriptions", value: subsCost },
  ];

  const barData = [
    { label: "Current", amount: currentCost },
    { label: "Optimized", amount: optimizedCost },
  ];

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[288px] min-w-0 pt-0">
          <div className="h-[288px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={CHART_PX}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={["#4f46e5", "#22c55e", "#0ea5e9"][idx % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Current vs Optimized</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[288px] min-w-0 pt-0">
          <div className="h-[288px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={CHART_PX}>
              <BarChart data={barData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" radius={10} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
