import { Users, Cpu, FileCheck, ArrowRight, ShieldCheck, Check } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Users,
      title: "Configure Workforce & Compensation",
      tagline: "Set up in minutes",
      description:
        "Import your workforce roster, define salary structures (Basic, HRA, Allowances), assign bank details, and configure statutory PF, ESI, and Professional Tax parameters.",
      deliverables: [
        "Structured KYC & PAN/Aadhaar vault",
        "Deterministic CTC component rules",
        "Configurable leave quotas & holiday calendar",
      ],
    },
    {
      step: "02",
      icon: Cpu,
      title: "Automate Attendance & Statutory Math",
      tagline: "Continuous synchronization",
      description:
        "IndiaPay continuously ingests daily attendance punches, cross-references approved leaves, flags unapproved absences, and automatically calculates pro-rated Loss of Pay (LOP).",
      deliverables: [
        "Zero-delay LOP deduction computing",
        "Strict wage ceiling adherence (₹1,800 PF cap)",
        "Pre-run ledger validation check",
      ],
    },
    {
      step: "03",
      icon: FileCheck,
      title: "Audit, Lock & Disburse",
      tagline: "One-click closure",
      description:
        "Audit monthly variances with Gemini AI, verify total net outflow, lock immutable payroll snapshot revisions, and automatically disburse branded employee payslips.",
      deliverables: [
        "Immutable version-controlled payroll locks",
        "Automated PDF payslip generation",
        "Instant employee self-service availability",
      ],
    },
  ];

  return (
    <section id="how-it-works" className="relative z-10 py-24 bg-white dark:bg-[#060A14] border-t border-slate-200 dark:border-white/[0.08] scroll-mt-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Operational Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Three Steps to Effortless Payroll Operations
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            From initial employee onboarding to monthly disbursal and compliance challans, IndiaPay transforms complex HR operations into an automated, predictable pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="relative rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0A1022]/80 p-8 backdrop-blur-xl flex flex-col justify-between hover:border-blue-400 dark:hover:border-cyan-500/40 hover:bg-slate-100/80 dark:hover:bg-[#0D152C] transition-all group shadow-sm dark:shadow-none"
              >
                <div>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-cyan-300">
                      {st.step}
                    </span>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-cyan-400 font-semibold block mb-1">
                    {st.tagline}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-cyan-200 transition-colors">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {st.description}
                  </p>
                </div>

                {/* Bullets */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] space-y-2.5">
                  {st.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
