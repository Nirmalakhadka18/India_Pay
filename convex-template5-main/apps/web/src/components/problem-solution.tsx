import { XCircle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export function ProblemSolution() {
  const comparisons = [
    {
      domain: "Monthly Payroll Execution",
      problem: {
        title: "Spreadsheet chaos & formula breakage",
        desc: "Fragile Excel formulas, inconsistent CTC breakups, and manual recalculations when employees join mid-month.",
      },
      solution: {
        title: "Deterministic 1-Click Payroll Engine",
        desc: "Automated gross-to-net pipeline with strict ceiling capping, allowance rules, and automated revision snapshots.",
      },
    },
    {
      domain: "Attendance & Loss-of-Pay",
      problem: {
        title: "Disconnected punch-in logs & delayed deductions",
        desc: "HR manually aggregates biometric punches and leaves at month-end, causing retroactive deduction disputes.",
      },
      solution: {
        title: "Native Attendance Sync & Auto-LOP",
        desc: "Real-time clock logs calculate pro-rated daily deductions instantly before the payroll run is locked.",
      },
    },
    {
      domain: "Statutory Compliance (PF / ESIC / PT)",
      problem: {
        title: "Manual challan calculations & penalty risks",
        desc: "Constantly calculating employee vs employer shares (12% PF, 0.75% ESI) with shifting state Professional Tax slabs.",
      },
      solution: {
        title: "Automated Statutory Ledger & Filing Ready",
        desc: "Exact Indian statutory breakdown with automated wage ceiling enforcement, ECR data readiness, and challan previews.",
      },
    },
    {
      domain: "Employee Experience & Payslips",
      problem: {
        title: "Endless email queries & lost PDF attachments",
        desc: "Finance teams spending days emailing password-protected PDFs and answering recurring 'why was tax deducted' questions.",
      },
      solution: {
        title: "Role-Based Self-Service & Gemini AI",
        desc: "Employees securely download payslips, inspect statutory breakups, and ask the AI assistant to explain salary line items.",
      },
    },
  ];

  return (
    <section className="relative z-10 py-24 bg-white dark:bg-[#080D19] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Legacy vs Intelligent Payroll</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Replace Fragmented HR Chaos With One Deterministic Platform
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Stop losing days reconciling spreadsheets, manual attendance registers, and compliance challans. IndiaPay unifies your entire people and payroll operations.
          </p>
        </div>

        <div className="space-y-6">
          {comparisons.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0A1020]/70 p-6 lg:p-8 backdrop-blur-xl hover:border-slate-300 dark:hover:border-white/[0.16] shadow-sm dark:shadow-none transition-all"
            >
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400 mb-4 pb-3 border-b border-slate-200 dark:border-white/[0.06]">
                {item.domain}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                {/* Legacy Problem */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-500/[0.04] dark:bg-rose-500/[0.03] border border-rose-500/20 dark:border-rose-500/10">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rose-800 dark:text-rose-200 text-sm mb-1">
                      {item.problem.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.problem.desc}
                    </p>
                  </div>
                </div>

                {/* IndiaPay Solution */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/[0.05] dark:bg-cyan-500/[0.04] border border-blue-500/25 dark:border-cyan-500/20 shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                  <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-cyan-200 text-sm mb-1">
                      {item.solution.title}
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.solution.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
