"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon?: LucideIcon }[] = [
  { href: "/", label: "Home" },
  { href: "/wizard", label: "Wizard", icon: Wand2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // { href: "/docs", label: "API v1", icon: BookOpen },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/25 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight text-white">
          <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-lg shadow-teal-900/25 ring-1 ring-white/25">
            <Image src="/budget.png" alt="BudgetBoy" width={36} height={36} className="object-contain p-0.5" priority />
          </span>
          <span className="text-sm md:text-base">
            Budget<span className="text-teal-200">Boy</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition md:text-sm",
                  active
                    ? "bg-white/15 text-white shadow-inner ring-1 ring-white/20"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                {Icon ? <Icon className="h-3.5 w-3.5 opacity-90" /> : null}
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
