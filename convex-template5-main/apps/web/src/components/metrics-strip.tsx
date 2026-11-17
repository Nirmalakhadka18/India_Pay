import {
  Calculator,
  ShieldCheck,
  Scale,
  Clock,
  Database,
  Building2,
  Users,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

export function MetricsStrip() {
  const metrics = [
    {
      value: "100%",
      label: "Deterministic Accuracy",
      sub: "Zero Spreadsheet Drift",
      icon: Scale,
    },
    {
      value: "₹1,800",
      label: "Statutory PF Ceiling",
      sub: "EPFO Act 1952 Cap",
      icon: ShieldCheck,
    },
    {
      value: "0.75%",
      label: "ESIC Contribution",
      sub: "≤ ₹21,000 Wage Limit",
      icon: Calculator,
    },
    {
      value: "1-Click",
      label: "Loss-of-Pay Engine",
      sub: "Auto-Punch Sync",
      icon: Clock,
    },
    {
      value: "Form 5A",
      label: "Professional Tax",
      sub: "Multi-State Sched (KA/MH)",
      icon: FileCheck,
    },
    {
      value: "Immutable",
      label: "Payroll Snapshots",
      sub: "Audit-Locked Ledgers",
      icon: Database,
    },
    {
      value: "Gemini AI",
      label: "Copilot Assistant",
      sub: "Context Variance Audits",
      icon: Users,
    },
  ];

  return (
    <section className="relative z-10 border-y border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#060A14] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/[0.08]">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rule #{idx + 1}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {m.value}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                    {m.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {m.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
