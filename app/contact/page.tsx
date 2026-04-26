"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, MessageCircle, Phone, Rocket, ShieldCheck, Sparkles, Star, TimerReset, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const highlights = [
  { title: "Fast delivery", desc: "Clear milestones and dependable timelines.", icon: TimerReset },
  { title: "Modern UX polish", desc: "Premium interaction design with smooth motion.", icon: Wand2 },
  { title: "Performance-first build", desc: "Responsive pages optimized for real users.", icon: Rocket },
  { title: "Ongoing support", desc: "Post-launch fixes and growth improvements.", icon: ShieldCheck },
] as const;

const testimonials = [
  { name: "Arun S.", quote: "They turned our rough idea into a polished product in weeks." },
  { name: "Nivetha R.", quote: "High-quality UI, smooth flow, and clear technical communication." },
  { name: "Karthik M.", quote: "The final experience felt premium and conversion-focused." },
] as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length >= 2 && email.trim().length > 3 && message.trim().length >= 10 && !submitting;

  const submitInquiry = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const body = (await res.json()) as { message?: string; error?: { message?: string } };
      if (!res.ok) {
        const errMsg = body.error?.message ?? "Could not send inquiry.";
        toast.error(errMsg);
        return;
      }
      toast.success(body.message ?? "Inquiry sent successfully.");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error("Network error while sending inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-[#0b3d2e] via-[#0f5c45] to-[#0a2f3a] px-4 pb-20 pt-20 before:absolute before:inset-x-1/4 before:top-14 before:h-56 before:rounded-full before:bg-emerald-400/20 before:blur-3xl before:content-[''] md:pb-28 md:pt-24">
      <div aria-hidden className="pointer-events-none absolute -left-20 top-8 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-300/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 top-10 h-[27rem] w-[27rem] rounded-full bg-gradient-to-br from-cyan-300/20 to-blue-300/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-14 left-8 h-48 w-48 rounded-full bg-emerald-300/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-20 right-10 h-56 w-56 rounded-full bg-cyan-200/15 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <motion.div initial="hidden" animate="show" variants={stagger} className="mx-auto max-w-3xl text-center">
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Build with GodevsTeam
          </motion.p>
          <motion.h1 variants={item} className="mt-5 text-4xl font-bold tracking-tight text-white drop-shadow-[0_10px_36px_rgba(16,185,129,0.35)] md:text-6xl">
            Let&apos;s build something{" "}
            <span className="bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent">users actually love</span>
          </motion.h1>
          <motion.p variants={item} className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-teal-50/95 md:text-lg">
            We design and ship modern, conversion-focused digital experiences that make your product stand out from day one.
          </motion.p>
          <motion.p variants={item} className="mt-3 text-sm font-medium text-teal-100">
            Helping startups build fast, scalable, and beautiful products
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="mt-8"
        >
          <motion.p variants={item} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white">
            <Star className="h-3.5 w-3.5 text-amber-300" />
            Trusted by developers & startups
          </motion.p>
          <motion.p variants={item} className="mt-2 text-sm text-teal-100/90">
            Worked on real-world products with measurable impact
          </motion.p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={item}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className={cn(
                  "rounded-xl border border-white/10 bg-white/10 p-4 text-white/95 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                  i % 2 === 0 ? "rotate-[1deg]" : "-rotate-[1deg]"
                )}
              >
                <p className="text-sm leading-relaxed">“{t.quote}”</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal-100">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-2 top-10 hidden h-72 w-72 rounded-3xl border border-white/10 bg-gradient-to-br from-white/20 to-white/5 opacity-20 shadow-2xl backdrop-blur-xl lg:block"
          />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <motion.div variants={item} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="grid gap-4">
                <Card className="h-full rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-white">Reach out directly</CardTitle>
                    <p className="text-sm text-teal-100/85">Prefer quick communication? Contact us here</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <a
                      href="mailto:godevsteam@gmail.com"
                      className="group flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 text-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 p-2 text-white shadow-[0_0_18px_rgba(16,185,129,0.45)]">
                          <Mail className="h-5 w-5" />
                        </span>
                        <span>
                          <p className="text-xs uppercase tracking-wide text-white/70">Email</p>
                          <p className="font-semibold">godevsteam@gmail.com</p>
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
                    </a>

                    <a
                      href="https://wa.me/919677723429"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 text-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg bg-gradient-to-r from-cyan-400 to-teal-500 p-2 text-white shadow-[0_0_18px_rgba(6,182,212,0.45)]">
                          <MessageCircle className="h-5 w-5" />
                        </span>
                        <span>
                          <p className="text-xs uppercase tracking-wide text-white/70">WhatsApp</p>
                          <p className="font-semibold">+91 96777 23429</p>
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
                    </a>

                    <a
                      href="tel:+919677723429"
                      className="group flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 text-white transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg bg-gradient-to-r from-indigo-400 to-blue-500 p-2 text-white shadow-[0_0_18px_rgba(99,102,241,0.45)]">
                          <Phone className="h-5 w-5" />
                        </span>
                        <span>
                          <p className="text-xs uppercase tracking-wide text-white/70">Call</p>
                          <p className="font-semibold">+91 96777 23429</p>
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
                    </a>

                    <div className="grid gap-3 pt-2 sm:grid-cols-2">
                      {highlights.map((h, i) => (
                        <motion.div
                          key={h.title}
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.35 }}
                          className="rounded-xl border border-white/15 bg-gradient-to-br from-white/15 to-white/5 p-3 text-white/90 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <h.icon className="h-4 w-4 text-teal-200" />
                          <p className="mt-2 text-sm font-semibold">{h.title}</p>
                          <p className="mt-1 text-xs text-white/75">{h.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="ml-2 rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md lg:ml-8">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-teal-100/85">Quick turnaround</p>
                    <p className="mt-1 text-sm text-white/90">Most starter projects move from idea to launch-ready in 2-4 weeks.</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <motion.div variants={item} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="rounded-2xl border border-emerald-100 bg-white shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Tell us about your project</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-slate-700">Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vijay"
                      className="h-11 rounded-xl border border-slate-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 transition-all focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-slate-700">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-11 rounded-xl border border-slate-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 transition-all focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-slate-700">Message</Label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What do you want to build?"
                      className="w-full rounded-xl border border-slate-200 bg-gray-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={submitInquiry}
                    disabled={!canSubmit}
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                      canSubmit
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 hover:scale-105 hover:shadow-lg"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                    )}
                  >
                    {submitting ? "Sending..." : "Start your project →"}
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/25 bg-gradient-to-r from-teal-700/60 via-emerald-700/50 to-cyan-700/60 p-6 text-center shadow-lg md:justify-between md:text-left"
        >
          <div>
            <p className="text-sm font-semibold text-white">Want to explore BudgetBoy first?</p>
            <p className="text-xs text-teal-100/90">Try the wizard and see how polished product flows can convert users.</p>
          </div>
          <Link href="/wizard" className={cn(buttonVariants({ size: "lg" }), "gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 hover:scale-105 transition-all")}>
            Explore the product
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
