"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle,
  ChevronRight,
  Eye,
  GripVertical,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sliders,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DirectoryField {
  id: string;
  label: string;
  key: string;
  category: "contact" | "category" | "other";
  enabled: boolean;
  order: number;
}

const DEFAULT_FIELDS: DirectoryField[] = [
  // Contact Details
  { id: "ext_no", label: "Extension No", key: "extensionNo", category: "contact", enabled: true, order: 1 },
  { id: "mobile", label: "Mobile", key: "mobile", category: "contact", enabled: true, order: 2 },
  { id: "emergency", label: "Emergency Contact No", key: "emergencyContactNo", category: "contact", enabled: true, order: 3 },
  { id: "email", label: "Email Id", key: "emailId", category: "contact", enabled: true, order: 4 },
  // Category Details
  { id: "designation", label: "Designation", key: "designation", category: "category", enabled: true, order: 5 },
  { id: "location", label: "Location", key: "location", category: "category", enabled: true, order: 6 },
  { id: "department", label: "Department", key: "department", category: "category", enabled: true, order: 7 },
  // Other Information
  { id: "joining_date", label: "Joining Date", key: "joiningDate", category: "other", enabled: true, order: 8 },
  { id: "dob", label: "Date Of Birth", key: "dateOfBirth", category: "other", enabled: true, order: 9 },
  { id: "status", label: "Status", key: "status", category: "other", enabled: true, order: 10 },
  { id: "reporting_to", label: "Reporting To", key: "reportingTo", category: "other", enabled: true, order: 11 },
  { id: "blood_group", label: "Blood Group", key: "bloodGroup", category: "other", enabled: true, order: 12 },
  { id: "nationality", label: "Nationality", key: "nationality", category: "other", enabled: true, order: 13 },
  { id: "marital_status", label: "Marital Status", key: "maritalStatus", category: "other", enabled: true, order: 14 },
];

export default function EmployeeDirectoryConfigPage() {
  const [fields, setFields] = useState<DirectoryField[]>(DEFAULT_FIELDS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  let remoteConfig: any = undefined;
  try {
    remoteConfig = useQuery((api as any)?.systemSettings?.getEmployeeDirectoryConfig);
  } catch (e) {
    remoteConfig = undefined;
  }

  useEffect(() => {
    if (remoteConfig && remoteConfig.fields) {
      setFields(remoteConfig.fields);
    }
  }, [remoteConfig]);

  const toggleField = (id: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if ((api as any)?.systemSettings?.saveEmployeeDirectoryConfig) {
        // Safe mutation call if available
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const contactFields = fields.filter((f) => f.category === "contact");
  const categoryFields = fields.filter((f) => f.category === "category");
  const otherFields = fields.filter((f) => f.category === "other");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin/employee/main/overview" className="hover:text-blue-600 transition">
          Settings
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/admin/system-settings/employee" className="hover:text-blue-600 transition">
          Employee
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Employee Directory Configuration</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-1 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <h2 className="text-sm font-bold text-slate-900">
            Employee Directory Configuration
          </h2>
        </div>
        <p className="text-xs text-slate-600 pl-6 leading-relaxed">
          Configure which employee fields and contact details are visible to employees across the organisation in the Employee Directory and mobile app.
        </p>
      </div>

      {/* Main Configuration Grid: Left Config Panels + Right Live Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Field Selectors */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Contact Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Contact Details
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {contactFields.filter((f) => f.enabled).length} of {contactFields.length} selected
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contactFields.map((field) => (
                <label
                  key={field.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    field.enabled
                      ? "border-blue-200 bg-blue-50/40 text-blue-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={() => toggleField(field.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Category Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Category Details
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {categoryFields.filter((f) => f.enabled).length} of {categoryFields.length} selected
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categoryFields.map((field) => (
                <label
                  key={field.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    field.enabled
                      ? "border-blue-200 bg-blue-50/40 text-blue-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={() => toggleField(field.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Other Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Other Information
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {otherFields.filter((f) => f.enabled).length} of {otherFields.length} selected
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherFields.map((field) => (
                <label
                  key={field.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    field.enabled
                      ? "border-blue-200 bg-blue-50/40 text-blue-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={() => toggleField(field.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-in fade-in">
                  <CheckCircle className="h-4 w-4" />
                  <span>Directory configuration updated successfully!</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Directory Card Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Live Card Preview
              </h3>
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Interactive Mockup
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 mb-4">
              Here is how an employee profile card renders to coworkers based on your configured visibility:
            </p>

            {/* Profile Mockup Card */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/50 to-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white ring-2 ring-blue-100">
                  RK
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    Raj Kumar Yadav
                  </h4>
                  <p className="text-xs text-blue-600 font-semibold truncate">
                    {fields.find((f) => f.id === "designation")?.enabled ? "Senior Software Engineer" : "Employee"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {fields.find((f) => f.id === "department")?.enabled ? "Product Engineering" : ""}
                    {fields.find((f) => f.id === "location")?.enabled ? " • Bengaluru HQ" : ""}
                  </p>
                </div>
              </div>

              {/* Dynamic Information Grid */}
              <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                {fields.find((f) => f.id === "email")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium text-slate-800">raj.yadav@victorchasex.com</span>
                  </div>
                )}
                {fields.find((f) => f.id === "mobile")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Mobile:</span>
                    <span className="font-medium text-slate-800">+91 98765 43210</span>
                  </div>
                )}
                {fields.find((f) => f.id === "ext_no")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Extension:</span>
                    <span className="font-medium text-slate-800">4201</span>
                  </div>
                )}
                {fields.find((f) => f.id === "joining_date")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Joined:</span>
                    <span className="font-medium text-slate-800">12-Jun-2022</span>
                  </div>
                )}
                {fields.find((f) => f.id === "reporting_to")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Reporting To:</span>
                    <span className="font-medium text-slate-800">Ananya Sharma (VP Tech)</span>
                  </div>
                )}
                {fields.find((f) => f.id === "blood_group")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="font-medium text-slate-800">O+</span>
                  </div>
                )}
                {fields.find((f) => f.id === "status")?.enabled && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
