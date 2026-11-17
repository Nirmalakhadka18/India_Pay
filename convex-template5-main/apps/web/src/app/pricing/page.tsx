import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  HelpCircle,
  Zap,
  Building2,
  Users,
  Sparkles,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Indicative Pricing & Plans — IndiaPay Transparent Workforce Economics",
  description:
    "Review indicative pricing tiers for IndiaPay. Predictable per-employee per-month economics for Indian startups, growing SMBs, and mid-market enterprises.",
};

export default function PricingPage() {
  const tiers = [
    {
      name: "Starter",
      badge: "Seed / Small Teams",
      price: "₹45",
      unit: "per employee / month",
      desc: "For early-stage startups and agile Indian teams looking to automate payroll and statutory compliance from Day 1.",
      highlights: [
        "Up to 25 Active Employees",
        "Deterministic 1-Click Payroll Run",
        "Automated EPFO & ESIC Ceiling Compliance",
        "Pro-Rated Daily Loss-of-Pay (LOP) Engine",
        "Vector PDF Payslip Generation",
        "Standard Email & Documentation Support",
      ],
      ctaText: "Get Started on Starter",
      ctaHref: "/talk-to-us?plan=starter",
      popular: false,
    },
    {
      name: "Growth",
      badge: "Most Popular",
      price: "₹75",
      unit: "per employee / month",
      desc: "For growing businesses requiring real-time attendance synchronization, leave balance administration, and multi-tier approvals.",
      highlights: [
        "Up to 250 Active Employees",
        "Everything in Starter, plus:",
        "Attendance Punch Ingestion & Biometric Sync",
        "Granular Leave Quota Management (CL, SL, PL)",
        "Employee Self-Service Member Portal",
        "State Professional Tax (PT) Form 5A Schedules",
        "Dual TDS Regime Projections",
        "Priority Support & Dedicated Account Manager",
      ],
      ctaText: "Select Growth Plan",
      ctaHref: "/talk-to-us?plan=growth",
      popular: true,
    },
    {
      name: "Enterprise",
      badge: "Scale & Governance",
      price: "Custom",
      unit: "tailored volume economics",
      desc: "For mid-market enterprises and conglomerates demanding immutable audit logs, Gemini AI variance audits, and custom integrations.",
      highlights: [
        "250+ Employees with Multi-Entity Branches",
        "Everything in Growth, plus:",
        "Gemini AI Payroll Copilot & Variance Auditing",
        "Immutable Version-Controlled Snapshot Locks",
        "Multi-State PT Automation (MH, KA, TS, AP)",
        "Custom CTC Structure Rules & Bonus Formulas",
        "Dedicated Data Migration & White-Glove Onboarding",
        "99.9% Uptime SLA & 24/7 Enterprise Support",
      ],
      ctaText: "Contact Enterprise Sales",
      ctaHref: "/talk-to-us?plan=enterprise",
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "Are these prices final or indicative?",
      a: "All displayed rates are indicative benchmark rates designed to provide transparent workforce economics for budgeting. Final customized quotations depend on your organizational headcount, multi-state branch presence, and specific data migration requirements.",
    },
    {
      q: "How does billing work when employees join mid-month?",
      a: "IndiaPay calculates billing strictly on active payroll records processed during that calendar cycle. Mid-month joiners receive deterministic pro-rated earnings in their payslip, while your organization only pays for the active staff processed.",
    },
    {
      q: "Are statutory compliance modules included in every tier?",
      a: "Yes. We believe no Indian company should risk statutory penalties. All plans include automated EPFO (12% ceiling cap of ₹1,800/mo) and ESIC statutory calculation logic out of the box.",
    },
    {
      q: "Can we migrate historical data from spreadsheets or legacy software?",
      a: "Absolutely. Our onboarding team provides turnkey migration assistance for past salary structures, employee KYC information, and opening leave balances with zero data loss.",
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
            <Zap className="w-3.5 h-3.5" />
            <span>Transparent Workforce Economics</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Predictable Pricing for Growing Indian Companies.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Transparent per-employee economics. No hidden setup charges, no opaque consulting add-ons, and no penalty clauses.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Notice: Indicative benchmark rates displayed for planning purposes.</span>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl p-8 backdrop-blur-xl transition-all flex flex-col justify-between ${
                tier.popular
                  ? "border-2 border-cyan-500 bg-blue-50/70 dark:bg-blue-50/70 dark:bg-[#0C152B] shadow-2xl shadow-cyan-500/20 scale-[1.02]"
                  : "border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none hover:border-white/[0.16]"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tier.name}</h2>
                  <span className="text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.04]">
                    {tier.badge}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 ml-2 font-mono">
                    {tier.unit}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {tier.desc}
                </p>

                <div className="pt-6 border-t border-slate-200 dark:border-white/[0.08] space-y-3 mb-8">
                  <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    Included Features:
                  </div>
                  {tier.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={tier.ctaHref}
                  className={`w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-center block transition-all shadow-md ${
                    tier.popular
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-cyan-500/20"
                      : "bg-white/[0.06] hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  {tier.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing FAQs */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-[#0A1020]/80 p-8 sm:p-12 mb-20 backdrop-blur-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Clear answers regarding our billing methodology and statutory provisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-black/30 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Banner */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-blue-900/30 via-cyan-900/20 to-blue-900/30 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Need a Custom Headcount Assessment?
          </h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 max-w-xl mx-auto">
            Our enterprise operations team can model your exact multi-branch headcount and statutory requirements into an optimized budget proposal.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
            >
              Request Custom Quote
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-white transition-all"
            >
              General Inquiries
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




