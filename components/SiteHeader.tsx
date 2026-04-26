"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Mail, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon?: LucideIcon }[] = [
  { href: "/", label: "Home" },
  { href: "/wizard", label: "Wizard", icon: Wand2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contact", label: "Contact", icon: Mail },
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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4 md:h-16">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight text-white">
          <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-lg shadow-teal-900/25 ring-1 ring-white/25">
            <Image src="/budget.png" alt="BudgetBoy" width={36} height={36} className="object-contain p-0.5" priority />
          </span>
          <span className="text-sm md:text-base">
            Budget<span className="text-teal-200">Boy</span>
          </span>
        </Link>
        <nav className="hidden max-w-[62vw] items-center gap-1 overflow-x-auto md:flex md:max-w-none md:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-2.5 sm:text-xs md:px-3 md:text-sm",
                  active
                    ? "bg-white/15 text-white shadow-inner ring-1 ring-white/20"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                {Icon ? <Icon className="h-3.5 w-3.5 opacity-90" /> : null}
                <span className="max-[390px]:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href={pathname.startsWith("/wizard") ? "/dashboard" : "/wizard"}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15"
          >
            {pathname.startsWith("/wizard") ? "Dashboard" : "Wizard"}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
