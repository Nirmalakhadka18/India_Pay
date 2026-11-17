import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Target,
  HeartHandshake,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Scale,
  Cpu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About IndiaPay — Mission, Principles & Workforce Engineering",
  description:
    "Learn about IndiaPay's mission to eliminate manual spreadsheet friction and bring mathematical precision to Indian payroll, HR compliance, and workforce operations.",
};

export default function AboutPage() {
  const principles = [
    {
      title: "Mathematical Determinism Over Magic",
      desc: "Payroll is not the place for approximate math or fuzzy algorithms. Every gross-to-net calculation, ceiling cap, and tax bracket in IndiaPay follows strict, verifiable logic that can be audited down to the single rupee.",
      icon: Cpu,
    },
    {
      title: "Built for Indian Labor Realities",
      desc: "Generic global HR tools fail in India because they do not understand the intricacies of EPFO wage ceilings, ESIC eligibility rules, loss-of-pay pro-rating, and state-specific professional taxes. We design specifically for the Indian enterprise.",
      icon: Scale,
    },
    {
      title: "Immutable Accountability & Privacy",
      desc: "Compensation is an organization's most sensitive operational data. Once approved, payroll snapshots are frozen permanently with cryptographic session tracking, credential vaulting, and strict role boundaries.",
      icon: Lock,
    },
    {
      title: "Context-Aware Intelligence",
      desc: "We leverage state-of-the-art AI (Google Gemini) not as a gimmick, but as an audit partner—summarizing complex pay runs, spotting month-over-month variances, and demystifying tax policies for employees.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D19] text-slate-900 dark:text-white transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden pt-28 pb-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[450px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
            <Compass className="w-3.5 h-3.5" />
            <span>Our Philosophy & Mission</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Workforce & Payroll Operations, Simplified.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            IndiaPay was founded with a singular conviction: Indian businesses deserve enterprise-grade payroll software that eliminates spreadsheet chaos and enforces statutory compliance effortlessly.
          </p>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none p-8 sm:p-10 backdrop-blur-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To empower Indian founders, HR leaders, and finance professionals with a modern, deterministic platform that runs payroll with 100% mathematical accuracy, automates statutory obligations, and delivers a transparent self-service experience to every employee.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none p-8 sm:p-10 backdrop-blur-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To become the operating system for India's workforce—unifying attendance, leaves, statutory compliance, compensation modeling, and AI-driven variance auditing into a single pane of glass for enterprises across the nation.
            </p>
          </div>
        </div>

        {/* 4 Core Engineering Principles */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Product Philosophy
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">
              The Principles That Guide Our Code
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              How we approach engineering, product design, and customer trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((pr, idx) => {
              const Icon = pr.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-[#0A1020]/80 p-6 sm:p-8 hover:border-cyan-500/30 transition-all hover:bg-[#0D152A]"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {pr.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pr.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commitment to Regulatory Transparency */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-slate-50 dark:bg-[#070B16] border border-slate-200 dark:border-white/[0.08] p-8 sm:p-12 mb-20 text-center max-w-4xl mx-auto">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Built Responsibly for Indian Compliance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
            IndiaPay does not make unverified claims. We implement statutory calculations in strict accordance with the Employees' Provident Funds and Miscellaneous Provisions Act, 1952, the Employees' State Insurance Act, 1948, and gazetted State Professional Tax legislation.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-blue-900/30 via-cyan-900/20 to-blue-900/30 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Join the Next Generation of Indian Workforce Management
          </h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 max-w-xl mx-auto">
            Experience how IndiaPay can transform your monthly payroll close from days of frustration into a single, confident click.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
            >
              Book an Interactive Demo
            </Link>
            <Link
              href="/platform"
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-white transition-all"
            >
              Explore Architecture
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




