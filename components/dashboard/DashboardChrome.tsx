"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Budget overview" },
  { href: "/wizard", label: "Create & adjust" },
] as const;

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dash-surface relative flex min-h-screen min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/85 px-4 py-3 backdrop-blur-md lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-1 border-b border-transparent sm:border-0">
            {tabs.map((t) => {
              const active = t.href === "/dashboard" ? pathname.startsWith("/dashboard") : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Home
            </Link>
            <Link href="/wizard" className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 shadow-emerald-900/15")}>
              Today&apos;s setup
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="relative flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
