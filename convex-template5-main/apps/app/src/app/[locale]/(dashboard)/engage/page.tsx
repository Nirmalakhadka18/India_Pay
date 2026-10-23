"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Award,
  Bell,
  Cake,
  CheckCircle2,
  Heart,
  HelpCircle,
  Loader2,
  Megaphone,
  Pin,
  PlusCircle,
  Send,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

type TabKey = "announcements" | "celebrations" | "polls" | "kudos";

export default function EngagePage() {
  const { current: workspaceId, workspaces } = useWorkspace();
  const [activeTab, setActiveTab] = useState<TabKey>("announcements");

  const scoped = workspaceId ? { workspaceId } : "skip";
  const me = useQuery(api.employees.getMyProfile, scoped);
  const employees = useQuery(api.employees.list, scoped);
  const announcements = useQuery(api.engage.listAnnouncements, scoped);
  const polls = useQuery(api.engage.listPolls, scoped);
  const celebrations = useQuery(api.engage.listCelebrations, scoped);
  const kudos = useQuery(api.engage.listKudos, scoped);

  const currentRole = workspaces.find((w) => w._id === workspaceId)?.role;
  const isAdmin = currentRole === "admin" || currentRole === "owner";

  // Mutations
  const createAnnouncement = useMutation(api.engage.createAnnouncement);
  const createPoll = useMutation(api.engage.createPoll);
  const votePoll = useMutation(api.engage.votePoll);
  const sendKudos = useMutation(api.engage.sendKudos);

  // Announcement Modal State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [announceCategory, setAnnounceCategory] = useState<
    "general" | "hr" | "event" | "policy"
  >("general");
  const [announcePinned, setAnnouncePinned] = useState(false);
  const [isSubmittingAnnounce, setIsSubmittingAnnounce] = useState(false);
  const [announceError, setAnnounceError] = useState<string | null>(null);

  // Poll Modal State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [pollOption3, setPollOption3] = useState("");
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  // Kudos Modal State
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosReceiverId, setKudosReceiverId] = useState<string>("");
  const [kudosMessage, setKudosMessage] = useState("");
  const [kudosBadge, setKudosBadge] = useState("Team Player");
  const [isSubmittingKudos, setIsSubmittingKudos] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);

  // Voting feedback
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setAnnounceError(null);
    setIsSubmittingAnnounce(true);
    try {
      await createAnnouncement({
        workspaceId,
        title: announceTitle,
        content: announceContent,
        category: announceCategory,
        pinned: announcePinned,
      });
      setShowAnnounceModal(false);
      setAnnounceTitle("");
      setAnnounceContent("");
    } catch (err) {
      setAnnounceError((err as Error).message || "Failed to post announcement.");
    } finally {
      setIsSubmittingAnnounce(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setPollError(null);
    const options = [pollOption1, pollOption2, pollOption3].filter(
      (o) => o.trim().length > 0,
    );
    if (options.length < 2) {
      setPollError("Please provide at least 2 options.");
      return;
    }
    setIsSubmittingPoll(true);
    try {
      await createPoll({
        workspaceId,
        question: pollQuestion,
        options,
      });
      setShowPollModal(false);
      setPollQuestion("");
      setPollOption1("");
      setPollOption2("");
      setPollOption3("");
    } catch (err) {
      setPollError((err as Error).message || "Failed to create poll.");
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleVote = async (pollId: Id<"polls">, optionIndex: number) => {
    if (!workspaceId) return;
    setVotingPollId(pollId);
    try {
      await votePoll({ workspaceId, pollId, optionIndex });
    } catch (err) {
      alert((err as Error).message || "Failed to register vote.");
    } finally {
      setVotingPollId(null);
    }
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setKudosError(null);
    if (!kudosReceiverId) {
      setKudosError("Please select a colleague.");
      return;
    }
    setIsSubmittingKudos(true);
    try {
      await sendKudos({
        workspaceId,
        receiverEmployeeId: kudosReceiverId as Id<"employees">,
        message: kudosMessage,
        badge: kudosBadge,
      });
      setShowKudosModal(false);
      setKudosReceiverId("");
      setKudosMessage("");
    } catch (err) {
      setKudosError((err as Error).message || "Failed to give kudos.");
    } finally {
      setIsSubmittingKudos(false);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  const eligibleColleagues =
    employees?.filter((e) => !me || e._id !== me._id) ?? [];

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-cyan-600" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                Engage & Team Community
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                <Sparkles className="h-3 w-3" /> Live
              </span>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Company announcements, employee milestones, team polls, and peer appreciation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowKudosModal(true)}
              className="text-xs"
            >
              <Award className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Give Kudos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPollModal(true)}
              className="text-xs"
            >
              <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Create Poll
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowAnnounceModal(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
              >
                <Megaphone className="mr-1.5 h-3.5 w-3.5" /> Post Announcement
              </Button>
            )}
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`rounded-md px-3.5 py-1.5 transition ${
              activeTab === "announcements"
                ? "bg-cyan-600 text-white font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Announcements ({announcements?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("celebrations")}
            className={`rounded-md px-3.5 py-1.5 transition ${
              activeTab === "celebrations"
                ? "bg-cyan-600 text-white font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Celebrations & Milestones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("polls")}
            className={`rounded-md px-3.5 py-1.5 transition ${
              activeTab === "polls"
                ? "bg-cyan-600 text-white font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Team Polls ({polls?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kudos")}
            className={`rounded-md px-3.5 py-1.5 transition ${
              activeTab === "kudos"
                ? "bg-cyan-600 text-white font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Kudos Wall ({kudos?.length ?? 0})
          </button>
        </div>

        {/* ── TAB 1: ANNOUNCEMENTS ─────────────────────────────────────────── */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            {announcements === undefined ? (
              <div className="flex h-48 w-full items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
                <Megaphone className="mx-auto h-10 w-10 text-primary/30" />
                <h3 className="text-base font-semibold text-primary">
                  No Announcements Yet
                </h3>
                <p className="text-xs text-primary/60 max-w-md mx-auto">
                  Company updates, HR alerts, and holiday notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {announcements.map((a) => (
                  <div
                    key={a._id}
                    className={`rounded-lg border bg-card p-5 shadow-sm space-y-3 transition ${
                      a.pinned
                        ? "border-cyan-500/50 bg-cyan-500/5 dark:bg-cyan-500/10"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {a.pinned && (
                          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                            <Pin className="h-3 w-3" /> Pinned
                          </span>
                        )}
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                          {a.category}
                        </span>
                        <h2 className="text-sm font-bold text-primary">{a.title}</h2>
                      </div>
                      <span className="text-[11px] text-primary/50 font-mono">
                        {new Date(a.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-primary/80 whitespace-pre-line leading-relaxed">
                      {a.content}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-primary/50">
                      <span>Posted by: <strong className="text-primary">{a.authorName}</strong></span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Official Workspace Broadcast
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CELEBRATIONS & MILESTONES ─────────────────────────────── */}
        {activeTab === "celebrations" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Work Anniversaries Card */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Award className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="font-semibold text-primary text-sm">
                      Upcoming Work Anniversaries
                    </h3>
                    <p className="text-[11px] text-primary/60">
                      Loyalty milestones calculated from verified employee joining dates.
                    </p>
                  </div>
                </div>

                {!celebrations || celebrations.anniversaries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-primary/50">
                    No upcoming anniversaries this month.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {celebrations.anniversaries.map((anniv) => (
                      <div
                        key={anniv.employeeId}
                        className="py-3 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold">
                            {anniv.yearsCompleted}y
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{anniv.name}</p>
                            <p className="text-[10px] text-primary/50">
                              {anniv.department} • Joined {anniv.joiningDate}
                            </p>
                          </div>
                        </div>
                        {anniv.isThisMonth && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            This Month 🎉
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Joiners Card */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h3 className="font-semibold text-primary text-sm">
                      Recent New Joiners
                    </h3>
                    <p className="text-[11px] text-primary/60">
                      Colleagues who joined the organization in the last 90 days.
                    </p>
                  </div>
                </div>

                {!celebrations || celebrations.newJoiners.length === 0 ? (
                  <div className="p-8 text-center text-xs text-primary/50">
                    No new joiners in the last 90 days.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {celebrations.newJoiners.map((joiner) => (
                      <div
                        key={joiner.employeeId}
                        className="py-3 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                            👋
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{joiner.name}</p>
                            <p className="text-[10px] text-primary/50">
                              {joiner.designation} • {joiner.department}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-primary/60">
                          Joined {joiner.joiningDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: TEAM POLLS ────────────────────────────────────────────── */}
        {activeTab === "polls" && (
          <div className="space-y-4">
            {polls === undefined ? (
              <div className="flex h-48 w-full items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : polls.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
                <HelpCircle className="mx-auto h-10 w-10 text-primary/30" />
                <h3 className="text-base font-semibold text-primary">
                  No Active Polls
                </h3>
                <p className="text-xs text-primary/60 max-w-md mx-auto">
                  Have a question for the team? Create a poll to gather feedback.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowPollModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs mt-2"
                >
                  Create First Poll
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {polls.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-primary text-sm">
                          {p.question}
                        </h3>
                        <p className="text-[11px] text-primary/50 mt-0.5">
                          Created by {p.creatorName} • {p.totalVotes} vote(s)
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          p.hasVoted
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {p.hasVoted ? "Voted" : "Active"}
                      </span>
                    </div>

                    {/* Options & Voting */}
                    <div className="space-y-2">
                      {p.options.map((opt, idx) => {
                        const count = p.voteCounts[idx] || 0;
                        const pct =
                          p.totalVotes > 0
                            ? Math.round((count / p.totalVotes) * 100)
                            : 0;
                        const isMyVote = p.myVoteIndex === idx;

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={p.hasVoted || votingPollId === p._id}
                            onClick={() => handleVote(p._id, idx)}
                            className={`w-full text-left rounded-md border p-2.5 transition relative overflow-hidden ${
                              isMyVote
                                ? "border-emerald-500 bg-emerald-500/5 font-semibold"
                                : p.hasVoted
                                  ? "border-border/60 bg-muted/20 cursor-default"
                                  : "border-border hover:border-cyan-500 hover:bg-muted/40 cursor-pointer"
                            }`}
                          >
                            {/* Animated progress fill for results */}
                            {p.hasVoted && (
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                            <div className="relative flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2">
                                {isMyVote && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                                <span>{opt}</span>
                              </span>
                              {p.hasVoted && (
                                <span className="font-mono text-primary/70 font-medium">
                                  {pct}% ({count})
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: KUDOS WALL ────────────────────────────────────────────── */}
        {activeTab === "kudos" && (
          <div className="space-y-4">
            {kudos === undefined ? (
              <div className="flex h-48 w-full items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : kudos.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
                <Award className="mx-auto h-10 w-10 text-primary/30" />
                <h3 className="text-base font-semibold text-primary">
                  The Kudos Wall is Fresh
                </h3>
                <p className="text-xs text-primary/60 max-w-md mx-auto">
                  Recognize a colleague for great work, collaboration, or stepping up.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowKudosModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs mt-2"
                >
                  Give First Kudos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kudos.map((k) => (
                  <div
                    key={k._id}
                    className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-bold text-amber-600 dark:text-amber-400 text-[10px]">
                          ⭐ {k.badge}
                        </span>
                        <span className="text-[10px] text-primary/40 font-mono">
                          {new Date(k.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-primary/80 italic leading-relaxed">
                        “{k.message}”
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50 text-[11px] flex items-center justify-between text-primary/60">
                      <span>To: <strong className="text-primary">{k.receiverName}</strong></span>
                      <span>From: {k.senderName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODAL 1: POST ANNOUNCEMENT ──────────────────────────────────── */}
        {showAnnounceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-primary">Post Announcement</h3>
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="text-primary/60 hover:text-primary"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1">
                    Title
                  </label>
                  <input
                    required
                    type="text"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="e.g., Annual Hackathon 2026 Announced!"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-primary/80 mb-1">
                      Category
                    </label>
                    <select
                      value={announceCategory}
                      onChange={(e) =>
                        setAnnounceCategory(
                          e.target.value as "general" | "hr" | "event" | "policy",
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="general">General</option>
                      <option value="hr">Human Resources</option>
                      <option value="event">Company Event</option>
                      <option value="policy">Policy Update</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-xs font-medium text-primary/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcePinned}
                        onChange={(e) => setAnnouncePinned(e.target.checked)}
                        className="rounded border-border text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>Pin to Top</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1">
                    Content
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={announceContent}
                    onChange={(e) => setAnnounceContent(e.target.value)}
                    placeholder="Enter announcement details..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                {announceError && (
                  <p className="text-xs text-destructive">{announceError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAnnounceModal(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingAnnounce}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isSubmittingAnnounce ? "Posting…" : "Post"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 2: CREATE POLL ────────────────────────────────────────── */}
        {showPollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-primary">Create Team Poll</h3>
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="text-primary/60 hover:text-primary"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePoll} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1">
                    Question
                  </label>
                  <input
                    required
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="e.g., Which theme should we pick for the hackathon?"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-primary/80">
                    Options (min 2)
                  </label>
                  <input
                    required
                    type="text"
                    value={pollOption1}
                    onChange={(e) => setPollOption1(e.target.value)}
                    placeholder="Option 1"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <input
                    required
                    type="text"
                    value={pollOption2}
                    onChange={(e) => setPollOption2(e.target.value)}
                    placeholder="Option 2"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={pollOption3}
                    onChange={(e) => setPollOption3(e.target.value)}
                    placeholder="Option 3 (Optional)"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>

                {pollError && (
                  <p className="text-xs text-destructive">{pollError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPollModal(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPoll}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isSubmittingPoll ? "Publishing…" : "Publish Poll"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 3: GIVE KUDOS ─────────────────────────────────────────── */}
        {showKudosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-primary">Recognize a Colleague</h3>
                <button
                  type="button"
                  onClick={() => setShowKudosModal(false)}
                  className="text-primary/60 hover:text-primary"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendKudos} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1">
                    Select Colleague
                  </label>
                  <select
                    required
                    value={kudosReceiverId}
                    onChange={(e) => setKudosReceiverId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">-- Choose recipient --</option>
                    {eligibleColleagues.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.department || "General"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1">
                    Recognition Badge
                  </label>
                  <select
                    value={kudosBadge}
                    onChange={(e) => setKudosBadge(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="Team Player">🤝 Team Player</option>
                    <option value="Going the Extra Mile">🚀 Going the Extra Mile</option>
                    <option value="Problem Solver">💡 Problem Solver</option>
                    <option value="Innovator">✨ Innovator</option>
                    <option value="Customer Champion">🌟 Customer Champion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1">
                    Praise Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={kudosMessage}
                    onChange={(e) => setKudosMessage(e.target.value)}
                    placeholder="Write a message celebrating what they did..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                {kudosError && (
                  <p className="text-xs text-destructive">{kudosError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowKudosModal(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingKudos}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isSubmittingKudos ? "Sending…" : "Send Kudos"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
