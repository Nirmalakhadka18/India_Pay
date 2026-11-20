"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  GitFork,
  Info,
  Loader2,
  Mail,
  Network,
  Search,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmployeeHeader } from "../../employee-header";

export default function OrgChartPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const [selectedDept, setSelectedDept] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const hierarchy = [
    {
      level: 1,
      role: "Managing Director & CEO",
      name: "Dev Owner",
      title: "Executive Leadership",
      email: "owner@indiapaypayroll.com",
      avatar: "DO",
      directReports: 3,
    },
    {
      level: 2,
      role: "Head of Engineering",
      name: "Arun Kumar",
      title: "Engineering & Technology",
      email: "arun@abc.com",
      avatar: "AK",
      directReports: 4,
    },
    {
      level: 2,
      role: "Lead HR Administrator",
      name: "Dev Admin",
      title: "People & Operations",
      email: "admin@indiapaypayroll.com",
      avatar: "DA",
      directReports: 2,
    },
    {
      level: 3,
      role: "Senior Software Engineer",
      name: "Nirmala Khadka",
      title: "Engineering",
      email: "khadkanirmala237@gmail.com",
      avatar: "NK",
      directReports: 0,
    },
    {
      level: 3,
      role: "Software Developer",
      name: "Vasanth Kumar",
      title: "Engineering",
      email: "vasanthkumar.p1512@gmail.com",
      avatar: "VK",
      directReports: 0,
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader
        currentCategory="main"
        currentPageTitle="Organization Chart"
      />

      {/* Org Chart Content */}
      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Organization Chart
            </h2>
            <p className="text-xs text-slate-500">
              Interactive visual reporting tree and department leadership
              hierarchy
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Total Nodes: 33</span>
          </div>
        </div>

        {/* Tree Canvas */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-2xs min-h-[460px] flex flex-col items-center">
          {/* Level 1: CEO */}
          <div className="flex flex-col items-center">
            <div className="w-64 rounded-lg border-2 border-sky-500 bg-sky-50/50 p-3 shadow-xs text-center transition hover:shadow-md">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-xs mb-2">
                DO
              </div>
              <h4 className="text-xs font-bold text-slate-900">Dev Owner</h4>
              <p className="text-[11px] font-medium text-sky-700">
                Managing Director &amp; CEO
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                3 Direct Reports
              </p>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="h-8 w-0.5 bg-slate-300" />
          </div>

          {/* Horizontal Level 2 Bus */}
          <div className="w-[480px] h-0.5 bg-slate-300 relative">
            <div className="absolute left-0 top-0 h-4 w-0.5 bg-slate-300" />
            <div className="absolute right-0 top-0 h-4 w-0.5 bg-slate-300" />
          </div>

          {/* Level 2: Directors / Department Heads */}
          <div className="flex items-start justify-between w-[560px] pt-4 gap-8">
            {/* Dept 1: Arun */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-60 rounded-lg border border-slate-200 bg-white p-3 shadow-xs text-center hover:border-sky-300 transition">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xs mb-1.5">
                  AK
                </div>
                <h4 className="text-xs font-bold text-slate-900">Arun Kumar</h4>
                <p className="text-[11px] text-slate-600">
                  Head of Engineering
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Engineering &amp; AI
                </p>
              </div>

              {/* Stem to Level 3 */}
              <div className="h-6 w-0.5 bg-slate-300" />

              {/* Subordinates */}
              <div className="w-56 rounded-md border border-slate-100 bg-slate-50/80 p-2.5 shadow-2xs text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center">
                    NK
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    Nirmala Khadka
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Full Stack Engineer
                </p>
              </div>
            </div>

            {/* Dept 2: Admin */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-60 rounded-lg border border-slate-200 bg-white p-3 shadow-xs text-center hover:border-sky-300 transition">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs mb-1.5">
                  DA
                </div>
                <h4 className="text-xs font-bold text-slate-900">Dev Admin</h4>
                <p className="text-[11px] text-slate-600">HR Administrator</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Human Resources
                </p>
              </div>

              {/* Stem to Level 3 */}
              <div className="h-6 w-0.5 bg-slate-300" />

              {/* Subordinates */}
              <div className="w-56 rounded-md border border-slate-100 bg-slate-50/80 p-2.5 shadow-2xs text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center">
                    HJ
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    Harsitha J
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">AI Specialist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
