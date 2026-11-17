import { ShieldCheck, Building2, Scale, Users, CheckCircle2, Clock } from "lucide-react";

export function TrustStrip() {
  const highlights = [
    {
      icon: Scale,
      title: "Built for Indian Labor Codes",
      desc: "Pre-configured for EPFO, ESIC, Professional Tax, and dual TDS regimes.",
    },
    {
      icon: ShieldCheck,
      title: "100% Statutory Accuracy",
      desc: "Deterministic ceiling enforcement on PF (₹1,800/₹15k) and ESI (0.75%/3.25%).",
    },
    {
      icon: Clock,
      title: "Automated LOP Deduction",
      desc: "Direct synchronization of attendance records with pro-rated daily loss-of-pay.",
    },
    {
      icon: Users,
      title: "Role-Governed Self-Service",
      desc: "Strict separation between administrative payroll controls and employee portal.",
    },
  ];

  return (
    <section className="relative z-10 border-y border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#070B16]/90 py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-cyan-400 font-mono">
            Enterprise Architecture & Regulatory Alignment
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Engineered for Modern Indian Enterprises & Fast-Growing Startups
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all hover:border-blue-400 dark:hover:border-cyan-500/30 group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
