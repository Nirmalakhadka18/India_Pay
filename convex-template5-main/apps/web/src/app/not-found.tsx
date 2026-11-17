import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080D19] text-white flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-cyan-400 mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400 mb-2">
        Error 404 &bull; Page In Progress
      </span>

      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-xl">
        This Page Is Being Deployed
      </h1>

      <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-md leading-relaxed">
        We are actively expanding IndiaPay's enterprise marketing suite. The requested section is queued for deployment in the next sprint phase.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:opacity-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>

        <Link
          href="/talk-to-us"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <span>Schedule Demo</span>
        </Link>
      </div>
    </div>
  );
}
