"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <motion.div
            key={step}
            initial={false}
            animate={{
              scale: active ? 1.02 : 1,
              transition: { type: "spring", stiffness: 400, damping: 28 },
            }}
            className={cn(
              "relative overflow-hidden rounded-xl border px-2.5 py-2 text-center text-[11px] font-semibold leading-tight shadow-sm transition-colors sm:text-xs",
              done && "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-900",
              active && "border-teal-400/60 bg-white text-teal-900 ring-2 ring-teal-400/40",
              !done && !active && "border-slate-200/90 bg-white/60 text-slate-500 backdrop-blur-sm"
            )}
          >
            {active ? (
              <motion.span
                layoutId="stepGlow"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-400/15 to-transparent"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            ) : null}
            <span className="relative z-[1] block">
              <span className="mr-0.5 opacity-70">{i + 1}.</span>
              {step}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
