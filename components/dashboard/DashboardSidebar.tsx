"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, LayoutDashboard, PanelLeftClose, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useBudgetStore } from "@/store/useBudgetStore";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, section: "Your dashboard" },
  { href: "/wizard", label: "Setup wizard", icon: Wand2, section: "Your dashboard" },
  { href: "/dashboard#analytics", label: "Analytics", icon: BarChart3, section: "Your dashboard" },
  { href: "/docs", label: "API docs (v1)", icon: BookOpen, section: "More" },
  { href: "/", label: "Marketing home", icon: Sparkles, section: "More" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const { scenarios, activeScenarioId, setActiveScenario, deleteScenario } = useBudgetStore();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const askDeleteScenario = (id: string, name: string) => setPendingDelete({ id, name });

  const confirmDeleteScenario = () => {
    if (!pendingDelete) return;
    deleteScenario(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white shadow-sm md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <Image src="/budget.png" alt="BudgetBoy" width={36} height={36} className="rounded-lg object-contain" priority />
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">BudgetBoy</p>
          <p className="text-sm font-bold text-slate-900">My savings</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {(["Your dashboard", "More"] as const).map((section) => (
          <div key={section}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{section}</p>
            <ul className="space-y-0.5">
              {nav
                .filter((n) => n.section === section)
                .map((item) => {
                  const active = pathname === item.href || (item.href === "/dashboard" && pathname.startsWith("/dashboard"));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-indigo-50 text-indigo-900 before:absolute before:left-0 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-indigo-500"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400" suppressHydrationWarning>
            Scenarios
          </p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setActiveScenario(undefined)}
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  !activeScenarioId ? "bg-indigo-50 text-indigo-900" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                Live current inputs
              </button>
            </li>
            {scenarios.slice(0, 6).map((sc) => (
              <li key={sc.id}>
                <div
                  className={cn(
                    "group flex items-center gap-1 rounded-xl pr-1 transition-colors",
                    activeScenarioId === sc.id ? "bg-indigo-50 text-indigo-900" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveScenario(sc.id)}
                    className="min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-left text-sm"
                    title={sc.name}
                  >
                    {sc.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => askDeleteScenario(sc.id, sc.name)}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-700",
                      activeScenarioId === sc.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    aria-label={`Delete scenario ${sc.name}`}
                    title="Delete scenario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {scenarios.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400">No saved scenarios yet. Complete wizard to save one.</li>
            ) : null}
          </ul>
        </div>
      </nav>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete scenario?"
        description={pendingDelete ? `Delete ${pendingDelete.name}? This cannot be undone.` : ""}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteScenario}
      />
      <div className="border-t border-slate-100 p-4">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <PanelLeftClose className="h-3.5 w-3.5" />
          Tip: rerun the wizard after every recharge cycle.
        </p>
      </div>
    </aside>
  );
}
