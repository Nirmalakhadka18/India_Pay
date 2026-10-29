"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Award,
  CheckCircle2,
  Heart,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function KudosPage() {
  const { current: workspaceId } = useWorkspace();
  const params = useParams();
  const searchParams = useSearchParams();
  const tabParam = (params?.tab as string) || searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"received" | "given">(
    tabParam === "given" ? "given" : "received",
  );

  const scoped = workspaceId ? { workspaceId } : "skip";
  const me = useQuery(api.employees.getMyProfile, scoped);
  const kudosRaw = useQuery(api.engage.listKudos, scoped);
  const employeesRaw = useQuery(api.employees.list, scoped);

  const sendKudos = useMutation(api.engage.sendKudos);

  // Modal State for Giving Kudos directly
  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [badge, setBadge] = useState<string>("Team Player");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter colleagues (excluding myself)
  const availableColleagues = useMemo(() => {
    if (!employeesRaw || !me) return [];
    return employeesRaw.filter(
      (e) => e._id !== me._id && e.status === "active",
    );
  }, [employeesRaw, me]);

  // Filter Kudos (excluding feedback items encoded in badge)
  const receivedKudos = useMemo(() => {
    if (!kudosRaw || !me) return [];
    return kudosRaw.filter(
      (k) =>
        k.receiverEmployeeId === me._id && !k.badge.startsWith("feedback:"),
    );
  }, [kudosRaw, me]);

  const givenKudos = useMemo(() => {
    if (!kudosRaw || !me) return [];
    return kudosRaw.filter(
      (k) =>
        k.senderEmployeeId === me._id && !k.badge.startsWith("feedback:"),
    );
  }, [kudosRaw, me]);

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    if (!selectedRecipientId) {
      setErrorMsg("Please select a colleague to praise.");
      return;
    }
    if (!message.trim()) {
      setErrorMsg("Please write an appreciation message.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await sendKudos({
        workspaceId,
        receiverEmployeeId: selectedRecipientId as Id<"employees">,
        badge,
        message: message.trim(),
      });
      setSuccessMsg("Kudos sent successfully!");
      setMessage("");
      setSelectedRecipientId("");
      setTimeout(() => {
        setIsGiveModalOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to send kudos. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const badgeOptions = [
    { label: "Team Player", icon: "🤝" },
    { label: "Problem Solver", icon: "🧩" },
    { label: "Great Mentor", icon: "🌱" },
    { label: "Rockstar", icon: "⭐" },
    { label: "Customer Champion", icon: "🏆" },
  ];

  return (
    <div className="min-h-full bg-background pb-12">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border/80 bg-card px-6 py-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* greytHR folded ribbon bookmark icon */}
          <div className="flex h-5 w-4 items-center justify-center">
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <path
                d="M0 0H16V20L8 15L0 20V0Z"
                fill="#00C49F"
              />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-primary">Kudos</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsGiveModalOpen(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="flex items-center gap-1.5 rounded-md border border-[#0091FF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0091FF] shadow-2xs transition hover:bg-blue-50/80 dark:bg-card dark:hover:bg-blue-950/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Give Kudos</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-border/80 bg-card px-6">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={`relative py-3 text-sm transition ${
              activeTab === "received"
                ? "font-medium text-[#0091FF]"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Received
            {activeTab === "received" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-[#0091FF]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("given")}
            className={`relative py-3 text-sm transition ${
              activeTab === "given"
                ? "font-medium text-[#0091FF]"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Given
            {activeTab === "given" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-[#0091FF]" />
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="mx-auto max-w-5xl px-6 pt-10">
        {activeTab === "received" ? (
          receivedKudos.length === 0 ? (
            /* Exact greytHR Empty State for Received */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {/* Thumbs-up illustration matching greytHR Screenshot */}
              <div className="relative mb-4 flex h-44 w-44 items-center justify-center">
                <svg
                  width="170"
                  height="170"
                  viewBox="0 0 170 170"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-xs"
                >
                  {/* Outer circle accent ring */}
                  <circle cx="85" cy="85" r="82" fill="#FFEFE7" />
                  {/* Inner warm coral background */}
                  <circle cx="85" cy="85" r="70" fill="#F8794A" />

                  {/* Emerald green sleeve from bottom-left */}
                  <path
                    d="M26 122 L58 84 L78 100 L46 138 Z"
                    fill="#00A389"
                  />
                  <path
                    d="M56 82 L80 102"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Hand giving Thumbs Up */}
                  {/* Curled fingers & palm */}
                  <path
                    d="M66 88 C70 82, 78 76, 88 76 C98 76, 104 82, 106 88 C108 93, 105 98, 100 100 C104 102, 107 106, 106 111 C105 116, 100 119, 95 120 C98 122, 100 126, 98 131 C96 135, 89 138, 79 135 C70 133, 62 122, 58 108 Z"
                    fill="#FDD7C2"
                    stroke="#E5A68B"
                    strokeWidth="1.5"
                  />
                  {/* Upright thumb */}
                  <path
                    d="M66 88 C62 80, 60 64, 61 55 C62 47, 69 47, 73 52 C78 59, 80 70, 83 78"
                    fill="#FDD7C2"
                    stroke="#E5A68B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Bright Blue 5-Pointed Star over thumb */}
                  <polygon
                    points="106,32 111,46 125,46 114,55 118,69 106,60 94,69 98,55 87,46 101,46"
                    fill="#3B82F6"
                  />

                  {/* Sparkle Glints */}
                  {/* Top-left glint */}
                  <path
                    d="M78 38 L80 32 L82 38 L88 40 L82 42 L80 48 L78 42 L72 40 Z"
                    fill="#93C5FD"
                  />
                  {/* Right glint */}
                  <path
                    d="M136 60 L137 56 L138 60 L142 61 L138 62 L137 66 L136 62 L132 61 Z"
                    fill="#93C5FD"
                  />
                  {/* Small round star spark */}
                  <circle cx="130" cy="78" r="2.5" fill="#93C5FD" />
                </svg>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] dark:text-white">
                Get going!
              </h2>
              <p className="mt-1 text-sm text-[#5E6C84] dark:text-muted-foreground">
                All the Kudos you have received will appear here.
              </p>

              <div className="mt-6">
                <Link
                  href="/engage"
                  className="inline-flex items-center justify-center rounded-[6px] bg-[#0091FF] px-6 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-[#0077D4]"
                >
                  Go to Engage
                </Link>
              </div>
            </div>
          ) : (
            /* Populated List of Received Kudos */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {receivedKudos.map((k) => (
                <div
                  key={k._id}
                  className="flex flex-col justify-between rounded-lg border border-border/80 bg-card p-5 shadow-2xs transition hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-primary">
                            From: {k.senderName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(k.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        ⭐ {k.badge}
                      </span>
                    </div>

                    <p className="mt-3.5 text-xs leading-relaxed text-primary/80 italic">
                      "{k.message}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : givenKudos.length === 0 ? (
          /* Exact greytHR Empty State for Given */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4 flex h-44 w-44 items-center justify-center">
              <svg
                width="170"
                height="170"
                viewBox="0 0 170 170"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-xs"
              >
                <circle cx="85" cy="85" r="82" fill="#FFEFE7" />
                <circle cx="85" cy="85" r="70" fill="#F8794A" />

                <path
                  d="M26 122 L58 84 L78 100 L46 138 Z"
                  fill="#00A389"
                />
                <path
                  d="M56 82 L80 102"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                <path
                  d="M66 88 C70 82, 78 76, 88 76 C98 76, 104 82, 106 88 C108 93, 105 98, 100 100 C104 102, 107 106, 106 111 C105 116, 100 119, 95 120 C98 122, 100 126, 98 131 C96 135, 89 138, 79 135 C70 133, 62 122, 58 108 Z"
                  fill="#FDD7C2"
                  stroke="#E5A68B"
                  strokeWidth="1.5"
                />
                <path
                  d="M66 88 C62 80, 60 64, 61 55 C62 47, 69 47, 73 52 C78 59, 80 70, 83 78"
                  fill="#FDD7C2"
                  stroke="#E5A68B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                <polygon
                  points="106,32 111,46 125,46 114,55 118,69 106,60 94,69 98,55 87,46 101,46"
                  fill="#3B82F6"
                />

                <path
                  d="M78 38 L80 32 L82 38 L88 40 L82 42 L80 48 L78 42 L72 40 Z"
                  fill="#93C5FD"
                />
                <path
                  d="M136 60 L137 56 L138 60 L142 61 L138 62 L137 66 L136 62 L132 61 Z"
                  fill="#93C5FD"
                />
                <circle cx="130" cy="78" r="2.5" fill="#93C5FD" />
              </svg>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#172B4D] dark:text-white">
              Get going!
            </h2>
            <p className="mt-1 text-sm text-[#5E6C84] dark:text-muted-foreground">
              All the Kudos you have given will appear here.
            </p>

            <div className="mt-6">
              <Link
                href="/engage"
                className="inline-flex items-center justify-center rounded-[6px] bg-[#0091FF] px-6 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-[#0077D4]"
              >
                Go to Engage
              </Link>
            </div>
          </div>
        ) : (
          /* Populated List of Given Kudos */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {givenKudos.map((k) => (
              <div
                key={k._id}
                className="flex flex-col justify-between rounded-lg border border-border/80 bg-card p-5 shadow-2xs transition hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          To: {k.receiverName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(k.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      ⭐ {k.badge}
                    </span>
                  </div>

                  <p className="mt-3.5 text-xs leading-relaxed text-primary/80 italic">
                    "{k.message}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Give Kudos Modal */}
      {isGiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-card shadow-xl border border-border">
            {/* Modal Header matching greytHR styling */}
            <div className="flex items-center justify-between bg-[#F0F4F8] px-5 py-3.5 dark:bg-muted/60">
              <h3 className="text-sm font-semibold text-[#172B4D] dark:text-white">
                Give Kudos
              </h3>
              <button
                type="button"
                onClick={() => setIsGiveModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-black/5 hover:text-primary transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendKudos} className="p-5 space-y-4">
              {errorMsg && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Recipient Colleague*
                </label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                >
                  <option value="">Select a colleague...</option>
                  {availableColleagues.map((colleague) => (
                    <option key={colleague._id} value={colleague._id}>
                      {colleague.firstName} {colleague.lastName} (
                      {colleague.designation || colleague.department || "Team"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Praise Badge
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {badgeOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setBadge(opt.label)}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${
                        badge === opt.label
                          ? "border-[#0091FF] bg-blue-50/70 text-[#0091FF] font-medium dark:bg-blue-950/40"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Recognition Message*
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Share what makes their contribution special..."
                  className="w-full rounded-md border border-border bg-background p-3 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-[#0091FF] bg-transparent px-5 py-2 text-xs font-semibold text-[#0091FF] transition hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Submit Kudos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGiveModalOpen(false)}
                  className="rounded-md bg-[#0091FF] px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
