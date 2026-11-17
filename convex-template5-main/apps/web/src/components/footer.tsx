import Link from "next/link";
import { Shield, Lock, FileCheck, ArrowRight, Heart } from "lucide-react";
import { FooterTrustBento } from "./footer-trust-bento";

export function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-[#050811] border-t border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 font-sans transition-colors duration-200">
      {/* 5-Card Trust Bento Strip inspired by Networkers Home */}
      <FooterTrustBento />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-200 dark:border-white/[0.06]">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
                IP
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                India<span className="text-blue-600 dark:text-cyan-400">Pay</span>
              </span>
            </Link>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              India's unified workforce and payroll platform. Automating statutory compliance, loss-of-pay deductions, and employee operations with enterprise precision.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>EPFO & ESIC Ready</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Immutable Payroll Snapshots</span>
              </span>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/platform" className="hover:text-cyan-400 transition-colors">
                  Payroll Processing Engine
                </Link>
              </li>
              <li>
                <Link href="/platform#compliance" className="hover:text-cyan-400 transition-colors">
                  Statutory Deductions (PF/ESI)
                </Link>
              </li>
              <li>
                <Link href="/platform#attendance" className="hover:text-cyan-400 transition-colors">
                  Attendance & LOP
                </Link>
              </li>
              <li>
                <Link href="/platform#leaves" className="hover:text-cyan-400 transition-colors">
                  Leave Management
                </Link>
              </li>
              <li>
                <Link href="/platform#payslips" className="hover:text-cyan-400 transition-colors">
                  Vector PDF Payslips
                </Link>
              </li>
              <li>
                <Link href="/platform#ai" className="hover:text-cyan-400 transition-colors">
                  Gemini AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Solutions
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/solutions#startups" className="hover:text-cyan-400 transition-colors">
                  Indian Startups
                </Link>
              </li>
              <li>
                <Link href="/solutions#smb" className="hover:text-cyan-400 transition-colors">
                  Growing SMBs
                </Link>
              </li>
              <li>
                <Link href="/solutions#enterprise" className="hover:text-cyan-400 transition-colors">
                  Enterprises & Conglomerates
                </Link>
              </li>
              <li>
                <Link href="/solutions#finance" className="hover:text-cyan-400 transition-colors">
                  Finance & CA Teams
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-cyan-400 transition-colors">
                  Indicative Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Company
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  About IndiaPay
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  Book a Product Demo
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-cyan-400 transition-colors">
                  All Feature Modules
                </Link>
              </li>
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  <span>Sign In to App</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} IndiaPay Technologies. Designed and engineered for Indian workforce operations.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-6 text-center">
            <span>Illustrative Enterprise Demonstration</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-700" />
            <span>Built with Next.js 14 & Convex</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-slate-400 font-medium">Currency: INR (₹)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
