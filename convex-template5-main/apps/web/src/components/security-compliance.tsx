import { Shield, Lock, FileKey, CheckCircle2, Database, KeyRound } from "lucide-react";

export function SecurityCompliance() {
  const securityPillars = [
    {
      icon: KeyRound,
      title: "Granular Role-Based Access Control",
      desc: "Strict cryptographic and application-level isolation between administrative payroll operators and employee self-service members. Zero unauthorized access to salary registers.",
    },
    {
      icon: Database,
      title: "Immutable Payroll Snapshots",
      desc: "Once a payroll cycle is approved, its records are frozen into permanent snapshot versions. Past disbursals cannot be silently modified or overwritten.",
    },
    {
      icon: Lock,
      title: "Sensitive Credential & KYC Vaulting",
      desc: "Bank accounts, IFSC routing codes, PAN identifiers, and Aadhaar numbers are stored in encrypted vaults with strict access logs and masked views.",
    },
    {
      icon: Shield,
      title: "Deterministic Statutory Logic",
      desc: "Mathematical formulas adhere strictly to the Employees' Provident Funds Act, ESIC regulations, and state Professional Tax schedules with automated wage caps.",
    },
  ];

  return (
    <section id="security" className="relative z-10 py-24 bg-slate-50 dark:bg-[#080D19] border-t border-slate-200 dark:border-white/[0.08] scroll-mt-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Enterprise Security & Data Integrity</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security & Compliance Built Into Every Calculation
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Payroll is your organization's most sensitive data. IndiaPay is architected with defense-in-depth security, strict permission barriers, and mathematical verifiability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {securityPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B1224]/80 p-8 backdrop-blur-xl hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-all group shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    {p.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Verification Strip */}
        <div className="mt-12 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.02] p-6 text-center max-w-4xl mx-auto">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            Compliance Note: IndiaPay calculates all statutory deductions (PF, ESI, PT) based on published Government of India and state department gazettes. Organization-specific approvals remain under the sole oversight of your designated administrative officers.
          </p>
        </div>
      </div>
    </section>
  );
}
