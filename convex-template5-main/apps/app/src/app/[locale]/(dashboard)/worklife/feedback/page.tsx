"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock,
  Edit3,
  FileEdit,
  FileText,
  HelpCircle,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface FeedbackDraft {
  id: string;
  recipientId: string;
  recipientName: string;
  category: string;
  sentiment: string;
  message: string;
  updatedAt: number;
}

export default function FeedbackPage() {
  const { current: workspaceId } = useWorkspace();
  const params = useParams();
  const searchParams = useSearchParams();
  const tabParam = (params?.tab as string) || searchParams.get("tab");

  type FeedbackTab = "received" | "given" | "pending" | "drafts";
  const [activeTab, setActiveTab] = useState<FeedbackTab>(() => {
    if (tabParam === "given") return "given";
    if (tabParam === "pending") return "pending";
    if (tabParam === "drafts") return "drafts";
    return "received";
  });

  const scoped = workspaceId ? { workspaceId } : "skip";
  const me = useQuery(api.employees.getMyProfile, scoped);
  const kudosRaw = useQuery(api.engage.listKudos, scoped);
  const employeesRaw = useQuery(api.employees.list, scoped);

  const sendMutation = useMutation(api.engage.sendKudos);

  // Available Colleagues (excluding self)
  const availableColleagues = useMemo(() => {
    if (!employeesRaw || !me) return [];
    return employeesRaw.filter(
      (e) => e._id !== me._id && e.status === "active",
    );
  }, [employeesRaw, me]);

  const empMap = useMemo(() => {
    if (!employeesRaw) return new Map<string, string>();
    return new Map(
      employeesRaw.map((e) => [e._id, `${e.firstName} ${e.lastName}`]),
    );
  }, [employeesRaw]);

  // Real Received Feedback
  const receivedFeedback = useMemo(() => {
    if (!kudosRaw || !me) return [];
    return kudosRaw.filter(
      (k) =>
        k.receiverEmployeeId === me._id &&
        k.badge.startsWith("feedback:review:"),
    );
  }, [kudosRaw, me]);

  // Real Given Feedback
  const givenFeedback = useMemo(() => {
    if (!kudosRaw || !me) return [];
    return kudosRaw.filter(
      (k) =>
        k.senderEmployeeId === me._id &&
        k.badge.startsWith("feedback:review:"),
    );
  }, [kudosRaw, me]);

  // Real Pending Requests (where someone requested feedback FROM me)
  const pendingRequests = useMemo(() => {
    if (!kudosRaw || !me) return [];
    return kudosRaw.filter(
      (k) =>
        k.receiverEmployeeId === me._id &&
        k.badge.startsWith("feedback:request:"),
    );
  }, [kudosRaw, me]);

  // Dismissed requests stored locally
  const [dismissedReqIds, setDismissedReqIds] = useState<string[]>([]);
  const activePendingRequests = useMemo(() => {
    return pendingRequests.filter((p) => !dismissedReqIds.includes(p._id));
  }, [pendingRequests, dismissedReqIds]);

  // Drafts stored locally per workspace & user
  const draftsStorageKey = useMemo(() => {
    if (!workspaceId || !me?._id) return null;
    return `indiapay_feedback_drafts_${workspaceId}_${me._id}`;
  }, [workspaceId, me?._id]);

  const [drafts, setDrafts] = useState<FeedbackDraft[]>([]);

  useEffect(() => {
    if (!draftsStorageKey || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(draftsStorageKey);
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
  }, [draftsStorageKey]);

  const saveDraftsToStorage = (updated: FeedbackDraft[]) => {
    setDrafts(updated);
    if (!draftsStorageKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(draftsStorageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // --------------------------------------------------------------------------
  // Request Feedback Modal State
  // --------------------------------------------------------------------------
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqRecipientId, setReqRecipientId] = useState("");
  const [reqTopic, setReqTopic] = useState("");
  const [reqQuestions, setReqQuestions] = useState("");
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  const handleOpenRequestModal = () => {
    setIsRequestModalOpen(true);
    setReqError(null);
    setReqSuccess(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    if (!reqRecipientId) {
      setReqError("Please select a colleague to ask for feedback.");
      return;
    }
    if (!reqTopic.trim()) {
      setReqError("Please enter a topic or project name.");
      return;
    }
    if (!reqQuestions.trim()) {
      setReqError("Please specify what feedback you are looking for.");
      return;
    }

    setIsSubmittingReq(true);
    setReqError(null);
    try {
      const badge = `feedback:request:${reqTopic.trim()}`;
      await sendMutation({
        workspaceId,
        receiverEmployeeId: reqRecipientId as Id<"employees">,
        badge,
        message: reqQuestions.trim(),
      });
      setReqSuccess("Feedback request sent successfully!");
      setReqTopic("");
      setReqQuestions("");
      setReqRecipientId("");
      setTimeout(() => {
        setIsRequestModalOpen(false);
        setReqSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      setReqError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // --------------------------------------------------------------------------
  // Give Feedback Modal State
  // --------------------------------------------------------------------------
  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [giveRecipientId, setGiveRecipientId] = useState("");
  const [giveCategory, setGiveCategory] = useState("Collaboration & Teamwork");
  const [giveSentiment, setGiveSentiment] = useState("Positive Praise");
  const [giveMessage, setGiveMessage] = useState("");
  const [isSubmittingGive, setIsSubmittingGive] = useState(false);
  const [giveError, setGiveError] = useState<string | null>(null);
  const [giveSuccess, setGiveSuccess] = useState<string | null>(null);

  const handleOpenGiveModal = (prefill?: {
    recipientId?: string;
    topic?: string;
  }) => {
    setEditingDraftId(null);
    setGiveRecipientId(prefill?.recipientId || "");
    setGiveCategory("Collaboration & Teamwork");
    setGiveSentiment("Positive Praise");
    setGiveMessage(
      prefill?.topic ? `In response to your request on "${prefill.topic}": ` : "",
    );
    setGiveError(null);
    setGiveSuccess(null);
    setIsGiveModalOpen(true);
  };

  const handleResumeDraft = (draft: FeedbackDraft) => {
    setEditingDraftId(draft.id);
    setGiveRecipientId(draft.recipientId);
    setGiveCategory(draft.category || "Collaboration & Teamwork");
    setGiveSentiment(draft.sentiment || "Positive Praise");
    setGiveMessage(draft.message || "");
    setGiveError(null);
    setGiveSuccess(null);
    setIsGiveModalOpen(true);
  };

  const handleDeleteDraft = (draftId: string) => {
    const updated = drafts.filter((d) => d.id !== draftId);
    saveDraftsToStorage(updated);
  };

  const handleSaveAsDraft = () => {
    if (!giveRecipientId) {
      setGiveError("Please select a colleague before saving as draft.");
      return;
    }
    const recipientName =
      empMap.get(giveRecipientId) || "Selected Colleague";

    const draftItem: FeedbackDraft = {
      id: editingDraftId || `draft_${Date.now()}`,
      recipientId: giveRecipientId,
      recipientName,
      category: giveCategory,
      sentiment: giveSentiment,
      message: giveMessage,
      updatedAt: Date.now(),
    };

    const updated = drafts.filter((d) => d.id !== draftItem.id);
    saveDraftsToStorage([draftItem, ...updated]);
    setGiveSuccess("Draft saved successfully.");
    setTimeout(() => {
      setIsGiveModalOpen(false);
      setGiveSuccess(null);
      setActiveTab("drafts");
    }, 800);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    if (!giveRecipientId) {
      setGiveError("Please select a recipient.");
      return;
    }
    if (!giveMessage.trim()) {
      setGiveError("Please enter your feedback comments.");
      return;
    }

    setIsSubmittingGive(true);
    setGiveError(null);
    try {
      const badge = `feedback:review:${giveCategory}:${giveSentiment}`;
      await sendMutation({
        workspaceId,
        receiverEmployeeId: giveRecipientId as Id<"employees">,
        badge,
        message: giveMessage.trim(),
      });

      // Remove from drafts if editing a draft
      if (editingDraftId) {
        saveDraftsToStorage(drafts.filter((d) => d.id !== editingDraftId));
      }

      setGiveSuccess("Feedback submitted successfully!");
      setGiveMessage("");
      setGiveRecipientId("");
      setTimeout(() => {
        setIsGiveModalOpen(false);
        setGiveSuccess(null);
        setActiveTab("given");
      }, 1200);
    } catch (err: unknown) {
      setGiveError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setIsSubmittingGive(false);
    }
  };

  const categories = [
    "Collaboration & Teamwork",
    "Technical Excellence",
    "Leadership & Ownership",
    "Communication",
    "Delivery & Quality",
    "General Feedback",
  ];

  const sentiments = [
    { label: "Positive Praise", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Constructive Suggestion", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Growth Opportunity", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ];

  return (
    <div className="min-h-full bg-background pb-12">
      {/* Top Header Bar matching greytHR */}
      <div className="flex items-center justify-between border-b border-border/80 bg-card px-6 py-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
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
              <path d="M0 0H16V20L8 15L0 20V0Z" fill="#00C49F" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>My Worklife</span>
            <span>/</span>
            <h1 className="text-sm font-semibold text-primary">Feedback</h1>
          </div>
        </div>

        {/* Action Buttons in Upper-Right Area */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenRequestModal}
            className="rounded-md border border-[#0091FF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0091FF] shadow-2xs transition hover:bg-blue-50/80 dark:bg-card dark:hover:bg-blue-950/30"
          >
            Request Feedback
          </button>
          <button
            type="button"
            onClick={() => handleOpenGiveModal()}
            className="rounded-md bg-[#0091FF] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-600"
          >
            Give Feedback
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

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`relative py-3 text-sm transition ${
              activeTab === "pending"
                ? "font-medium text-[#0091FF]"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Pending Requests
            {activePendingRequests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-semibold text-[#0091FF] dark:bg-blue-950">
                {activePendingRequests.length}
              </span>
            )}
            {activeTab === "pending" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-[#0091FF]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drafts")}
            className={`relative py-3 text-sm transition ${
              activeTab === "drafts"
                ? "font-medium text-[#0091FF]"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Drafts
            {drafts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                {drafts.length}
              </span>
            )}
            {activeTab === "drafts" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-[#0091FF]" />
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="mx-auto max-w-5xl px-6 pt-10">
        {/* TAB 1: RECEIVED */}
        {activeTab === "received" && (
          receivedFeedback.length === 0 ? (
            /* Reference-style Empty State for Received Feedback */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {/* Feedback speech bubble illustration */}
              <div className="relative mb-4 flex h-40 w-40 items-center justify-center">
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 150 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-xs"
                >
                  <circle cx="75" cy="75" r="70" fill="#F0F7FF" />
                  <circle cx="75" cy="75" r="60" fill="#E1EFFF" />

                  {/* Left speech bubble */}
                  <path
                    d="M38 52 C38 43, 45 36, 54 36 L92 36 C101 36, 108 43, 108 52 L108 72 C108 81, 101 88, 92 88 L60 88 L46 102 L46 88 L54 88 C45 88, 38 81, 38 72 Z"
                    fill="#FFFFFF"
                    stroke="#0091FF"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Lines in speech bubble */}
                  <line
                    x1="54"
                    y1="52"
                    x2="92"
                    y2="52"
                    stroke="#B8DBFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1="54"
                    y1="64"
                    x2="80"
                    y2="64"
                    stroke="#B8DBFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Sparkle star on top-right */}
                  <path
                    d="M108 30 L110 24 L112 30 L118 32 L112 34 L110 40 L108 34 L102 32 Z"
                    fill="#FFB020"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] dark:text-white">
                Seeking Advice?
              </h2>
              <p className="mt-1 text-sm text-[#5E6C84] dark:text-muted-foreground">
                Let's gather a new outlook from your coworkers.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleOpenRequestModal}
                  className="inline-flex items-center justify-center rounded-[6px] bg-[#0091FF] px-6 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-[#0077D4]"
                >
                  Request Feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {receivedFeedback.map((f) => {
                const parts = f.badge.split(":");
                const category = parts[2] || "Collaboration & Teamwork";
                const sentiment = parts[3] || "Positive Praise";
                return (
                  <div
                    key={f._id}
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
                              {f.senderName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(f.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {category}
                        </span>
                      </div>

                      <p className="mt-3.5 text-xs leading-relaxed text-primary/85">
                        {f.message}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {sentiment}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 2: GIVEN */}
        {activeTab === "given" && (
          givenFeedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 flex h-40 w-40 items-center justify-center">
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 150 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-xs"
                >
                  <circle cx="75" cy="75" r="70" fill="#FBF7EE" />
                  <circle cx="75" cy="75" r="60" fill="#F4EEDC" />

                  <path
                    d="M42 56 C42 46, 50 38, 60 38 L98 38 C108 38, 116 46, 116 56 L116 76 C116 86, 108 94, 98 94 L82 94 L70 106 L70 94 L60 94 C50 94, 42 86, 42 76 Z"
                    fill="#FFFFFF"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M62 60 L70 68 L88 50"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] dark:text-white">
                No Feedback Given Yet
              </h2>
              <p className="mt-1 text-sm text-[#5E6C84] dark:text-muted-foreground">
                Recognize and assist your peers by sharing thoughtful feedback.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenGiveModal()}
                  className="inline-flex items-center justify-center rounded-[6px] bg-[#0091FF] px-6 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-[#0077D4]"
                >
                  Give Feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {givenFeedback.map((f) => {
                const parts = f.badge.split(":");
                const category = parts[2] || "Collaboration & Teamwork";
                const sentiment = parts[3] || "Positive Praise";
                return (
                  <div
                    key={f._id}
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
                              To: {f.receiverName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(f.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          {category}
                        </span>
                      </div>

                      <p className="mt-3.5 text-xs leading-relaxed text-primary/85">
                        {f.message}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {sentiment}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 3: PENDING REQUESTS */}
        {activeTab === "pending" && (
          activePendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-muted/40">
                <Inbox className="h-14 w-14 text-muted-foreground/60" />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] dark:text-white">
                No Pending Requests
              </h2>
              <p className="mt-1 text-sm text-[#5E6C84] dark:text-muted-foreground">
                You're all caught up! When teammates ask for your feedback, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePendingRequests.map((req) => {
                const topic =
                  req.badge.replace("feedback:request:", "") || "General Feedback";
                return (
                  <div
                    key={req._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/80 bg-card p-4 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">
                          {req.senderName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          requested your feedback on
                        </span>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#0091FF] dark:bg-blue-950/40">
                          {topic}
                        </span>
                      </div>
                      <p className="text-xs text-primary/75 italic">
                        "{req.message}"
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenGiveModal({
                            recipientId: req.senderEmployeeId,
                            topic,
                          })
                        }
                        className="rounded-md bg-[#0091FF] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-600"
                      >
                        Provide Feedback
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDismissedReqIds((prev) => [...prev, req._id])
                        }
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 4: DRAFTS */}
        {activeTab === "drafts" && (
          drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-muted/40">
                <FileEdit className="h-14 w-14 text-muted-foreground/60" />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-[#172B4D] dark:text-white">
                No Saved Drafts
              </h2>
              <p className="mt-1 text-sm text-[#5E6C84] dark:text-muted-foreground">
                Drafts you save while preparing feedback will appear here.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleOpenGiveModal()}
                  className="inline-flex items-center justify-center rounded-[6px] bg-[#0091FF] px-6 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-[#0077D4]"
                >
                  Give Feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/80 bg-card p-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">
                        To: {draft.recipientName}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {draft.category}
                      </span>
                    </div>
                    <p className="text-xs text-primary/75 truncate max-w-lg">
                      {draft.message || "(No draft message text)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Last edited:{" "}
                      {new Date(draft.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResumeDraft(draft)}
                      className="rounded-md border border-[#0091FF] px-3.5 py-1.5 text-xs font-semibold text-[#0091FF] transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      Resume Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* REQUEST FEEDBACK MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-card shadow-xl border border-border">
            <div className="flex items-center justify-between bg-[#F0F4F8] px-5 py-3.5 dark:bg-muted/60">
              <h3 className="text-sm font-semibold text-[#172B4D] dark:text-white">
                Request Feedback
              </h3>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-black/5 hover:text-primary transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-5 space-y-4">
              {reqError && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  {reqError}
                </div>
              )}
              {reqSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{reqSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Request From (Coworker)*
                </label>
                <select
                  value={reqRecipientId}
                  onChange={(e) => setReqRecipientId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                >
                  <option value="">Select a coworker...</option>
                  {availableColleagues.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.firstName} {c.lastName} (
                      {c.designation || c.department || "Colleague"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Topic or Project Area*
                </label>
                <input
                  type="text"
                  value={reqTopic}
                  onChange={(e) => setReqTopic(e.target.value)}
                  placeholder="e.g. Q3 Sprint Execution, Presentation Skills"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Specific Questions / Context*
                </label>
                <textarea
                  value={reqQuestions}
                  onChange={(e) => setReqQuestions(e.target.value)}
                  rows={4}
                  placeholder="What specific perspectives, strengths, or suggestions are you looking for?"
                  className="w-full rounded-md border border-border bg-background p-3 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-[#0091FF] bg-transparent px-5 py-2 text-xs font-semibold text-[#0091FF] transition hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50"
                >
                  {isSubmittingReq ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Submit Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="rounded-md bg-[#0091FF] px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* GIVE FEEDBACK MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isGiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-card shadow-xl border border-border">
            <div className="flex items-center justify-between bg-[#F0F4F8] px-5 py-3.5 dark:bg-muted/60">
              <h3 className="text-sm font-semibold text-[#172B4D] dark:text-white">
                Give Feedback
              </h3>
              <button
                type="button"
                onClick={() => setIsGiveModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-black/5 hover:text-primary transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-5 space-y-4">
              {giveError && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  {giveError}
                </div>
              )}
              {giveSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{giveSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Recipient Colleague*
                </label>
                <select
                  value={giveRecipientId}
                  onChange={(e) => setGiveRecipientId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                >
                  <option value="">Select a colleague...</option>
                  {availableColleagues.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.firstName} {c.lastName} (
                      {c.designation || c.department || "Colleague"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Focus Area
                </label>
                <select
                  value={giveCategory}
                  onChange={(e) => setGiveCategory(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Sentiment / Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {sentiments.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setGiveSentiment(s.label)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition ${
                        giveSentiment === s.label
                          ? "border-[#0091FF] bg-blue-50 font-semibold text-[#0091FF] dark:bg-blue-950/40"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Feedback Details*
                </label>
                <textarea
                  value={giveMessage}
                  onChange={(e) => setGiveMessage(e.target.value)}
                  rows={4}
                  placeholder="Share constructive, actionable, and encouraging feedback..."
                  className="w-full rounded-md border border-border bg-background p-3 text-xs text-primary focus:border-[#0091FF] focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-primary hover:bg-muted transition"
                >
                  Save as Draft
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingGive}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-[#0091FF] bg-transparent px-4 py-2 text-xs font-semibold text-[#0091FF] transition hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50"
                  >
                    {isSubmittingGive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Submit Feedback</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGiveModalOpen(false)}
                    className="rounded-md bg-[#0091FF] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
