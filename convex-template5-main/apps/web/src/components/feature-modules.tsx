import {
  Calculator,
  Users,
  CalendarCheck,
  Plane,
  Scale,
  FileSpreadsheet,
  UserCheck,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Shield,
  Layers,
} from "lucide-react";

export function FeatureModules() {
  const modules = [
    {
      id: "payroll",
      icon: Calculator,
      title: "Payroll Management",
      badge: "Core Engine",
      tagline: "Deterministic Gross-to-Net in Seconds",
      description:
        "Execute end-to-end payroll runs with mathematical precision. Configurable basic salary, HRA, special allowances, custom bonuses, and automated deduction ceilings.",
      features: [
        "1-click batch payroll execution",
        "Configurable salary component structures",
        "Automated LOP & mid-month pro-rating",
        "Lockable immutable payroll snapshots",
      ],
      visualData: {
        stat: "₹48,000",
        label: "Sample Net Disbursal / Staff",
        highlight: "100% Deterministic Math",
      },
    },
    {
      id: "employees",
      icon: Users,
      title: "Employee Management",
      badge: "Workforce",
      tagline: "Single Source of Truth for Personnel",
      description:
        "Maintain comprehensive employee profiles with PAN, Aadhaar, UAN, ESIC IP numbers, bank routing details, and organizational reporting lines.",
      features: [
        "Structured KYC & identity management",
        "Department & designation hierarchy",
        "Role-governed data isolation (Admin vs Member)",
        "Contractor & full-time compensation tracks",
      ],
      visualData: {
        stat: "100%",
        label: "Secure Digital Profiles",
        highlight: "Role-Based Access Guard",
      },
    },
    {
      id: "attendance",
      icon: CalendarCheck,
      title: "Attendance Management",
      badge: "Time & Punch",
      tagline: "Real-Time Tracking & Auto-LOP Calculation",
      description:
        "Seamlessly monitor daily check-ins, working hours, and absences. Days marked absent directly flow into pro-rated payroll loss-of-pay deductions.",
      features: [
        "Daily punch-in and punch-out logging",
        "Automatic Loss-of-Pay (LOP) computation",
        "Overtime & working hour metrics",
        "Direct synchronization with monthly payroll",
      ],
      visualData: {
        stat: "26 Days",
        label: "Oct 2026 Working Standard",
        highlight: "Zero Manual Reconciliation",
      },
    },
    {
      id: "leaves",
      icon: Plane,
      title: "Leave Administration",
      badge: "Time Off",
      tagline: "Streamlined Requests & Balance Ledgers",
      description:
        "Empower employees to request leaves with transparent balances across Casual, Sick, and Earned Leave. Managers review and approve in one click.",
      features: [
        "Granular leave quota management",
        "Manager approval & status updates",
        "Real-time balance deduction ledger",
        "Seamless integration with monthly attendance",
      ],
      visualData: {
        stat: "12 Days/Yr",
        label: "Configurable Quota Tiers",
        highlight: "Live Balance Audit",
      },
    },
    {
      id: "compliance",
      icon: Scale,
      title: "Statutory Compliance",
      badge: "Regulatory",
      tagline: "Indian Labor Codes: PF, ESI, PT & TDS",
      description:
        "Stay aligned with EPFO (12% employee + 12% employer), ESIC (0.75% + 3.25%), state-specific Professional Tax slabs, and dual TDS tax regimes.",
      features: [
        "Statutory wage ceiling enforcement (₹15,000 PF)",
        "ESIC eligibility threshold automation (₹21,000)",
        "State Professional Tax (PT) calculations",
        "Challan preview & export readiness",
      ],
      visualData: {
        stat: "₹1,800 Max",
        label: "Statutory PF Ceiling Cap",
        highlight: "Statutory Shield Enabled",
      },
    },
    {
      id: "payslips",
      icon: FileSpreadsheet,
      title: "Payslip Generation",
      badge: "Disbursement",
      tagline: "Branded, Tamper-Evident PDFs",
      description:
        "Generate compliant, formatted payslips featuring itemized earnings, statutory withholdings, attendance summaries, and company branding.",
      features: [
        "Automated PDF document generation",
        "Itemized earnings vs deductions breakdown",
        "One-click authenticated employee download",
        "Historical payslip archive per employee",
      ],
      visualData: {
        stat: "PDF / Vector",
        label: "Enterprise Formatted Slip",
        highlight: "Instant Dispatch Ready",
      },
    },
    {
      id: "self-service",
      icon: UserCheck,
      title: "Employee Self-Service",
      badge: "Portal",
      tagline: "Empower Your Team With Autonomy",
      description:
        "Give your workforce a modern, responsive web portal to view recent payslips, track leave balances, review attendance punches, and query salary components.",
      features: [
        "Personal compensation breakdown view",
        "Leave request submission & balance tracking",
        "Attendance check-in verification",
        "Confidential document access",
      ],
      visualData: {
        stat: "24/7 Access",
        label: "Secure Member Portal",
        highlight: "Zero HR Ticket Overhead",
      },
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Payroll Analytics",
      badge: "Intelligence",
      tagline: "Real-Time Headcount & Disbursal Insights",
      description:
        "Gain instant visibility into organizational compensation spend, department allocations, monthly variance anomalies, and statutory outflow.",
      features: [
        "Gross CTC vs Net payout trend analysis",
        "Department-wise payroll distribution",
        "Month-over-month variance detection",
        "Tax & compliance expenditure reporting",
      ],
      visualData: {
        stat: "100%",
        label: "Audit Trail Transparency",
        highlight: "Executive Spend Clarity",
      },
    },
    {
      id: "ai-assistant",
      icon: Sparkles,
      title: "Gemini AI Payroll Assistant",
      badge: "AI Powered",
      tagline: "Next-Gen Conversational Payroll Intelligence",
      description:
        "Integrated directly with Google Gemini 2.5/Flash to summarize payroll runs, identify variance anomalies, and answer employee questions regarding deductions.",
      features: [
        "Streaming conversational AI interface",
        "Instant payroll run audit summaries",
        "Natural language policy explanations",
        "Variance detection across pay cycles",
      ],
      visualData: {
        stat: "Gemini AI",
        label: "Context-Aware Agent",
        highlight: "Integrated In Dashboard",
      },
    },
  ];

  return (
    <section id="features" className="relative z-10 py-24 bg-slate-50 dark:bg-[#060A14] border-t border-slate-200 dark:border-white/[0.08] scroll-mt-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-400 text-xs font-semibold mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Product Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Nine Modules. One Seamless Platform.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Engineered from first principles to handle the full lifecycle of Indian workforce compensation, statutory adherence, and employee operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0A1020]/90 p-7 hover:border-blue-400 dark:hover:border-cyan-500/40 hover:bg-slate-50/50 dark:hover:bg-[#0E172E] transition-all duration-300 flex flex-col justify-between shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                      {m.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs font-mono text-blue-600 dark:text-cyan-400 mt-1 mb-3">
                    {m.tagline}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {m.description}
                  </p>

                  {/* Feature Bullets */}
                  <div className="space-y-2 mb-6 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                    {m.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micro Visual Card */}
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-black/40 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {m.visualData.stat}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {m.visualData.label}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 px-2 py-0.5 rounded bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20">
                    {m.visualData.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
