"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmployeeHeader } from "../../employee-header";

export default function EmployeeProfilePage() {
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

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "employment" | "contact"
  >("personal");

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader
        currentCategory="information"
        currentPageTitle="Employee Profile"
      />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        {/* Profile Header Banner */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xl font-bold border border-sky-200">
                {selectedEmployee?.firstName?.charAt(0) || "E"}
                {selectedEmployee?.lastName?.charAt(0) || ""}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedEmployee?.firstName}{" "}
                    {selectedEmployee?.lastName || ""}
                  </h2>
                  <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold border border-emerald-200">
                    {selectedEmployee?.status || "Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedEmployee?.designation || "Software Engineer"} &bull;{" "}
                  {selectedEmployee?.department || "Technology"}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {selectedEmployee?.employeeIdNumber || "EMP-001"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Edit className="h-3.5 w-3.5" />
                {isEditing ? "Save Profile" : "Edit Profile"}
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-4 border-t border-slate-100 mt-5 pt-3 text-xs">
            {(["personal", "employment", "contact"] as const).map((tab) => (
              <button type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize pb-1 font-semibold transition border-b-2 ${
                  activeTab === tab
                    ? "border-sky-600 text-sky-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab} Information
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Cards */}
        {activeTab === "personal" && (
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">First Name</span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.firstName || "Arun"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Last Name</span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.lastName || "Kumar"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-medium text-slate-800">Male</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Date of Birth
                </span>
                <span className="font-medium text-slate-800">15-Aug-1992</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Marital Status
                </span>
                <span className="font-medium text-slate-800">Single</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Blood Group</span>
                <span className="font-medium text-slate-800">O+</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "employment" && (
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Employment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Department</span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.department || "Engineering"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Designation</span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.designation || "Staff Engineer"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Joining Date
                </span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.joiningDate || "01-Apr-2024"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Employment Type
                </span>
                <span className="font-medium text-slate-800">
                  Permanent (Full-time)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Probation Period
                </span>
                <span className="font-medium text-slate-800">Confirmed</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Location</span>
                <span className="font-medium text-slate-800">
                  Bangalore (HQ)
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Contact &amp; Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Official Email
                </span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.email || "arun@abc.com"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Personal Mobile
                </span>
                <span className="font-medium text-slate-800">
                  {selectedEmployee?.phone || "+91 98765 43210"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  City / State
                </span>
                <span className="font-medium text-slate-800">
                  Bangalore, Karnataka
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
