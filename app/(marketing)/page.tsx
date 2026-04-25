"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  IndianRupee,
  LineChart,
  Lock,
  MapPinned,
  Quote,
  Radar,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
  { label: "Average monthly savings", value: "₹800", sub: "per household", icon: WalletCards, tone: "from-indigo-500 to-blue-600" },
  { label: "Plans analyzed", value: "20k+", sub: "across Indian cities", icon: LineChart, tone: "from-violet-500 to-indigo-600" },
  { label: "Networks covered", value: "4", sub: "Jio · Airtel · VI · BSNL", icon: Radar, tone: "from-cyan-500 to-blue-500" },
  { label: "Decision confidence", value: "98%", sub: "fit-scoring accuracy", icon: Gauge, tone: "from-emerald-500 to-green-600" },
] as const;

const features = [
  {
    title: "India-first network intelligence",
    desc: "City-sensitive scoring ensures recommendations fit Bangalore, Chennai, Mumbai, and beyond.",
    icon: MapPinned,
  },
  {
    title: "Usage-first optimization",
    desc: "Compares allowance vs real usage and flags hidden waste before next recharge.",
    icon: CircleDollarSign,
  },
  {
    title: "Per-member decision cards",
    desc: "Clear keep/switch verdicts, confidence score, and precise savings for every family line.",
    icon: Users,
  },
  {
    title: "Private by default",
    desc: "Secure-by-design flow with transparent logic so users trust recommendations.",
    icon: Lock,
  },
] as const;

const steps = [
  { title: "Add your plans", desc: "Enter each member’s recharge, usage, and intent.", icon: Users },
  { title: "We analyze usage", desc: "BudgetBoy evaluates cost, fit, and overpay risk.", icon: Zap },
  { title: "Get optimized savings", desc: "Receive clear switch/keep actions instantly.", icon: CheckCircle2 },
] as const;

const testimonials = [
  { name: "Nithya R.", city: "Chennai", quote: "We cut ₹1,100 every month across 4 lines with zero guesswork." },
  { name: "Rahul V.", city: "Bangalore", quote: "The per-member recommendations are more useful than any generic recharge list." },
  { name: "Aisha K.", city: "Hyderabad", quote: "Looks premium, gives confidence, and saves real money every cycle." },
] as const;

export default function MarketingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 px-4 pb-20 pt-12 md:pb-28 md:pt-16">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-8 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.15 }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
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
              Stop overpaying on
              <span className="bg-gradient-to-r from-teal-200 via-white to-emerald-200 bg-clip-text text-transparent">
                {" "}every recharge.
              </span>{" "}
              Optimize plans with clarity.
            </motion.h1>
            <motion.p variants={item} className="mt-6 max-w-2xl text-base leading-relaxed text-teal-50/95 md:text-lg">
              BudgetBoy analyzes each member&apos;s usage, network quality, and recharge fit to give transparent, rupee-level decisions you can trust.
            </motion.p>
            <motion.div variants={item} className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/wizard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 ring-0 hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/30"
                )}
              >
                Start saving now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                View dashboard
              </Link>
            </motion.div>
            <motion.p variants={item} className="mt-6 text-sm text-teal-100/90">
              Used by 1000+ users across India
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5, ease: "easeInOut" }}
              className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-xl"
            >
              <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Savings Preview</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Live</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Current spend</p>
                    <p className="text-2xl font-semibold">₹3,000</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Optimized spend</p>
                    <p className="text-2xl font-semibold text-emerald-900">₹2,200</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-slate-900 p-3 text-white">
                  <p className="text-xs text-slate-300">Estimated monthly savings</p>
                  <p className="text-2xl font-semibold">₹800</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {kpis.map((k) => (
              <motion.div key={k.label} variants={item}>
                <div className="rounded-2xl border border-white/20 bg-slate-900/35 p-5 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div
                    className={cn(
                      "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ring-1 ring-white/30",
                      k.tone
                    )}
                  >
                    <k.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">{k.value}</p>
                  <p className="mt-1 text-xs text-white/80">{k.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative bg-[#f8fafc] px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">How BudgetBoy works</h2>
            <p className="mt-3 text-gray-600">
              Built for fast, clear decisions — from data entry to final savings action.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-900/20">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
              <CardTitle className="mb-4 text-xl font-semibold text-gray-900">Before vs After</CardTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <TrendingUp className="h-5 w-5" />
                    Before
                  </span>
                  <span className="text-lg font-semibold text-red-600">₹3000/month</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <TrendingDown className="h-5 w-5" />
                    After
                  </span>
                  <span className="text-lg font-semibold text-green-600">₹2200/month</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 p-4 text-white shadow-md">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <IndianRupee className="h-5 w-5" />
                    Savings
                  </span>
                  <span className="text-xl font-bold">₹800/month</span>
                </div>
              </div>
            </Card>
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
              <CardTitle className="mb-4 text-xl font-semibold text-gray-900">Trusted by users across India</CardTitle>
              <div className="space-y-3">
                {testimonials.map((t) => (
                  <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg">
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-gray-800">
                      <Quote className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                      {t.quote}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      {t.name} · {t.city}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-12 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-6 md:p-8">
            <div className="mb-4 flex items-center gap-2 text-white">
              <BadgeCheck className="h-5 w-5" />
              <p className="text-sm font-semibold">Feature highlights</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-900/20">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/80">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mt-14 flex flex-col items-center justify-center gap-4 rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/90 p-8 text-center shadow-inner md:flex-row md:justify-between md:text-left"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-800">Start saving today</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">Takes less than 2 minutes to generate your first savings plan.</p>
            </div>
            <Link
              href="/wizard"
              className={cn(buttonVariants({ size: "lg" }), "shrink-0 gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 ring-0")}
            >
              Launch wizard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          BudgetBoy · Smart telecom & subscription optimization for Indian households.
        </p>
      </footer>
    </>
  );
}
