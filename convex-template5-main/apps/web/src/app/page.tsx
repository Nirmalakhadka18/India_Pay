import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, ChevronRight, Calculator, CheckCircle2 } from "lucide-react";
import { HeroDashboardPreview } from "@/components/hero-dashboard-preview";
import { HeroFeatureBento } from "@/components/hero-feature-bento";
import { MetricsStrip } from "@/components/metrics-strip";
import { EditorialAsymmetricGrid } from "@/components/editorial-asymmetric-grid";
import { InteractiveFAQGrid } from "@/components/interactive-faq-grid";
import { TrustStrip } from "@/components/trust-strip";
import { ProblemSolution } from "@/components/problem-solution";
import { FeatureModules } from "@/components/feature-modules";
import { AIShowcase } from "@/components/ai-showcase";
import { HowItWorks } from "@/components/how-it-works";
import { SecurityCompliance } from "@/components/security-compliance";
import { CTASection } from "@/components/cta-section";

export default function HomePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D19] text-slate-900 dark:text-white transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden w-full">
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 overflow-hidden">
        {/* Subtle Ambient Background Grids & Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.22),rgba(255,255,255,0))] pointer-events-none -z-10" />
        <div className="absolute -top-[120px] inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#152035_1px,transparent_1px),linear-gradient(to_bottom,#152035_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 dark:opacity-30 pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full max-w-full overflow-hidden">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-xs font-medium text-slate-700 dark:text-slate-300 mb-6 sm:mb-8 backdrop-blur-md hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-colors max-w-full shadow-sm dark:shadow-none">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">India's Workforce.</span>
            <span className="text-blue-600 dark:text-cyan-400 truncate">One Intelligent Platform</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.15] font-sans break-words px-2">
            Payroll Shouldn't Be Complicated.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-cyan-300 dark:to-white bg-clip-text text-transparent">
              Your Workforce Deserves Better.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
            Manage payroll, automate HR operations, simplify statutory compliance, and empower employees with one intelligent platform built for Indian businesses.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/talk-to-us"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_30px_rgba(37,99,235,0.35)] transition-all hover:scale-[1.02]"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.12] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-blue-400 dark:hover:border-cyan-500/40 shadow-sm dark:shadow-none transition-all"
            >
              <span>Explore Platform</span>
            </a>
          </div>

          {/* Trust Highlights under CTA */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              EPFO ₹1,800 Cap Enforced
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              Automated LOP Deduction
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-blue-400" />
              Gemini AI Copilot
            </span>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-16 sm:mt-20">
            <HeroDashboardPreview />
          </div>

          {/* 3-Pillar Feature Bento inspired by Networkers Home */}
          <HeroFeatureBento />
        </div>
      </section>

      {/* 7-Column Institutional Metrics & Rules Strip */}
      <MetricsStrip />

      {/* Asymmetric 12-Column Editorial Grid */}
      <EditorialAsymmetricGrid />

      {/* Problem vs Solution */}
      <ProblemSolution />

      {/* Platform Capabilities (9 Feature Modules) */}
      <FeatureModules />

      {/* AI-Powered Payroll Section */}
      <AIShowcase />

      {/* How It Works (3 Steps) */}
      <HowItWorks />

      {/* Security & Compliance */}
      <SecurityCompliance />

      {/* Interactive Technical & Statutory FAQ Grid */}
      <InteractiveFAQGrid />

      {/* Final Conversion CTA */}
      <CTASection />
    </div>
  );
}
