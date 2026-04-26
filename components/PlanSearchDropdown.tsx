"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type PlanSearchOption = {
  value: string;
  label: string;
};

function scoreOption(option: PlanSearchOption, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const value = option.value.toLowerCase();
  const label = option.label.toLowerCase();
  const compactQ = q.replace(/\s+/g, "");

  // Strong: exact plan id / exact token match
  if (value === q || value === compactQ) return 1000;
  if (label === q) return 950;

  const priceNeedle = q.startsWith("₹") ? q.slice(1) : q;
  const priceToken = `rs.${priceNeedle}`;
  if (/^\d+$/.test(priceNeedle) && label.includes(priceToken)) return 900;

  // Prefix matches
  if (value.startsWith(q) || value.startsWith(compactQ)) return 800;
  if (label.startsWith(q)) return 760;

  // Contains matches
  if (value.includes(q) || value.includes(compactQ)) return 650;
  if (label.includes(q)) return 600;

  return -1;
}

export function PlanSearchDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  loadingLabel,
  emptyLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PlanSearchOption[];
  placeholder: string;
  disabled?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options
      .map((o, i) => ({ option: o, i, score: scoreOption(o, q) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((x) => x.option);
  }, [options, query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-sm text-left shadow-sm transition hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => {
          if (disabled) return;
          setOpen((s) => {
            const next = !s;
            if (!next) setQuery("");
            return next;
          });
        }}
        disabled={disabled}
      >
        <span className="truncate text-slate-700">
          {selected?.label ?? (disabled ? loadingLabel ?? "Loading..." : placeholder)}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plans..." className="pl-8" />
          </div>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">{emptyLabel ?? "No plans found"}</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 last:border-b-0 hover:bg-slate-50"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

