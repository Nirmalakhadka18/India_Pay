import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  Building,
  TrendingUp,
  Landmark,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Users,
  Scale,
  Sparkles,
  ShieldCheck,
  Calculator,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tailored Solutions — IndiaPay for Startups, SMBs, Enterprises & Finance Teams",
  description:
    "Discover how IndiaPay scales from early-stage Indian startups with 5 employees to growing SMBs and mid-market enterprises with multi-branch statutory complexity.",
};

export default function SolutionsPage() {
  const solutions = [
    {
      id: "startups",
      badge: "Seed to Series B",
      name: "For Indian Startups & Agile Teams",
      tagline: "Zero-Friction Setup with Institutional Compliance",
      desc: "Get off spreadsheets in less than an hour. Issue professional PDF payslips, calculate compliant PF/ESI without hiring an expensive external payroll agency, and let employees self-serve.",
      icon: Rocket,
      accentColor: "from-blue-600 to-cyan-500",
      highlights: [
        "One-click monthly payroll run for rapidly scaling headcounts",
        "Automated pro-rated daily wage deduction for unpaid leaves (LOP)",
        "Pre-configured statutory compliance so you never risk EPFO/ESIC notices",
        "Employee self-service portal to eliminate HR WhatsApp/Slack inquiries",
      ],
      idealFor: "Teams of 5 to 50 employees looking to automate operations from Day 1.",
    },
    {
      id: "smb",
      badge: "50 - 250 Employees",
      name: "For Growing Small & Mid-Sized Businesses",
      tagline: "Attendance Synchronization & Multi-Tier Approvals",
      desc: "Bridge the gap between operational time tracking and finance disbursals. Seamlessly absorb clock logs, approve multi-tier leave requests, and lock versioned payroll cycles.",
      icon: TrendingUp,
      accentColor: "from-cyan-500 to-teal-400",
      highlights: [
        "Biometric and web punch synchronization for shift tracking",
        "Role-Based Access Control (Admin operators vs Employee members)",
        "Automated salary breakdown with basic, HRA, and custom allowances",
        "Comprehensive statutory ledger ready for monthly ECR and Form 5A filing",
      ],
      idealFor: "Growing organizations upgrading from fragile spreadsheets or legacy desktop software.",
    },
    {
      id: "enterprise",
      badge: "250+ Employees",
      name: "For Mid-Market & Enterprise Organizations",
      tagline: "Immutable Auditing, Version Locking & Gemini Copilot",
      desc: "Enterprise-grade governance with cryptographic session security, immutable payroll revisions, and AI-powered variance auditing across diverse departments and cost centers.",
      icon: Building,
      accentColor: "from-blue-500 to-indigo-600",
      highlights: [
        "Versioned immutable snapshot archival with zero retroactive tampering",
        "Google Gemini Copilot auditing month-over-month department variances",
        "Multi-state Professional Tax management (Karnataka, Maharashtra, etc.)",
        "Sensitive credential vaulting for PAN, Aadhaar, and bank account numbers",
      ],
      idealFor: "Enterprises needing robust audit compliance and data integrity.",
    },
    {
      id: "finance",
      badge: "Finance & CAs",
      name: "For Finance Directors & Chartered Accountants",
      tagline: "100% Deterministic Gross-to-Net Calculations",
      desc: "Eliminate reconciliation discrepancies. Every statutory withholding and deduction ceiling is calculated using strict deterministic formulas matching Indian gazetted rules.",
      icon: Landmark,
      accentColor: "from-purple-500 to-blue-600",
      highlights: [
        "Deterministic wage ceiling capping (₹1,800/mo max on PF wage ceiling)",
        "ESIC eligibility threshold checks with automated wage limits",
        "Export-ready challan summaries for EPFO ECR and ESIC filings",
        "Granular variance reports flagging mid-cycle compensation revisions",
      ],
      idealFor: "Chief Financial Officers, Finance Controllers, and External Payroll Advisors.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D19] text-slate-900 dark:text-white transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden pt-28 pb-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[450px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Workforce Solutions</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Engineered for Every Stage of Indian Growth.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Whether you are issuing your first five employee payslips or orchestrating compensation for a multi-department enterprise, IndiaPay adapts to your exact operational complexity.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all"
            >
              <span>Schedule Solutions Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <span>Explore Indicative Pricing</span>
            </Link>
          </div>
        </div>

        {/* 4 Solutions Deep Dive */}
        <div className="space-y-12 mb-20">
          {solutions.map((sol, index) => {
            const Icon = sol.icon;
            return (
              <div
                key={sol.id}
                id={sol.id}
                className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none p-6 sm:p-10 backdrop-blur-xl hover:border-cyan-500/30 transition-all shadow-xl shadow-black/60"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  {/* Left Column: Solution Detail */}
                  <div className="lg:max-w-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${sol.accentColor} text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                          {sol.badge}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                          {sol.name}
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {sol.tagline}
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
                      {sol.desc}
                    </p>

                    <div className="pt-2">
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold mb-3 uppercase tracking-wider">
                        Key Capabilities:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sol.highlights.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Target Card & Action */}
                  <div className="lg:w-80 shrink-0 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] p-6 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold block mb-2">
                        Designed Specifically For
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {sol.idealFor}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] space-y-3">
                      <Link
                        href="/talk-to-us"
                        className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center block hover:opacity-95 shadow-md shadow-blue-600/30 transition-all"
                      >
                        Talk to an Advisor
                      </Link>
                      <Link
                        href="/features"
                        className="w-full py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-white text-center block transition-colors"
                      >
                        View Module Specifications &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Cross-Reference */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-slate-50 dark:bg-[#070B16] border border-slate-200 dark:border-white/[0.08] p-8 sm:p-12 text-center mb-20">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Comprehensive Feature Matrix
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-4">
            Looking for Granular Feature Capabilities?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Explore dedicated technical breakdowns of our nine core engines: Payroll, Employees, Attendance, Leaves, Statutory Compliance, Payslips, Self-Service, Analytics, and Gemini AI.
          </p>

          <Link
            href="/features"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all"
          >
            <span>Explore All Nine Modules</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}




