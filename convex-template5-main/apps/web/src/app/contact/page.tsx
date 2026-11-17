"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Building2,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  FileQuestion,
  Users,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Product Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D19] text-slate-900 dark:text-white transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden pt-28 pb-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[450px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support & General Inquiries</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Get in Touch With IndiaPay.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Have questions about statutory compliance, enterprise procurement, technical integrations, or partnership opportunities? We are here to help.
          </p>

          {/* Differentiating Banner */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300">
            <span>Looking specifically to see a live product walkthrough?</span>
            <Link href="/talk-to-us" className="text-cyan-400 font-semibold underline hover:text-cyan-300">
              Schedule a Demo instead &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-start">
          {/* Left Column: Direct Communication Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white dark:bg-[#0A1020]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none shadow-sm dark:shadow-none p-6 sm:p-8 space-y-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Communication Channels</span>
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] border border-slate-200 dark:border-white/[0.06]">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">General & Support Inquiries</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      support@indiapaypayroll.com
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] border border-slate-200 dark:border-white/[0.06]">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">Corporate Headquarters</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      Bengaluru &bull; Karnataka, India
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] border border-slate-200 dark:border-white/[0.06]">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">Operational Response Hours</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      Mon – Fri, 9:00 AM – 6:30 PM IST
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
                  Existing IndiaPay customers can also access live support directly through the authenticated admin workspace dashboard.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-5 space-y-2">
              <div className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                Enterprise Procurement & RFP
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-400 leading-relaxed">
                If your organization requires customized master service agreements, security vendor questionnaires, or NDA execution prior to discussions, please select "Enterprise Procurement" in the inquiry form.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.12] bg-[#0A1022]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Message Dispatched Successfully!
                  </h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{formData.name || "there"}</strong>. We have received your inquiry regarding <em>{formData.subject}</em>. An IndiaPay representative will reply to <strong>{formData.email}</strong> shortly.
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
                    Send an Inquiry Message
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Ramesh Patel"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="ramesh@company.in"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Inquiry Category *
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-[#0A1020] px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="Product Inquiry">Product & Feature Inquiries</option>
                      <option value="Statutory & Compliance">Statutory & Labor Code Compliance Questions</option>
                      <option value="Enterprise Procurement">Enterprise Procurement & MSA Review</option>
                      <option value="Partnership / CA Alliance">Chartered Accountant / Partner Alliances</option>
                      <option value="General Support">General Support & Technical Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Detailed Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Please let us know how we can assist you..."
                      className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




