import type { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  Cpu,
  Database,
  Lock,
  ShieldCheck,
  ArrowRight,
  Scale,
  CalendarCheck,
  FileCheck,
  Sparkles,
  Server,
  Zap,
  ChevronRight,
  Workflow,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Architecture — IndiaPay Enterprise HRMS & Payroll",
  description:
    "Explore the architectural layers of IndiaPay: deterministic gross-to-net engine, Indian statutory compliance framework, real-time attendance ingestion, and Gemini AI reasoning.",
};

export default function PlatformPage() {
  const architecturalLayers = [
    {
      level: "Layer 01",
      name: "Identity & Role Governance (RBAC)",
      tagline: "Cryptographic & Session Isolation",
      desc: "Strict administrative vs employee member boundaries. Multi-tenant workspace data isolation with session timeouts, bfcache protections, and enterprise credential masking.",
      specs: ["Admin vs Member Roles", "Masked PII / KYC Vault", "Bfcache Logout Shield"],
      icon: Lock,
      color: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    },
    {
      level: "Layer 02",
      name: "Time & Attendance Engine",
      tagline: "Continuous Event Ingestion & LOP Calculator",
      desc: "Processes clock-in/out records, leave balances, and unpaid absences. Automatically computes pro-rated daily wage loss-of-pay deductions prior to monthly payroll compilation.",
      specs: ["Pro-rated Daily Deduction", "Working Calendar Alignment", "Shift & Punch Sync"],
      icon: CalendarCheck,
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    },
    {
      level: "Layer 03",
      name: "Deterministic Payroll Engine",
      tagline: "Gross-to-Net Mathematical Pipeline",
      desc: "Pure deterministic calculation pipeline handling base pay, HRA, special allowances, bonuses, and statutory deductions without spreadsheet formula fragility.",
      specs: ["100% Deterministic Math", "Automated Pay Slip Generation", "Mid-Month Joiner Pro-rating"],
      icon: Cpu,
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
    {
      level: "Layer 04",
      name: "Statutory Compliance Ledger",
      tagline: "Indian Labor Codes & Gazetted Schedules",
      desc: "Automated wage ceiling caps (₹1,800/mo PF cap on ₹15k wage ceiling), ESIC eligibility thresholds (₹21k), state-by-state Professional Tax schedules, and dual TDS tax regimes.",
      specs: ["EPFO Act 1952 Ready", "ESIC Act 1948 Ready", "State PT Schedules (KA, MH, etc.)"],
      icon: Scale,
      color: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    },
    {
      level: "Layer 05",
      name: "Immutable Snapshot Archival",
      tagline: "Audit-Trail & Version Locking",
      desc: "Once finalized by authorized payroll administrators, each payroll cycle is locked as an immutable versioned snapshot. Historical records cannot be altered retroactively.",
      specs: ["Idempotent Execution", "Immutable JSON/Record Vault", "Full Audit History"],
      icon: Database,
      color: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    {
      level: "Layer 06",
      name: "Gemini AI Copilot Integration",
      tagline: "Context-Aware Workforce Intelligence",
      desc: "Streaming conversational assistant powered by Google Gemini. Audits payroll variances, provides explanations for statutory deductions, and clarifies organizational leave policies.",
      specs: ["Real-Time Streaming", "Deterministic Context Boundaries", "Automated Variance Detection"],
      icon: Sparkles,
      color: "border-cyan-400/30 text-cyan-300 bg-cyan-400/10",
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
            <Server className="w-3.5 h-3.5" />
            <span>Enterprise System Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Built on Pure Mathematical Determinism.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            IndiaPay is engineered from the ground up as a six-tier reactive architecture that unifies personnel management, statutory compliance, and payroll disbursal into one reliable system.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all"
            >
              <span>Schedule Architecture Review</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-white/[0.05] border border-white/[0.1] text-slate-600 dark:text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <span>Explore Nine Product Modules</span>
            </Link>
          </div>
        </div>

        {/* High-Fidelity Architecture Flow Diagram */}
        <div className="mb-20 rounded-2xl border border-white/[0.1] bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/80">
          <div className="border-b border-white/[0.08] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                Operational Pipeline Flow
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                From Time Punch to Statutory Disbursal
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Convex Reactive Database</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="rounded-xl border border-white/[0.08] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] p-5 space-y-2">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Step 01 &bull; Ingestion</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Attendance & Leaves</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Biometric and portal punch logs capture check-in times. Absence records calculate pro-rated Loss of Pay (LOP) based on monthly working standards.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] p-5 space-y-2">
              <div className="text-[10px] font-mono text-blue-400 font-bold uppercase">Step 02 &bull; Deduction Engine</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Statutory Ceiling Caps</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                EPFO 12% rules apply wage ceiling caps (₹1,800 max). ESIC (0.75%/3.25%) threshold checks and State PT brackets are computed deterministically.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] p-5 space-y-2">
              <div className="text-[10px] font-mono text-purple-400 font-bold uppercase">Step 03 &bull; AI Variance Audit</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gemini Run Verification</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                AI assistant cross-references month-over-month variances, flags salary anomalies, and summarizes total disbursals before administrative sign-off.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] p-5 space-y-2">
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Step 04 &bull; Finalization</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Snapshot Lock & PDF Dispatch</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Payroll snapshot is locked permanently. Branded tamper-evident PDF payslips are dispatched to employee self-service portals instantly.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Architectural Layers */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Six Architectural Tiers
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Each tier functions autonomously with rigorous input sanitization and verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {architecturalLayers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.08] bg-[#0A1020]/80 p-6 flex flex-col justify-between hover:border-cyan-500/30 transition-all hover:bg-[#0D152A] group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl border ${layer.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                        {layer.level}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-300 transition-colors">
                      {layer.name}
                    </h3>
                    <p className="text-xs font-mono text-cyan-400 mt-0.5 mb-3">
                      {layer.tagline}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                      {layer.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] space-y-1.5">
                    {layer.specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statutory Engine Deep Dive */}
        <div id="compliance" className="rounded-2xl border border-white/[0.1] bg-slate-50 dark:bg-[#070B16] border border-slate-200 dark:border-white/[0.08] p-8 sm:p-12 mb-20 scroll-mt-24">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Statutory Engine Specifications
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 mb-4">
              Mathematical Strictness for Indian Regulations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Unlike generic international payroll platforms that rely on third-party integrations, IndiaPay embeds Indian labor statutory formulas directly into the calculation core:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-xl border border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
              <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">EPFO Ceilings</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Applies the ₹15,000 monthly basic wage ceiling. Automatically enforces the ₹1,800/month maximum employee PF deduction while isolating employer EPS (8.33%) and EPF (3.67%) allocations.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
              <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">ESIC Wage Thresholds</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Calculates 0.75% employee contribution and 3.25% employer share for wages up to ₹21,000/month. Automatically flags and exempts staff members earning above the statutory threshold.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
              <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">State Professional Tax</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pre-configured for Karnataka Form 5A (₹200/month for gross &ge; ₹25,000, with ₹300 February surge) and customizable for other states including Maharashtra, Telangana, and Andhra Pradesh.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-blue-900/30 via-cyan-900/20 to-blue-900/30 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Experience the Architectural Difference
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Schedule a technical walkthrough with an IndiaPay solutions architect to review our calculation benchmarks and API security.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
            >
              Book Technical Demo
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-white/[0.05] border border-white/[0.1] text-slate-600 dark:text-slate-300 hover:text-white transition-all"
            >
              View Pricing Tiers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


