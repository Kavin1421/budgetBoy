"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WizardRail({
  steps,
  currentStep,
  onSelect,
}: {
  steps: readonly string[];
  currentStep: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <nav aria-label="Wizard steps" className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0 lg:pr-2">
      {steps.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <button
            key={label}
            type="button"
            disabled={i > currentStep}
            onClick={() => {
              if (i <= currentStep) onSelect?.(i);
            }}
            className={cn(
              "group relative flex min-w-[96px] shrink-0 items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors lg:min-w-0 lg:gap-3 lg:px-3 lg:py-3",
              active && "bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-100",
              done && !active && "text-slate-600 hover:bg-slate-50",
              !done && !active && "text-slate-400"
            )}
          >
            {active ? (
              <motion.span
                layoutId="wizardRailIndicator"
                className="absolute left-0 top-1/2 hidden h-8 w-1 -translate-y-1/2 rounded-full bg-emerald-500 lg:block"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done && "bg-emerald-500 text-white shadow-sm",
                active && "bg-white text-emerald-700 ring-2 ring-emerald-200",
                !done && !active && "border border-slate-200 bg-white text-slate-400"
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:text-[11px]">Step {i + 1}</span>
              <span className="truncate text-[11px] font-semibold leading-snug lg:text-sm">{label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
