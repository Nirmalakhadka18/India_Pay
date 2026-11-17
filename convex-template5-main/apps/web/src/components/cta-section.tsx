import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";

export function CTASection() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <section className="relative z-10 py-24 bg-white dark:bg-[#060A14] overflow-hidden border-t border-slate-200 dark:border-white/[0.08] transition-colors duration-200">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[350px] sm:h-[450px] bg-gradient-to-r from-blue-600/10 via-cyan-500/15 to-blue-500/10 dark:from-blue-600/20 dark:via-cyan-500/25 dark:to-blue-500/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Indian Payroll Ready Today</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Make Payroll the Easiest Part of Your Business.
        </h2>

        <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Eliminate manual spreadsheet errors, automate statutory withholdings, and empower your workforce with IndiaPay's enterprise platform.
        </p>

        {/* CTA Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/talk-to-us"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02]"
          >
            <span>Book an Enterprise Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={`${appUrl}/login`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.12] text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:border-blue-400 dark:hover:border-cyan-500/40 shadow-sm dark:shadow-none transition-all"
          >
            <span>Sign In to Platform</span>
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            No Long-Term Contracts
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Deterministic Indian Labor Code Math
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Dedicated Onboarding & Migration
          </span>
        </div>
      </div>
    </section>
  );
}
