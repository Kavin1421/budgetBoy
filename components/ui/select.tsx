import type React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-10 w-full rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-sm shadow-sm outline-none ring-teal-400/15 transition focus:border-teal-500 focus:ring-4", className)}
      {...props}
    />
  );
}
