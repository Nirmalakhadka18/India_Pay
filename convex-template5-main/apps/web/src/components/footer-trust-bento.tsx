import { Shield, Lock, Scale, Zap, Database } from "lucide-react";

export function FooterTrustBento() {
  const cards = [
    {
      title: "EPFO Act 1952",
      stat: "₹1,800 Cap",
      desc: "Deterministic ceiling enforcement on all salary bands",
      color: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700/50",
      icon: Scale,
    },
    {
      title: "ESIC Act 1948",
      stat: "≤ ₹21k Rules",
      desc: "0.75% / 3.25% automated employee & employer split",
      color: "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700/50",
      icon: Shield,
    },
    {
      title: "Form 5A PT",
      stat: "Karnataka & MH",
      desc: "₹200 monthly with automatic February ₹300 surge",
      color: "bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700/50",
      icon: Zap,
    },
    {
      title: "Data Vault",
      stat: "Role-Based Isolation",
      desc: "Admin operators vs member self-service boundaries",
      color: "bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700/50",
      icon: Lock,
    },
    {
      title: "Audit Snapshots",
      stat: "Immutable Records",
      desc: "Version-controlled payroll freeze with zero silent edits",
      color: "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-700/50",
      icon: Database,
    },
  ];

  return (
    <div className="border-t border-slate-200 dark:border-white/[0.08] py-8 bg-slate-50 dark:bg-[#03060E] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 text-center mb-5 font-semibold">
          Institutional Governance & Statutory Alignment
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] flex flex-col justify-between ${c.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    {c.title}
                  </span>
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight font-mono">
                    {c.stat}
                  </div>
                  <div className="text-[11px] opacity-80 leading-snug mt-1 font-sans">
                    {c.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
