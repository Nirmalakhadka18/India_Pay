import { Cpu, ShieldCheck, Scale, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function HeroFeatureBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1440px] mx-auto text-left mt-16 sm:mt-20">
      {/* Pillar 1: How IndiaPay Computes */}
      <div className="rounded-2xl border-2 border-slate-300 dark:border-white/10 bg-white dark:bg-[#0B1224] p-6 sm:p-7 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_rgba(34,211,238,0.2)] hover:-translate-y-1 transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
              Pillar 01 · Execution
            </span>
            <Cpu className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
            Deterministic 1-Click Computation
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Gross CTC components automatically separate into Basic, HRA, and allowances. Attendance clock punches dynamically calculate pro-rated daily Loss-of-Pay deductions before locking.
          </p>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-sans border-t border-slate-200 dark:border-white/[0.06] pt-3">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Daily Rate = Gross / Standard Working Days</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Mid-month joining & resignation pro-rating</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <Link
            href="/platform"
            className="text-xs font-semibold text-blue-600 dark:text-cyan-400 flex items-center gap-1 hover:underline"
          >
            <span>Explore Engine Math</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-[10px] font-mono text-slate-500">100% Deterministic</span>
        </div>
      </div>

      {/* Pillar 2: How IndiaPay Complies */}
      <div className="rounded-2xl border-2 border-slate-300 dark:border-white/10 bg-white dark:bg-[#0B1224] p-6 sm:p-7 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_rgba(37,99,235,0.25)] hover:-translate-y-1 transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Pillar 02 · Statutory Shield
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
            Pre-Configured Indian Labor Codes
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Built-in regulatory ceilings for EPFO (₹1,800 maximum ceiling), ESIC (0.75% / 3.25% rates under ₹21k), Karnataka Form 5A PT schedules, and dual TDS tax regimes.
          </p>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-sans border-t border-slate-200 dark:border-white/[0.06] pt-3">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Official 11-field #~# ECR format ready</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Karnataka PT ₹200/mo & Feb ₹300 surge</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <Link
            href="/platform#compliance"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
          >
            <span>Verify Compliance Rules</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-[10px] font-mono text-slate-500">Gazette Aligned</span>
        </div>
      </div>

      {/* Pillar 3: Why Trust IndiaPay Architecture */}
      <div className="rounded-2xl border-2 border-slate-300 dark:border-white/10 bg-white dark:bg-[#0B1224] p-6 sm:p-7 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_rgba(99,102,241,0.25)] hover:-translate-y-1 transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Pillar 03 · Enterprise Trust
            </span>
            <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            Immutable Snapshots & Gemini AI
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Approved pay runs freeze into permanent version-controlled snapshots that cannot be overwritten. Context-aware Gemini AI answers employee queries and audits month-on-month variance.
          </p>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-sans border-t border-slate-200 dark:border-white/[0.06] pt-3">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Full audit trail with timestamped logs</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Strict RBAC: Admin vs Employee Self-Service</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <Link
            href="/platform#ai"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            <span>Learn About Gemini Copilot</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-[10px] font-mono text-slate-500">Zero Drift</span>
        </div>
      </div>
    </div>
  );
}
