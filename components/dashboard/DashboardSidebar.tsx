"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, PanelLeftClose, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, section: "Your dashboard" },
  { href: "/wizard", label: "Setup wizard", icon: Wand2, section: "Your dashboard" },
  { href: "/docs", label: "API docs (v1)", icon: BookOpen, section: "More" },
  { href: "/", label: "Marketing home", icon: Sparkles, section: "More" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 flex w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white shadow-sm">
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
                            ? "bg-emerald-50 text-emerald-900 before:absolute before:left-0 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-emerald-500"
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
      </nav>
      <div className="border-t border-slate-100 p-4">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <PanelLeftClose className="h-3.5 w-3.5" />
          Tip: rerun the wizard after every recharge cycle.
        </p>
      </div>
    </aside>
  );
}
