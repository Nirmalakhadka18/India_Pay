"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye,
  EyeOff,
  FolderOpen,
  Info,
  Loader2,
  MapPin,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SubTab = "personal" | "accounts" | "family" | "employment";

export default function MyPortal() {
  const router = useRouter();
  const { current, workspaces } = useWorkspace();
  const currentWorkspace = workspaces.find((w) => w._id === current);
  const isHR =
    currentWorkspace?.role === "owner" || currentWorkspace?.role === "admin";

  const workspaceId = current;
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const linkMyAccount = useMutation(api.employees.linkMyAccount);

  const [activeTab, setActiveTab] = useState<SubTab>("personal");
  const [linkState, setLinkState] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [linkError, setLinkError] = useState("");

  // Reveal toggles for sensitive fields
  const [revealed, setRevealed] = useState<{
    phone?: boolean;
    dob?: boolean;
    bank?: boolean;
    pan?: boolean;
  }>({});

  // Expand / collapse section state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Modal states for Employment & Job
  const [showTimeline, setShowTimeline] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);

  // Address tab selection inside Personal
  const [addressType, setAddressType] = useState<"contact" | "permanent">(
    "contact",
  );

  const toggleReveal = (field: "phone" | "dob" | "bank" | "pan") => {
    setRevealed((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleSection = (sectionId: string) => {
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLink = async () => {
    if (!workspaceId) return;
    setLinkState("loading");
    setLinkError("");
    try {
      await linkMyAccount({ workspaceId });
      setLinkState("success");
    } catch (e) {
      setLinkState("error");
      setLinkError((e as Error).message || "Failed to link account");
    }
  };

  useEffect(() => {
    if (workspaceId && me === null && linkState === "idle") {
      void handleLink();
    }
  }, [workspaceId, me, linkState]);

  if (!workspaceId) {
    return (
      <div className="p-8 text-sm text-primary/60">
        Please select a workspace.
      </div>
    );
  }

  if (me === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (me === null) {
    return (
      <div className="flex h-full w-full bg-[#f8fafc] px-6 py-8 dark:bg-black">
        <div className="mx-auto w-full max-w-screen-md space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-border dark:bg-card">
            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              Your user account is not currently linked to an employee record in
              this workspace. Link your account to view your profile, banking,
              and statutory records.
            </p>
            {linkState === "error" && (
              <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive text-left space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{linkError.replace("ConvexError: ", "")}</span>
                </div>
                {linkError.includes("No employee record found") && (
                  <p className="pl-6 text-destructive/80 text-xs mt-2">
                    Action required: Please ask your workspace administrator to
                    update your employee record with your login email.
                  </p>
                )}
              </div>
            )}
            {linkState === "success" ? (
              <div className="mb-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Successfully linked!
                Refreshing...
              </div>
            ) : (
              <Button onClick={handleLink} disabled={linkState === "loading"}>
                {linkState === "loading" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Link My Account
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const empIdStr =
    "employeeIdNumber" in me &&
    typeof me.employeeIdNumber === "string" &&
    me.employeeIdNumber
      ? me.employeeIdNumber
      : `VC-${me._id.slice(-6).toUpperCase()}`;

  const formattedJoiningDate =
    me.joiningDate && !Number.isNaN(new Date(me.joiningDate).getTime())
      ? new Date(me.joiningDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recorded with HR";

  // Masking helpers
  const maskPhone = (phone?: string) => {
    if (!phone) return "—";
    if (phone.length <= 4) return phone;
    return `XXXXXX${phone.slice(-4)}`;
  };

  const maskBank = (acc?: string) => {
    if (!acc) return "—";
    if (acc.length <= 4) return acc;
    return `••••••••${acc.slice(-4)}`;
  };

  const maskPan = (pan?: string) => {
    if (!pan) return "—";
    if (pan.length <= 4) return pan;
    return `XXXXXX${pan.slice(-4)}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] p-4 sm:p-6 lg:p-8 dark:bg-black font-sans text-slate-800 dark:text-slate-100">
      {/* 1. Header Bar matching greytHR Screenshot */}
      <div className="mx-auto max-w-7xl pb-4 border-b border-slate-200 dark:border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FolderOpen className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            Employee Information
          </h1>
        </div>

        <div className="text-xs text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">
            Quick Links ▾
          </span>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="mx-auto max-w-7xl pt-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Secondary Navigation Column */}
        <div className="w-full md:w-56 shrink-0 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs p-2">
          <nav className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`text-left px-3 py-2 text-xs font-medium rounded transition flex items-center justify-between ${
                activeTab === "personal"
                  ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-l-3 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              Personal
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("accounts")}
              className={`text-left px-3 py-2 text-xs font-medium rounded transition flex items-center justify-between ${
                activeTab === "accounts"
                  ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-l-3 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              Accounts & Statutory
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("family")}
              className={`text-left px-3 py-2 text-xs font-medium rounded transition flex items-center justify-between ${
                activeTab === "family"
                  ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-l-3 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              Family
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("employment")}
              className={`text-left px-3 py-2 text-xs font-medium rounded transition flex items-center justify-between ${
                activeTab === "employment"
                  ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-l-3 border-blue-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              Employment & Job
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full space-y-6">
          {/* TAB 1: PERSONAL (Matches Screenshot 1) */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              {/* Jump Links Header */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pb-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  JUMP TO:
                </span>
                <button
                  type="button"
                  onClick={() => scrollToSection("profile-section")}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Profile
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => scrollToSection("personal-section")}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Personal
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => scrollToSection("address-section")}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Address
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => scrollToSection("education-section")}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Education
                </button>
              </div>

              {/* 1. Profile Box */}
              <div
                id="profile-section"
                className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs p-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Avatar Silhouette */}
                  <div className="h-20 w-20 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <User className="h-10 w-10 text-slate-300" />
                  </div>

                  {/* Employee Quick Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 flex-1 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Name
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                        {me.firstName} {me.lastName}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Employee ID
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        {empIdStr}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Company Email
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                        {me.email}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Location
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        Bangalore
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Primary Contact No
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {revealed.phone
                            ? me.phone || "—"
                            : maskPhone(me.phone)}
                        </span>
                        {me.phone && (
                          <button
                            type="button"
                            onClick={() => toggleReveal("phone")}
                            className="text-slate-400 hover:text-slate-600 transition"
                            title={
                              revealed.phone ? "Hide phone" : "Reveal phone"
                            }
                          >
                            {revealed.phone ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        Extension
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        —
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. PERSONAL Section Card */}
              <div
                id="personal-section"
                className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    Personal
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("personal")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.personal ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.personal && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Blood Group
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Date Of Birth
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {revealed.dob ? "2002-05-15" : "XXXXX 2002"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal("dob")}
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          {revealed.dob ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Nationality
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Marital Status
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Marriage Date
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Spouse
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Place Of Birth
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Residential Status
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Father Name
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Religion
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Physically Challenged
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        No
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        International Employee
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        No
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Height
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Weight
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Identification Mark
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Hobby
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Caste
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                        —
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. ADDRESS Section Card */}
              <div
                id="address-section"
                className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("address")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.address ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.address && (
                  <div className="p-5 space-y-4">
                    <div className="w-48">
                      <select
                        value={addressType}
                        onChange={(e) =>
                          setAddressType(
                            e.target.value as "contact" | "permanent",
                          )
                        }
                        className="text-xs border border-slate-300 dark:border-border rounded px-2.5 py-1.5 w-full bg-white dark:bg-card text-slate-700 dark:text-slate-200"
                      >
                        <option value="contact">Contact Address</option>
                        <option value="permanent">Permanent Address</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-xs">
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Address
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Name
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Email
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Phone 1
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Phone 2
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Mobile
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          {revealed.phone
                            ? me.phone || "—"
                            : maskPhone(me.phone)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Extension
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Fax
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          —
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. EDUCATION Section Card */}
              <div
                id="education-section"
                className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    Education
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("education")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.education ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.education && (
                  <div className="p-5 text-xs text-slate-500 dark:text-slate-400 italic">
                    No data Found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNTS & STATUTORY (Matches Screenshot 2) */}
          {activeTab === "accounts" && (
            <div className="space-y-4">
              {/* 1. BANK ACCOUNT Card */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    Bank Account
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("bank")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.bank ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.bank && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Bank Name
                      </span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                        {me.bankName || "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Bank Account Number
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-700 dark:text-slate-200 font-mono font-semibold">
                          {revealed.bank
                            ? me.bankAccountNumber || "—"
                            : maskBank(me.bankAccountNumber)}
                        </span>
                        {me.bankAccountNumber && (
                          <button
                            type="button"
                            onClick={() => toggleReveal("bank")}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            {revealed.bank ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Bank Branch / IFSC
                        </span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                          {me.ifscCode || "—"}
                        </p>
                      </div>
                      <span className="text-blue-600 hover:underline cursor-pointer text-xs font-medium">
                        More
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PF ACCOUNT Card */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    PF Account
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("pf")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.pf ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.pf && (
                  <div className="p-5 text-xs">
                    {me.isPfMember ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            UAN
                          </span>
                          <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-mono font-medium">
                            {me.uan || "Not Available"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            PF Member ID
                          </span>
                          <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-mono font-medium">
                            {me.pfMemberId || "Enrolled under Victor Chasex PF"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-500 font-medium text-xs flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">
                          !
                        </span>
                        Not covered under PF
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. PASSPORT AND VISA Card */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    Passport and Visa
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("passport")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.passport ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.passport && (
                  <div className="p-5 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Passport
                      </span>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400 italic">
                        No data Found.
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Visa
                      </span>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400 italic">
                        No data Found.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. OTHER IDS Card */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-border/60">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                    Other IDs
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection("otherIds")}
                    className="h-5 w-5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                  >
                    {collapsed.otherIds ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {!collapsed.otherIds && (
                  <div className="p-5 space-y-4 text-xs">
                    {/* Aadhaar Row */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-border/40">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          Aadhaar
                        </span>
                        <p className="mt-0.5 font-mono text-slate-700 dark:text-slate-200 font-medium">
                          7***********
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-amber-600 dark:text-amber-500 font-medium text-xs">
                          Unverified
                        </span>
                        <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                          More
                        </span>
                      </div>
                    </div>

                    {/* PAN Row */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          Permanent Account Number
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">
                            {revealed.pan
                              ? me.pan || "XXXXXX706N"
                              : maskPan(me.pan || "ABCDE1234F")}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal("pan")}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            {revealed.pan ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-amber-600 dark:text-amber-500 font-medium text-xs">
                          Unverified
                        </span>
                        <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                          More
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FAMILY (Matches Screenshot 3) */}
          {activeTab === "family" && (
            <div className="min-h-[300px] flex items-center justify-center bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs p-12">
              <p className="text-xs text-slate-400 font-medium">
                No Data For Family
              </p>
            </div>
          )}

          {/* TAB 4: EMPLOYMENT & JOB (Matches Screenshot 4) */}
          {activeTab === "employment" && (
            <div className="space-y-4">
              {/* Header with vertical cyan accent bar */}
              <div className="flex items-center gap-2.5 pb-1">
                <div className="h-4 w-1 bg-cyan-500 rounded-full" />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Employment & Job
                </h2>
              </div>

              {/* Jump Link */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <span>Jump to: </span>
                <button
                  type="button"
                  onClick={() => scrollToSection("current-position-section")}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Current Position
                </button>
              </div>

              {/* Current Position Card */}
              <div
                id="current-position-section"
                className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-2xs overflow-hidden"
              >
                {/* Amber/Peach Top Header Strip */}
                <div className="bg-[#fff7ed] dark:bg-amber-950/20 px-5 py-3 border-b border-orange-100 dark:border-amber-900/40 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Current Position
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowResignModal(true)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer"
                    >
                      Resign
                    </button>
                    <Button
                      size="sm"
                      onClick={() => setShowTimeline(true)}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs h-7 px-3 rounded shadow-xs"
                    >
                      View Timeline
                    </Button>
                  </div>
                </div>

                {/* Position Details Grid */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Cost Center
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                      NA
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Department
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                      {me.department || "AI"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Designation
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                      {me.designation || "Junior Developer"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Division
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                      NA
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Grade
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-medium">
                      NA
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Location
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                      Bangalore
                    </p>
                  </div>

                  <div className="sm:col-span-3">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Reporting To
                    </span>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-200 font-semibold">
                      Jerome Fathima
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Timeline Modal */}
      {showTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-card border border-slate-200 dark:border-border">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-border">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Employment Timeline
              </h3>
              <button
                type="button"
                onClick={() => setShowTimeline(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              <div className="relative pl-6 border-l-2 border-blue-500 space-y-1">
                <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                <span className="text-[10px] text-slate-400 font-semibold">
                  {formattedJoiningDate}
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Joined Victor Chasex Private Limited
                </p>
                <p className="text-[11px] text-slate-500">
                  Onboarded as {me.designation || "Junior Developer"} in{" "}
                  {me.department || "AI"} Department.
                </p>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-300 dark:border-slate-700 space-y-1">
                <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                <span className="text-[10px] text-slate-400 font-semibold">
                  Current Status
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Active Employment
                </p>
                <p className="text-[11px] text-slate-500">
                  Location: Bangalore • Managed by Jerome Fathima.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-border">
              <Button size="sm" onClick={() => setShowTimeline(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Notice Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-card border border-slate-200 dark:border-border">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-border">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Submit Resignation
              </h3>
              <button
                type="button"
                onClick={() => setShowResignModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Are you sure you wish to initiate the resignation process? This
                will notify your reporting manager (Jerome Fathima) and the HR
                department.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Reason for Leaving (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded border border-slate-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="State your reason or notice period preference..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowResignModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  alert("Resignation request recorded with HR administration.");
                  setShowResignModal(false);
                }}
              >
                Confirm Resignation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
