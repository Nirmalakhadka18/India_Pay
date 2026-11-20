"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmployeeHeader } from "../../employee-header";

export default function BankPfEsiPage() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("id");
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const selectedEmployee =
    (employees ?? []).find((e) => e._id === employeeId) || employees?.[0];

  const [showMasked, setShowMasked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader
        currentCategory="information"
        currentPageTitle="Bank/PF/ESI Details"
      />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        {/* Banner */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Statutory, Banking &amp; Identity Records
            </h2>
            <p className="text-xs text-slate-500">
              For {selectedEmployee?.firstName}{" "}
              {selectedEmployee?.lastName || ""} (
              {selectedEmployee?.employeeIdNumber || "EMP-001"})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMasked(!showMasked)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              {showMasked ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {showMasked ? "Hide Sensitive Data" : "Reveal Numbers"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0284C7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0369A1] transition shadow-2xs"
            >
              <Edit className="h-3.5 w-3.5" />
              {isEditing ? "Save Records" : "Edit Records"}
            </button>
          </div>
        </div>

        {/* Section 1: Banking Details */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Landmark className="h-4 w-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Bank Account Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Bank Name</span>
              <span className="font-semibold text-slate-800">
                {selectedEmployee?.bankName || "HDFC Bank"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">
                Account Number
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {showMasked
                  ? selectedEmployee?.bankAccountNumber || "50100234567890"
                  : `••••••••${selectedEmployee?.bankAccountNumber?.slice(-4) || "7890"}`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">IFSC Code</span>
              <span className="font-mono font-semibold text-slate-800">
                {selectedEmployee?.ifscCode || "HDFC0001234"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Payment Mode</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Bank Transfer (NEFT/RTGS)
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory & PF / ESI */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Registrations (EPFO, ESIC, Income Tax)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">PAN Number</span>
              <span className="font-mono font-semibold text-slate-800">
                {showMasked
                  ? selectedEmployee?.pan || "ABCDE1234F"
                  : `••••••${selectedEmployee?.pan?.slice(-4) || "1234F"}`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">
                Universal Account Number (UAN)
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {showMasked
                  ? selectedEmployee?.uan || "101234567890"
                  : `••••••••${selectedEmployee?.uan?.slice(-4) || "7890"}`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">PF Member ID</span>
              <span className="font-mono font-semibold text-slate-800">
                {selectedEmployee?.pfMemberId || "KN/BNG/0012345/000/0129"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">
                ESI Insurance Number
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {selectedEmployee?.esicIpNumber || "31-00-123456-000-0001"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
