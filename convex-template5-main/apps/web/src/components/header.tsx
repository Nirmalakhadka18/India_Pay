"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import {
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Calculator,
  Users,
  CalendarCheck,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  Lock,
  Building2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export function Header() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-[#080D19]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          : "bg-white/80 dark:bg-[#080D19]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/[0.04]"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-cyan-400/30 transition-all duration-300">
              <div className="w-full h-full bg-white dark:bg-[#080D19] rounded-[11px] flex items-center justify-center">
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-cyan-300 dark:to-white bg-clip-text text-transparent">
                  IP
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  India<span className="text-blue-600 dark:text-cyan-400">Pay</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/20">
                  Enterprise
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide hidden sm:block">
                Workforce & Payroll Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("platform")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === "platform"
                    ? "text-blue-600 dark:text-cyan-300 bg-slate-100 dark:bg-white/[0.04]"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03]"
                }`}
              >
                <span>Platform</span>
                <ChevronDown className="w-4 h-4 opacity-70 transition-transform duration-200" />
              </button>

              {activeDropdown === "platform" && (
                <div className="absolute top-full left-0 w-80 pt-2 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/[0.1] p-3 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 space-y-1">
                    <Link
                      href="/platform"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                          Payroll Engine
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          Multi-slab statutory engine with automated LOP deductions.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/platform#compliance"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                          Statutory Compliance
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          Instant EPFO ECR, ESIC challans, and Form 5A returns.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/platform#ai"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          Gemini AI Assistant
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          Natural language anomaly detection and salary analysis.
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("solutions")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeDropdown === "solutions"
                    ? "text-blue-600 dark:text-cyan-300 bg-slate-100 dark:bg-white/[0.04]"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03]"
                }`}
              >
                <span>Solutions</span>
                <ChevronDown className="w-4 h-4 opacity-70 transition-transform duration-200" />
              </button>

              {activeDropdown === "solutions" && (
                <div className="absolute top-full left-0 w-80 pt-2 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/[0.1] p-3 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 space-y-1">
                    <Link
                      href="/solutions#startups"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                          For Indian Startups
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          Launch payroll in minutes with statutory compliance presets.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/solutions#enterprise"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                          For Enterprises
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          Multi-state tax regimes, strict RBAC, and immutable audit logs.
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Links */}
            <Link
              href="/features"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
            >
              Features
            </Link>

            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
            >
              Pricing
            </Link>

            <Link
              href="/about"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
            >
              About Us
            </Link>

            <Link
              href="/contact"
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* CTA & Sign In */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />

            <a
              href="http://localhost:3000/login"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors flex items-center gap-1.5"
            >
              <span>Sign In</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <Link
              href="/contact"
              className="relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-xl group shadow-lg shadow-blue-500/20 hover:shadow-cyan-400/30 transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 group-hover:opacity-100 transition-opacity" />
              <span className="relative px-5 py-2.5 rounded-[11px] bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold flex items-center gap-2 group-hover:bg-opacity-90 transition-all">
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <a
              href="http://localhost:3000/login"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10"
            >
              Sign In
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 dark:bg-[#080D19]/98 border-b border-slate-200 dark:border-white/[0.08] backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="space-y-1">
            <Link
              href="/platform"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg"
            >
              Platform Overview
            </Link>
            <Link
              href="/solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg"
            >
              Solutions
            </Link>
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg"
            >
              Contact & Demo
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] space-y-2">
            <Link
              href="/talk-to-us"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-center block text-sm shadow-md shadow-blue-500/20"
            >
              Book a Demo
            </Link>
            <a
              href={`${appUrl}/login`}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 font-medium text-center block text-sm border border-slate-200 dark:border-white/10"
            >
              Sign In to Platform
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
