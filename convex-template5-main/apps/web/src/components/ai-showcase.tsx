"use client";

import { useState } from "react";
import { Sparkles, Bot, User, ArrowRight, CheckCircle2, Shield, Terminal, Zap } from "lucide-react";

interface PromptScenario {
  id: string;
  query: string;
  title: string;
  response: string;
  metrics?: { label: string; value: string }[];
}

export function AIShowcase() {
  const scenarios: PromptScenario[] = [
    {
      id: "variance",
      title: "Variance & Run Audit",
      query: "Analyze October 2026 payroll run variance compared to September.",
      response:
        "October 2026 net disbursal totaled ₹1,92,000 across 4 active employees, reflecting a -₹2,000 (-1.03%) variance from September (₹1,94,000). The variance is entirely attributable to a 1-day Loss of Pay (LOP) deduction of ₹2,000 for employee IP-004 (Priya Sharma). Statutory PF deductions remained stable at ₹7,200 (₹1,800/employee ceiling cap). No unapproved salary revisions were detected.",
      metrics: [
        { label: "Net Payout", value: "₹1,92,000" },
        { label: "Variance", value: "-1.03% (LOP)" },
        { label: "Statutory PF", value: "₹7,200 (Locked)" },
      ],
    },
    {
      id: "lop",
      title: "LOP Computation Check",
      query: "How was the Loss of Pay calculated for Priya Sharma in October?",
      response:
        "Priya Sharma's Monthly Gross CTC is ₹52,000. In October 2026, standard working days were 26. Attendance logs confirmed 25 days present and 1 day unapproved absence. Pro-rated Daily Wage: ₹52,000 / 26 = ₹2,000/day. Net LOP deduction applied: ₹2,000. Gross earnings adjusted from ₹52,000 to ₹50,000 before computing statutory withholdings.",
      metrics: [
        { label: "Working Days", value: "26 Days" },
        { label: "Daily Rate", value: "₹2,000" },
        { label: "Deduction", value: "₹2,000" },
      ],
    },
    {
      id: "statutory",
      title: "EPFO & ESIC Compliance",
      query: "Verify if our PF and ESIC withholdings match current statutory ceilings.",
      response:
        "All calculations comply with EPFO 2026 guidelines. Under the Employees' Provident Funds Act, the statutory wage ceiling is ₹15,000/month. IndiaPay enforces the maximum 12% employee share cap of ₹1,800/month for salaries exceeding ₹15,000. For ESIC, employees with gross wages exceeding ₹21,000/month are correctly flagged as exempt from ESIC deductions.",
      metrics: [
        { label: "PF Employee Share", value: "12% (₹1,800 cap)" },
        { label: "PF Employer Share", value: "12% (3.67% + 8.33%)" },
        { label: "ESIC Wage Limit", value: "₹21,000 / mo" },
      ],
    },
    {
      id: "policy",
      title: "Employee Leave Query",
      query: "Explain casual leave carry-forward policy for fiscal year-end.",
      response:
        "Under IndiaPay company policy, employees are allocated 12 Casual Leaves (CL) and 12 Sick Leaves (SL) annually. Casual Leaves lapse at the close of the calendar year (December 31st) and cannot be encashed or carried forward. Earned/Privilege Leaves (PL) permit carry-forward up to a maximum accumulation limit of 30 days.",
      metrics: [
        { label: "CL Allocation", value: "12 Days / Yr" },
        { label: "Carry Forward", value: "Earned Leave Only" },
        { label: "Max Accrual", value: "30 Days" },
      ],
    },
  ];

  const [activeScenario, setActiveScenario] = useState<PromptScenario>(scenarios[0]!);

  return (
    <section id="ai-assistant" className="relative z-10 py-24 bg-[#080D19] overflow-hidden scroll-mt-24">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] h-[300px] sm:h-[400px] bg-gradient-to-tr from-blue-600/10 via-cyan-500/15 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Gemini 2.5 / Flash Powered</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Meet Your Intelligent Payroll Assistant
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Audit payroll variances, explain complex Indian statutory deductions, and answer employee salary inquiries in real-time with context-aware AI.
          </p>
        </div>

        {/* Interactive Showcase Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sample Scenarios / Queries */}
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Select an Operational Scenario:
            </p>
            {scenarios.map((sc) => {
              const isActive = sc.id === activeScenario.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isActive
                      ? "bg-[#0E1B38] border-cyan-500/50 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                      : "bg-[#0B1224]/70 border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.16]"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-white/[0.05] text-slate-400"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-semibold mb-1 ${
                        isActive ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {sc.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      "{sc.query}"
                    </p>
                  </div>
                </button>
              );
            })}

            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Zero Hallucination Guardrails</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                IndiaPay provides structured payroll snapshots and verified policy tables directly to Gemini. The model answers strictly within authorized company boundaries.
              </p>
            </div>
          </div>

          {/* Right Column: Simulated Chat Window */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.12] bg-[#0A1022]/95 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      IndiaPay Gemini Copilot
                    </h4>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Reasoning Engine
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.05]">
                  Mode: Context-Aware
                </span>
              </div>

              {/* Chat Thread */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* User Prompt */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-blue-600/30 border border-blue-500/40 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] text-xs text-white leading-relaxed">
                    <div className="text-[10px] font-mono text-cyan-300 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Admin Query
                    </div>
                    {activeScenario.query}
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm p-4 sm:p-5 text-xs text-slate-200 leading-relaxed space-y-4 max-w-[90%]">
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Against October 2026 Ledger
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                      {activeScenario.response}
                    </p>

                    {/* Extracted Metrics Strip */}
                    {activeScenario.metrics && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
                        {activeScenario.metrics.map((m, i) => (
                          <div key={i} className="bg-black/30 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-slate-400 font-mono">
                              {m.label}
                            </div>
                            <div className="text-xs font-bold text-cyan-300 mt-0.5">
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Window Footer / Prompt Input Preview */}
              <div className="border-t border-white/[0.08] p-3.5 bg-black/40 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" /> Powered by @google/genai & Convex Vector Engine
                </span>
                <span className="text-cyan-400 font-medium text-[11px]">
                  Real-time streaming enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
