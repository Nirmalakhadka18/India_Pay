"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Phone, MapPin, Clock, ExternalLink } from "lucide-react";

export function TopAnnouncementBar() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="w-full text-[11px] sm:text-xs z-50">
      {/* Tier 1: Announcement Bar (Deep Brand Blue / Cyan Highlight) */}
      <div className="bg-[#0B3A82] dark:bg-[#071F4E] text-white px-3 sm:px-6 py-2 border-b border-white/10 font-sans">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-cyan-400/30">
              <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
              Statutory 2026 Ready
            </span>
            <span className="font-medium truncate text-slate-100">
              IndiaPay automated EPFO ECR generator & Form 5A Karnataka Professional Tax schedules active.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/talk-to-us"
              className="inline-flex items-center gap-1 font-semibold text-cyan-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              <span>Schedule Architecture Audit</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 2: Utility & Legitimacy Bar (Dark Slate / Near-Black) */}
      <div className="bg-[#040711] text-slate-400 px-3 sm:px-6 py-1.5 border-b border-white/[0.08] hidden md:block font-mono text-[11px]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Physical Presence & Support Metrics */}
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>HQ: BKC, Mumbai · Bengaluru NOC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Payroll SLA: 99.99% Deterministic</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>EPFO & ESIC Sync: Normal</span>
            </span>
          </div>

          {/* Quick Directives & Tools */}
          <div className="flex items-center gap-4">
            <Link href="/platform#compliance" className="hover:text-cyan-300 transition-colors">
              Statutory Ceilings (₹1,800 Cap)
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/pricing" className="hover:text-cyan-300 transition-colors">
              Indicative Pricing (₹45/mo)
            </Link>
            <span className="text-slate-700">|</span>
            <a
              href={`${appUrl}/login`}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>✦ Enterprise App Sign In</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
