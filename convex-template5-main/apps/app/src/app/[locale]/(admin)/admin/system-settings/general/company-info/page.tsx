"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Globe,
  HelpCircle,
  Save,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CompanyInfoPage() {
  const [showHelp, setShowHelp] = useState(true);
  const companyData = useQuery(api.systemSettings.getCompanySettings);
  const updateSettings = useMutation(api.systemSettings.updateCompanySettings);

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [states, setStates] = useState("Karnataka");
  const [industry, setIndustry] = useState(
    "Information Technology & Software Services",
  );
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [pfNo, setPfNo] = useState("");
  const [tanNo, setTanNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [esiNo, setEsiNo] = useState("");
  const [linNo, setLinNo] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [regCertNo, setRegCertNo] = useState("");
  const [twitter, setTwitter] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (companyData) {
      setCompanyName(companyData.companyName || "");
      setCompanyAddress(companyData.companyAddress || "");
      setCountry(companyData.country || "India");
      setStates(companyData.states || "Karnataka");
      setIndustry(
        companyData.industry || "Information Technology & Software Services",
      );
      setTimezone(companyData.timezone || "Asia/Kolkata");
      setCurrency(companyData.currency || "INR");
      setPfNo(companyData.pfNo || "");
      setTanNo(companyData.tanNo || "");
      setPanNo(companyData.panNo || "");
      setEsiNo(companyData.esiNo || "");
      setLinNo(companyData.linNo || "");
      setGstNo(companyData.gstNo || "");
      setRegCertNo(companyData.registrationCertificateNo || "");
      setTwitter(companyData.twitterHandle || "");
    }
  }, [companyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setFeedback({ type: "error", text: "Company Name is required." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        country,
        states,
        industry,
        timezone,
        currency,
        pfNo: pfNo.trim() || undefined,
        tanNo: tanNo.trim() || undefined,
        panNo: panNo.trim() || undefined,
        esiNo: esiNo.trim() || undefined,
        linNo: linNo.trim() || undefined,
        gstNo: gstNo.trim() || undefined,
        registrationCertificateNo: regCertNo.trim() || undefined,
        twitterHandle: twitter.trim() || undefined,
      });
      setFeedback({
        type: "success",
        text: "Company settings updated successfully.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update company settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin" className="hover:text-blue-600 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span>System Settings</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Company Settings</span>
      </div>

      {/* Help Banner matching greytHR */}
      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">Company Settings</p>
              <p className="text-sky-800 leading-relaxed">
                Explore the Company Settings page with help doc and faqs.
                Configure your registered enterprise details, official address,
                statutory identifiers (PF, ESI, PAN, TAN, GST), logo, and brand
                signature.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline"
          >
            <span>Hide Help</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold shadow-sm transition ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span>General Information</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. IndiaPay Technologies Private Limited"
                required
              />
            </div>

            {/* Company Address */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Company Address
              </label>
              <textarea
                rows={3}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="Registered business address..."
              />
            </div>

            {/* Country */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Country <span className="text-rose-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="India">India</option>
                <option value="United Arab Emirates">
                  United Arab Emirates
                </option>
                <option value="Singapore">Singapore</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            {/* States */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                States
              </label>
              <select
                value={states}
                onChange={(e) => setStates(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Delhi">Delhi</option>
                <option value="Telangana">Telangana</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Industry <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Information Technology"
              />
            </div>

            {/* Time Zone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Time Zone <span className="text-rose-500">*</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
                <option value="Asia/Dubai">(UTC+04:00) Asia/Dubai</option>
                <option value="Asia/Singapore">
                  (UTC+08:00) Asia/Singapore
                </option>
                <option value="Europe/London">(UTC+00:00) Europe/London</option>
                <option value="America/New_York">
                  (UTC-05:00) America/New_York
                </option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Currency <span className="text-rose-500">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="INR">Indian Rupee [INR]</option>
                <option value="USD">US Dollar [USD]</option>
                <option value="EUR">Euro [EUR]</option>
                <option value="AED">UAE Dirham [AED]</option>
                <option value="GBP">British Pound [GBP]</option>
              </select>
            </div>

            {/* PF No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                PF No
              </label>
              <input
                type="text"
                value={pfNo}
                onChange={(e) => setPfNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. BGMBN0012345000"
              />
            </div>

            {/* TAN No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                TAN No
              </label>
              <input
                type="text"
                value={tanNo}
                onChange={(e) => setTanNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. BLRI09876E"
              />
            </div>

            {/* PAN No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                PAN No
              </label>
              <input
                type="text"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. AABCI9876C"
              />
            </div>

            {/* ESI No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ESI No
              </label>
              <input
                type="text"
                value={esiNo}
                onChange={(e) => setEsiNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. 53000987650000999"
              />
            </div>

            {/* LIN No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                LIN No
              </label>
              <input
                type="text"
                value={linNo}
                onChange={(e) => setLinNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. 1892837465"
              />
            </div>

            {/* GST No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                GST No
              </label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. 29AABCI9876C1Z8"
              />
            </div>

            {/* Registration Certificate No */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Registration Certificate No
              </label>
              <input
                type="text"
                value={regCertNo}
                onChange={(e) => setRegCertNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. U72200KA2023PTC123456"
              />
            </div>

            {/* Twitter Handle */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Twitter Handle
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. @IndiaPayHR"
              />
            </div>
          </div>
        </div>

        {/* Branding & Logo Upload Section matching greytHR */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900">
              Company Branding
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="font-bold text-slate-700 mb-1">Company Logo</p>
              <p className="text-[11px] text-slate-400 mb-3">
                Logo dimensions to be 210 x 70 pixels (max 2MB). GIF, JPG and
                PNG file formats are supported.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-400" />
                  <span>Upload Logo</span>
                </button>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-700 mb-1">Signature Upload</p>
              <p className="text-[11px] text-slate-400 mb-3">
                Authorized signatory image for payslips and letters. PNG
                transparent format recommended.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-400" />
                  <span>Upload Signature</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
