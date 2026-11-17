import type { Metadata } from "next";
import Link from "next/link";
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
  ArrowRight,
  CheckCircle2,
  Layers,
  Shield,
  FileText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Complete Product Features — All Nine IndiaPay Modules",
  description:
    "Comprehensive technical breakdown of IndiaPay's nine workforce modules: Payroll Engine, Employee Lifecycle, Attendance Tracking, Leaves, Statutory Compliance, PDF Payslips, Self-Service, Analytics, and Gemini AI.",
};

export default function FeaturesPage() {
  const modules = [
    {
      id: "payroll",
      icon: Calculator,
      title: "Payroll Management",
      badge: "Core Engine",
      headline: "Deterministic Gross-to-Net Computation",
      summary:
        "Execute end-to-end payroll runs with mathematical precision. Configurable basic salary, HRA, special allowances, custom bonuses, and automated deduction ceilings.",
      features: [
        "1-click batch payroll execution across entire organization",
        "Deterministic CTC component rules (Basic, HRA, Special Allowance)",
        "Automated mid-month joiner and exit pro-rating",
        "Lockable immutable payroll snapshots with full versioning",
      ],
      details: [
        { label: "Execution Speed", value: "Instantaneous batch runs" },
        { label: "Formula Type", value: "Pure deterministic pipeline" },
        { label: "Snapshot Lock", value: "Tamper-proof versioning" },
      ],
    },
    {
      id: "employees",
      icon: Users,
      title: "Employee Directory & KYC",
      badge: "Workforce",
      headline: "Single Source of Truth for Personnel Data",
      summary:
        "Maintain comprehensive employee profiles with PAN, Aadhaar, UAN, ESIC IP numbers, bank routing details, and organizational reporting lines.",
      features: [
        "Structured KYC & identity management with secure vaulting",
        "Department, designation, and reporting manager hierarchy",
        "Role-governed data isolation (Admin operators vs Member self-service)",
        "Compensation revision history with active dates",
      ],
      details: [
        { label: "Security", value: "Encrypted credential vault" },
        { label: "Access Boundary", value: "Strict RBAC enforcement" },
        { label: "Export Formats", value: "CSV & Master Excel" },
      ],
    },
    {
      id: "attendance",
      icon: CalendarCheck,
      title: "Attendance & Time Tracking",
      badge: "Time & Punch",
      headline: "Real-Time Tracking & Pro-Rated LOP",
      summary:
        "Seamlessly monitor daily check-ins, working hours, and absences. Days marked absent directly flow into pro-rated payroll loss-of-pay deductions.",
      features: [
        "Daily punch-in and punch-out logging with work duration calculation",
        "Automatic Loss-of-Pay (LOP) computation based on working day standards",
        "Monthly calendar configuration (working days vs statutory holidays)",
        "Direct synchronization with gross earnings prior to payroll locking",
      ],
      details: [
        { label: "LOP Formula", value: "Daily Rate = Monthly Gross / Working Days" },
        { label: "Sync Mode", value: "Automatic pre-run ingestion" },
        { label: "Dispute Flagging", value: "Visual anomaly indicators" },
      ],
    },
    {
      id: "leaves",
      icon: Plane,
      title: "Leave Administration",
      badge: "Time Off",
      headline: "Granular Quotas & Approval Workflows",
      summary:
        "Empower employees to request leaves with transparent balances across Casual, Sick, and Earned Leave. Managers review and approve in one click.",
      features: [
        "Configurable leave quotas (12 Casual, 12 Sick, Earned/Privilege Leave)",
        "Multi-tier manager review and status tracking",
        "Transparent balance deduction ledgers updated in real time",
        "Automatic reconciliation with monthly attendance logs",
      ],
      details: [
        { label: "Leave Types", value: "Casual, Sick, Earned/PL" },
        { label: "Carry Forward", value: "Configurable annual policy" },
        { label: "Approvals", value: "1-Click Admin/Manager Action" },
      ],
    },
    {
      id: "compliance",
      icon: Scale,
      title: "Statutory Compliance",
      badge: "Regulatory",
      headline: "EPFO, ESIC, Professional Tax & TDS",
      summary:
        "Stay aligned with EPFO (12% employee + 12% employer), ESIC (0.75% + 3.25%), state-specific Professional Tax slabs, and dual TDS tax regimes.",
      features: [
        "Statutory wage ceiling enforcement (₹15,000 PF basic with ₹1,800 cap)",
        "ESIC eligibility threshold automation (₹21,000 monthly gross)",
        "State Professional Tax (PT) calculations (Karnataka Form 5A, etc.)",
        "Challan preview & export readiness for official portal submissions",
      ],
      details: [
        { label: "EPFO Ceiling", value: "₹1,800/mo cap enforced" },
        { label: "ESIC Split", value: "0.75% employee + 3.25% employer" },
        { label: "PT Slabs", value: "State gazetted schedules" },
      ],
    },
    {
      id: "payslips",
      icon: FileSpreadsheet,
      title: "Payslip Generation",
      badge: "Disbursement",
      headline: "Branded, Tamper-Evident Vector PDFs",
      summary:
        "Generate compliant, formatted payslips featuring itemized earnings, statutory withholdings, attendance summaries, and company branding.",
      features: [
        "Vector PDF generation with crisp corporate layout",
        "Itemized earnings vs deductions reconciliation",
        "Indian currency grouping & automated words conversion",
        "One-click authenticated employee self-service download",
      ],
      details: [
        { label: "Format", value: "Standard PDF 1.4 Vector" },
        { label: "Masking", value: "Bank account & PAN masked" },
        { label: "Historical Vault", value: "Per-employee archived slips" },
      ],
    },
    {
      id: "self-service",
      icon: UserCheck,
      title: "Employee Self-Service",
      badge: "Member Portal",
      headline: "Empower Your Workforce With Autonomy",
      summary:
        "Give your workforce a modern web portal to view recent payslips, track leave balances, review attendance punches, and query salary components.",
      features: [
        "Personal compensation breakdown view with itemized allowances",
        "Leave request submission & balance tracking",
        "Daily attendance punch verification",
        "Role-isolated access restricting employee views to their personal data",
      ],
      details: [
        { label: "Access Level", value: "Member Role Boundary" },
        { label: "Availability", value: "24/7 Web Application" },
        { label: "Mobile Responsive", value: "Full smartphone support" },
      ],
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Payroll Analytics & Insights",
      badge: "Intelligence",
      headline: "Real-Time Headcount & Spend Visibility",
      summary:
        "Gain instant visibility into organizational compensation spend, department allocations, monthly variance anomalies, and statutory outflow.",
      features: [
        "Gross CTC vs Net payout trend analysis over time",
        "Department-wise payroll cost distribution",
        "Month-over-month variance detection flagging compensation shifts",
        "Tax & compliance expenditure reporting for executive leadership",
      ],
      details: [
        { label: "Cost Allocation", value: "Department & Team Slices" },
        { label: "Variance Audit", value: "Automated delta detection" },
        { label: "Reporting", value: "Executive Summary Charts" },
      ],
    },
    {
      id: "ai-assistant",
      icon: Sparkles,
      title: "Gemini AI Payroll Assistant",
      badge: "AI Powered",
      headline: "Next-Gen Conversational Payroll Intelligence",
      summary:
        "Integrated directly with Google Gemini to summarize payroll runs, identify variance anomalies, and answer employee questions regarding deductions.",
      features: [
        "Streaming conversational AI interface built into dashboard",
        "Instant payroll run audit summaries (headcount, LOP, net disbursals)",
        "Natural language policy explanations (statutory caps, leave carry-forward)",
        "Variance anomaly detection across consecutive pay cycles",
      ],
      details: [
        { label: "Model Core", value: "Google Gemini 2.5 / Flash" },
        { label: "Context Window", value: "Deterministic policy boundaries" },
        { label: "Latency", value: "Real-time streaming responses" },
      ],
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
            <Layers className="w-3.5 h-3.5" />
            <span>Product Modules & Specifications</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Nine Comprehensive Engines. One Unified Platform.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Every module in IndiaPay is purpose-built to address Indian workforce realities, statutory mandates, and modern self-service expectations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all"
            >
              <span>Book an Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/platform"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <span>View Platform Architecture</span>
            </Link>
          </div>
        </div>

        {/* 9 Modules Deep Grid */}
        <div className="space-y-12 mb-20">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                id={m.id}
                className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none p-6 sm:p-10 backdrop-blur-xl hover:border-cyan-500/30 transition-all shadow-xl shadow-black/60"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  {/* Left Column: Details */}
                  <div className="lg:max-w-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                          {m.badge}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                          {m.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {m.headline}
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
                      {m.summary}
                    </p>

                    <div className="pt-2">
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold mb-3 uppercase tracking-wider">
                        Engine Capabilities:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {m.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Technical Specs */}
                  <div className="lg:w-80 shrink-0 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] p-6 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-3">
                        Technical Specifications
                      </span>
                      <div className="space-y-3">
                        {m.details.map((d, idx) => (
                          <div key={idx} className="border-b border-white/[0.04] pb-2 last:border-b-0">
                            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase">
                              {d.label}
                            </div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                              {d.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                      <Link
                        href="/talk-to-us"
                        className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center block hover:opacity-95 shadow-md shadow-blue-600/30 transition-all"
                      >
                        Request Module Demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-slate-50 dark:bg-[#070B16] border border-slate-200 dark:border-white/[0.08] p-8 sm:p-12 text-center mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to See These Nine Modules in Action?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Join hundreds of forward-thinking Indian operations teams that have simplified payroll and workforce management with IndiaPay.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="px-8 py-3.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all"
            >
              Book an Enterprise Walkthrough
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-100 dark:bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-white transition-all"
            >
              Review Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




