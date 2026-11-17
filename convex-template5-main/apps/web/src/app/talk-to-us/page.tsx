"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Clock,
  Send,
} from "lucide-react";

export default function TalkToUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    headcount: "25-100",
    currentTool: "Spreadsheets",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D19] text-slate-900 dark:text-white transition-colors duration-200 pt-28 pb-20 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Platform Walkthrough</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Schedule an Enterprise Demo
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-300">
            See how IndiaPay calculates statutory payroll with mathematical precision, automates pro-rated Loss of Pay (LOP), and streamlines employee self-service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Enterprise Benefits */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                What We Will Walk You Through:
              </h2>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>1-Click Payroll Run:</strong> Generating 100% deterministic gross-to-net calculations across all your employees.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Statutory Ceiling Limits:</strong> Automated enforcement of EPFO ₹1,800/mo cap, ESIC ₹21k eligibility, and state PT slabs.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gemini AI Copilot:</strong> Live variance detection, audit explanations, and instant policy inquiry resolution.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Employee Self-Service:</strong> PDF payslip dispatch and transparent leave balance ledgers.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400 font-semibold">
                RAPID 48-HOUR ONBOARDING
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
                Migrate historical employee payroll and CTC structures from spreadsheets or legacy software with dedicated engineering support.
              </p>
            </div>
          </div>

          {/* Right Column: Demo Request Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.12] bg-[#0A1022]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Demo Request Received!
                  </h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{formData.name || "there"}</strong>. An IndiaPay enterprise payroll specialist will contact you at <strong>{formData.email}</strong> within 2 hours to confirm your scheduled sandbox walkthrough.
                  </p>
                  <div className="pt-6">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/10 transition-all"
                    >
                      Return to Homepage
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Request a Customized Demonstration
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Priya Sharma"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="priya@company.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        placeholder="e.g. TechCorp India Pvt Ltd"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Headcount Tier *
                      </label>
                      <select
                        value={formData.headcount}
                        onChange={(e) =>
                          setFormData({ ...formData, headcount: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-[#0A1020] px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="1-25">1 – 25 Employees</option>
                        <option value="25-100">25 – 100 Employees</option>
                        <option value="100-500">100 – 500 Employees</option>
                        <option value="500+">500+ Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Current Payroll / HR System
                    </label>
                    <select
                      value={formData.currentTool}
                      onChange={(e) =>
                        setFormData({ ...formData, currentTool: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-[#0A1020] px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="Spreadsheets">Spreadsheets (Excel / Google Sheets)</option>
                      <option value="greythr">greytHR</option>
                      <option value="keka">Keka</option>
                      <option value="darwinbox">Darwinbox</option>
                      <option value="outsourced">Outsourced CA / Payroll Firm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Additional Requirements or Specific Workflows
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="e.g. Dual TDS regime handling, multi-branch professional tax slabs, custom shift overtime rules..."
                      className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Demo Request</span>
                  </button>

                  <p className="text-[11px] text-slate-500 text-center font-mono">
                    Zero spam guaranteed. We only use your email to schedule the walkthrough.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




