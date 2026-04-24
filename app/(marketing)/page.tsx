"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  IndianRupee,
  Radar,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const kpis = [
  { label: "Typical savings", value: "₹200–2k", sub: "Per household / month", icon: IndianRupee, tone: "from-emerald-400 to-teal-600" },
  { label: "Operators", value: "4", sub: "Jio · Airtel · VI · BSNL", icon: Building2, tone: "from-amber-400 to-orange-500" },
  { label: "Optimization", value: "Per member", sub: "Usage + city + catalog", icon: Users, tone: "from-violet-400 to-indigo-600" },
  { label: "Signals", value: "Rules + AI", sub: "Transparent reasoning", icon: Radar, tone: "from-rose-400 to-red-500" },
] as const;

const features = [
  {
    title: "Metro-aware scoring",
    desc: "Bangalore, Chennai, Mumbai & more — network quality shapes every recommendation.",
    icon: Sparkles,
  },
  {
    title: "Real usage, real math",
    desc: "Bill allowance vs actual GB/day catches overpay before you renew again.",
    icon: Zap,
  },
  {
    title: "Advisor-grade dashboard",
    desc: "Glass KPIs, charts, and per-line actions — built to feel like serious finance software.",
    icon: BarChart3,
  },
  {
    title: "Privacy-minded",
    desc: "Your inputs stay yours; optional OpenAI only when you configure a key.",
    icon: Shield,
  },
] as const;

export default function MarketingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-28 pt-10 md:pb-36 md:pt-16">
        <motion.div
          aria-hidden
          className="bb-orb pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        <motion.div
          aria-hidden
          className="bb-orb bb-orb-delay pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.15 }}
        />

        <div className="relative mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-3xl">
            <motion.p
              variants={item}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-100 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-200" />
              India-first telecom optimizer
            </motion.p>
            <motion.h1
              variants={item}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-sm md:text-6xl md:leading-[1.05]"
            >
              Cut bill shock with a{" "}
              <span className="bg-gradient-to-r from-teal-200 via-white to-emerald-200 bg-clip-text text-transparent">
                finance-grade
              </span>{" "}
              savings cockpit.
            </motion.h1>
            <motion.p variants={item} className="mt-6 max-w-2xl text-base leading-relaxed text-teal-50/95 md:text-lg">
              BudgetBoy models each SIM, your city&apos;s network reality, and live catalog plans — then surfaces rupee-level savings
              you can act on. Built for families, friends, and individuals across India.
            </motion.p>
            <motion.div variants={item} className="mt-10 flex flex-wrap gap-3">
              <Link href="/wizard" className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 shadow-teal-950/40")}>
                Start optimization
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                View dashboard
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {kpis.map((k) => (
              <motion.div key={k.label} variants={item}>
                <div className="bb-glass-strong rounded-2xl p-5 ring-1 ring-white/40">
                  <div
                    className={cn(
                      "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ring-1 ring-white/30",
                      k.tone
                    )}
                  >
                    <k.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{k.value}</p>
                  <p className="mt-1 text-xs text-slate-600">{k.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative -mt-16 rounded-t-[2rem] border border-white/50 bg-gradient-to-b from-white/95 to-slate-50/98 px-4 py-16 shadow-[0_-12px_48px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:rounded-t-[2.5rem] md:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Everything you need to negotiate your stack</h2>
            <p className="mt-3 text-slate-600">
              A guided wizard, Mongo-backed catalog sync, and a dashboard that reads like a CFO briefing — without the spreadsheet pain.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full border-slate-200/80 bg-white/90 transition-shadow hover:shadow-xl">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-900/20">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mt-14 flex flex-col items-center justify-center gap-4 rounded-2xl border border-teal-200/60 bg-gradient-to-r from-teal-50/90 via-white to-emerald-50/90 p-8 text-center shadow-inner md:flex-row md:justify-between md:text-left"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Ready in minutes</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Run the wizard — we&apos;ll open your dashboard with the full story.</p>
            </div>
            <Link href="/wizard" className={cn(buttonVariants({ variant: "default", size: "lg" }), "shrink-0 gap-2")}>
              Launch wizard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/20 py-8 text-center text-xs text-white/60 backdrop-blur-md">
        <p>BudgetBoy · Smart telecom & subscription optimization for Indian households.</p>
      </footer>
    </>
  );
}
