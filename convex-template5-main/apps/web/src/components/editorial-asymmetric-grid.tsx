import { Users, Building2, Check, ArrowRight, ShieldCheck, Sparkles, Database } from "lucide-react";
import Link from "next/link";

export function EditorialAsymmetricGrid() {
  return (
    <section className="relative z-10 py-20 bg-slate-100/60 dark:bg-[#070B16] border-t border-slate-200 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Architectural Rigor</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Deterministic Logic. Built for Indian Reality.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Compare how traditional spreadsheet calculations break versus how IndiaPay guarantees regulatory and mathematical consistency.
          </p>
        </div>

        {/* 2-Column Asymmetric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Card 1: 7 Columns - The Core Payroll Pipeline */}
          <div className="lg:col-span-7 rounded-2xl border-2 border-slate-300 dark:border-white/10 bg-white dark:bg-[#0B1224] p-7 sm:p-10 shadow-[6px_6px_0_0_#cbd5e1] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-mono uppercase tracking-widest font-bold px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                  Gross-to-Net Engine Specs
                </span>
                <span className="text-xs font-mono text-slate-500">v2.4 Engine</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Zero Formula Breakage Across All 12 Monthly Cycles
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Traditional payroll breaks when employees take mid-cycle unpaid leave or join mid-month. IndiaPay automatically evaluates standard calendar days, validates check-in punches, calculates daily pro-rated wages, and applies statutory wage ceilings before freezing the ledger.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/[0.08] pt-6">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">Wage Ceiling Rule</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">₹15,000 EPF Cap</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Capped at ₹1,800/mo even on ₹1,00,000+ base CTC.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">Loss-of-Pay Trigger</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">Pro-Rated Daily Deductions</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Direct sync with biometric punches and leave records.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <Link
                href="/platform"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
              >
                <span>Read Full Technical Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ● 100% Deterministic Guarantee
              </span>
            </div>
          </div>

          {/* Card 2: 5 Columns - High-Impact Statutory Shield */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-7 sm:p-10 shadow-[6px_6px_0_0_#1e3a8a] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-mono uppercase tracking-widest font-bold px-2.5 py-1 rounded bg-white/20 text-white border border-white/30">
                  Statutory Filing Readiness
                </span>
                <ShieldCheck className="w-6 h-6 text-cyan-300" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                EPFO, ESIC & PT Returns Ready to File in Seconds
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed mb-6">
                Stop spending 3 to 5 days every month exporting data into custom Excel templates. IndiaPay generates official Government of India filing formats directly from your approved payroll snapshot.
              </p>

              <div className="space-y-3 border-t border-white/20 pt-6">
                <div className="flex items-start gap-2.5 text-xs text-blue-50">
                  <Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <span><strong>EPFO ECR:</strong> Direct 11-field #~# hash-delimited file ready for portal upload.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-blue-50">
                  <Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <span><strong>ESIC Challan:</strong> Official 6-column excel spreadsheet with employee & employer split.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-blue-50">
                  <Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <span><strong>Karnataka PT:</strong> Form 5A return with ₹200 standard / ₹300 February schedule.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/20">
              <Link
                href="/talk-to-us"
                className="w-full py-3 rounded-xl bg-white text-blue-900 font-bold text-xs text-center block hover:bg-blue-50 transition-colors shadow-lg"
              >
                Request Statutory Compliance Walkthrough
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
