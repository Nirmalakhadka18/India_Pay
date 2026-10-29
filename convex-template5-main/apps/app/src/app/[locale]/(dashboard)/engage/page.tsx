"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Award,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Filter,
  Grid,
  Heart,
  HelpCircle,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

// ── Hand-drawn Celebration Vector Illustration ───────────────────────────────

function CelebrationIllustration({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" className={className}>
      {/* Confetti & Streamers */}
      <circle cx="35" cy="40" r="2.5" fill="#F59E0B" />
      <circle cx="125" cy="35" r="3" fill="#EC4899" />
      <circle cx="45" cy="80" r="2" fill="#3B82F6" />
      <circle cx="130" cy="75" r="2.5" fill="#10B981" />
      <path d="M40 25 Q45 20 50 25 Q55 30 60 25" stroke="#EC4899" strokeWidth="1.5" fill="none" />
      <path d="M110 20 Q115 15 120 20 Q125 25 130 20" stroke="#3B82F6" strokeWidth="1.5" fill="none" />

      {/* Balloons */}
      <g transform="translate(10, 15)">
        <ellipse cx="30" cy="35" rx="8" ry="11" fill="#F87171" stroke="#DC2626" strokeWidth="1" />
        <path d="M30 46 L28 49 L32 49 Z" fill="#DC2626" />
        <path d="M30 49 Q25 65 35 75" stroke="#94A3B8" strokeWidth="1" fill="none" />

        <ellipse cx="44" cy="30" rx="9" ry="12" fill="#60A5FA" stroke="#2563EB" strokeWidth="1" />
        <path d="M44 42 L42 45 L46 45 Z" fill="#2563EB" />
        <path d="M44 45 Q50 60 40 75" stroke="#94A3B8" strokeWidth="1" fill="none" />
      </g>

      {/* Celebrating Person */}
      <g transform="translate(50, 45)">
        <circle cx="30" cy="20" r="8" fill="#FDE68A" stroke="#0F172A" strokeWidth="1.5" />
        <path d="M22 18 Q30 10 38 18" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M27 22 Q30 25 33 22" stroke="#0F172A" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        <path d="M22 36 L10 20 L5 12" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 36 L50 20 L55 12" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

        <path d="M22 34 L38 34 L40 65 L20 65 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
        <path d="M29 34 L31 34 L32 50 L30 54 L28 50 Z" fill="#3B82F6" />

        <path d="M20 65 L16 105 L26 105 L29 78 L32 78 L35 105 L45 105 L40 65 Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
        <ellipse cx="18" cy="106" rx="6" ry="2.5" fill="#0F172A" />
        <ellipse cx="43" cy="106" rx="6" ry="2.5" fill="#0F172A" />
      </g>
    </svg>
  );
}

// ── Time helper ─────────────────────────────────────────────────────────────

function timeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ── Types ───────────────────────────────────────────────────────────────────

type ActivityFilterType = "all" | "kudos" | "polls" | "posts";

interface FeedItem {
  id: string;
  rawId: string;
  type: "celebration" | "kudos" | "poll" | "post" | "announcement";
  title?: string;
  content: string;
  group: string;
  createdAt: number;
  authorName?: string;
  badge?: string;
  senderName?: string;
  receiverName?: string;
  pollData?: {
    pollId: Id<"polls">;
    question: string;
    options: string[];
    voteCounts: number[];
    totalVotes: number;
    hasVoted: boolean;
    myVoteIndex?: number | null;
  };
  celebrationData?: {
    name: string;
    joiningDate?: string;
    department?: string;
    designation?: string;
  };
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function EngagePage() {
  const { current, workspaces } = useWorkspace();
  const workspaceId = current ?? workspaces[0]?._id;

  const scoped = workspaceId ? { workspaceId } : "skip";
  const me = useQuery(api.employees.getMyProfile, scoped);
  const user = useQuery(api.users.getUser);
  const employees = useQuery(api.employees.list, scoped);
  const announcements = useQuery(api.engage.listAnnouncements, scoped);
  const polls = useQuery(api.engage.listPolls, scoped);
  const celebrations = useQuery(api.engage.listCelebrations, scoped);
  const kudos = useQuery(api.engage.listKudos, scoped);
  const posts = useQuery(api.engage.listPosts, scoped);
  const allReactions = useQuery(api.engage.listReactions, scoped);
  const allComments = useQuery(api.engage.listComments, scoped);

  // Mutations
  const createPost = useMutation(api.engage.createPost);
  const createPoll = useMutation(api.engage.createPoll);
  const votePoll = useMutation(api.engage.votePoll);
  const sendKudos = useMutation(api.engage.sendKudos);
  const toggleReaction = useMutation(api.engage.toggleReaction);
  const addComment = useMutation(api.engage.addComment);

  // Filter States
  const [activityFilter, setActivityFilter] = useState<ActivityFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All Groups");
  const [selectedLocation, setSelectedLocation] = useState<string>("All Locations");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All Departments");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Accordion Expand States
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [departmentExpanded, setDepartmentExpanded] = useState(false);

  // Action Modals State
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // Modal Fields
  const [kudosReceiverId, setKudosReceiverId] = useState("");
  const [kudosBadge, setKudosBadge] = useState("Team Player");
  const [kudosMessage, setKudosMessage] = useState("");
  const [isSubmittingKudos, setIsSubmittingKudos] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [pollOption3, setPollOption3] = useState("");
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postGroup, setPostGroup] = useState("General");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Active Comment Box States (activityId -> text)
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  // Voting feedback
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  // Authenticated Employee Details
  const employeeName = me?.firstName || user?.name || "Team Member";
  const initials =
    (me?.firstName?.[0] || user?.name?.[0] || "E").toUpperCase() +
    (me?.lastName?.[0] || "");

  // ── Unified Feed Construction ───────────────────────────────────────────────

  const feedItems: FeedItem[] = useMemo(() => {
    const list: FeedItem[] = [];

    // 1. Celebrations (New Joiners)
    if (celebrations?.newJoiners) {
      for (const nj of celebrations.newJoiners) {
        list.push({
          id: `joiner-${nj.employeeId}`,
          rawId: nj.employeeId,
          type: "celebration",
          title: `${nj.name} just joined us!`,
          content: `${nj.name} has joined us in the company on ${nj.joiningDate || "recently"}. Please join us in welcoming our newest team member.`,
          group: "Events",
          createdAt: Date.now() - 9 * 3600 * 1000, // 9 hours ago matching reference
          authorName: "IndiaPay",
          celebrationData: {
            name: nj.name,
            joiningDate: nj.joiningDate,
            department: nj.department,
            designation: nj.designation,
          },
        });
      }
    }

    // 2. Kudos
    if (kudos) {
      for (const k of kudos) {
        list.push({
          id: `kudos-${k._id}`,
          rawId: k._id,
          type: "kudos",
          title: `${k.senderName} praised ${k.receiverName}`,
          content: k.message,
          group: "Kudos",
          badge: k.badge,
          senderName: k.senderName,
          receiverName: k.receiverName,
          createdAt: k.createdAt,
        });
      }
    }

    // 3. Polls
    if (polls) {
      for (const p of polls) {
        list.push({
          id: `poll-${p._id}`,
          rawId: p._id,
          type: "poll",
          title: p.question,
          content: p.question,
          group: "Polls",
          authorName: p.creatorName,
          createdAt: p.createdAt,
          pollData: {
            pollId: p._id,
            question: p.question,
            options: p.options,
            voteCounts: p.voteCounts,
            totalVotes: p.totalVotes,
            hasVoted: p.hasVoted,
            myVoteIndex: p.myVoteIndex,
          },
        });
      }
    }

    // 4. Posts
    if (posts) {
      for (const post of posts) {
        list.push({
          id: `post-${post._id}`,
          rawId: post._id,
          type: "post",
          title: post.title,
          content: post.content,
          group: post.group || "General",
          authorName: post.authorName,
          createdAt: post.createdAt,
        });
      }
    }

    // 5. Announcements
    if (announcements) {
      for (const a of announcements) {
        list.push({
          id: `ann-${a._id}`,
          rawId: a._id,
          type: "announcement",
          title: a.title,
          content: a.content,
          group: a.category === "hr" ? "HR" : a.category === "event" ? "Events" : "General",
          authorName: a.authorName,
          createdAt: a.createdAt,
        });
      }
    }

    return list;
  }, [celebrations, kudos, polls, posts, announcements]);

  // ── Filter & Search Logic ──────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return feedItems
      .filter((item) => {
        // Activity type filter
        if (activityFilter === "kudos" && item.type !== "kudos") return false;
        if (activityFilter === "polls" && item.type !== "poll") return false;
        if (activityFilter === "posts" && item.type !== "post" && item.type !== "announcement") return false;

        // Group filter
        if (selectedGroup !== "All Groups" && item.group.toLowerCase() !== selectedGroup.toLowerCase()) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q) ?? false;
          const matchContent = item.content.toLowerCase().includes(q);
          const matchAuthor = item.authorName?.toLowerCase().includes(q) ?? false;
          const matchKudos =
            (item.senderName?.toLowerCase().includes(q) ?? false) ||
            (item.receiverName?.toLowerCase().includes(q) ?? false);
          if (!matchTitle && !matchContent && !matchAuthor && !matchKudos) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        return sortBy === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
      });
  }, [feedItems, activityFilter, selectedGroup, searchQuery, sortBy]);

  // Map reactions & comments per activityId
  const reactionsMap = useMemo(() => {
    const map = new Map<string, { count: number; hasReacted: boolean }>();
    if (!allReactions) return map;
    for (const r of allReactions) {
      const current = map.get(r.activityId) || { count: 0, hasReacted: false };
      current.count++;
      if (r.isMine) current.hasReacted = true;
      map.set(r.activityId, current);
    }
    return map;
  }, [allReactions]);

  const commentsMap = useMemo(() => {
    const map = new Map<string, Array<{ _id: string; userName: string; content: string; createdAt: number }>>();
    if (!allComments) return map;
    for (const c of allComments) {
      const list = map.get(c.activityId) || [];
      list.push(c);
      map.set(c.activityId, list);
    }
    return map;
  }, [allComments]);

  // ── Action Handlers ────────────────────────────────────────────────────────

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      setKudosError("Workspace is still loading, please wait.");
      return;
    }
    setKudosError(null);
    if (!kudosReceiverId) {
      setKudosError("Please select an employee to recognize.");
      return;
    }
    if (!kudosMessage.trim()) {
      setKudosError("Please write an appreciation message.");
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
      setKudosMessage("");
      setKudosReceiverId("");
    } catch (err) {
      setKudosError((err as Error).message || "Failed to send kudos.");
    } finally {
      setIsSubmittingKudos(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      setPollError("Workspace is still loading, please wait.");
      return;
    }
    setPollError(null);
    const options = [pollOption1, pollOption2, pollOption3].filter((o) => o.trim().length > 0);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      setPostError("Workspace is still loading, please wait.");
      return;
    }
    setPostError(null);
    if (!postContent.trim()) {
      setPostError("Post content cannot be empty.");
      return;
    }
    setIsSubmittingPost(true);
    try {
      await createPost({
        workspaceId,
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
        group: postGroup,
      });
      setShowPostModal(false);
      setPostTitle("");
      setPostContent("");
    } catch (err) {
      setPostError((err as Error).message || "Failed to submit post.");
    } finally {
      setIsSubmittingPost(false);
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

  const handleToggleReaction = async (activityId: string, activityType: string) => {
    if (!workspaceId) return;
    try {
      await toggleReaction({
        workspaceId,
        activityId,
        activityType,
        reactionType: "like",
      });
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  const handleAddComment = async (activityId: string, activityType: string) => {
    if (!workspaceId) return;
    const text = commentInputs[activityId]?.trim();
    if (!text) return;

    setIsSubmittingComment((prev) => ({ ...prev, [activityId]: true }));
    try {
      await addComment({
        workspaceId,
        activityId,
        activityType,
        content: text,
      });
      setCommentInputs((prev) => ({ ...prev, [activityId]: "" }));
    } catch (err) {
      alert((err as Error).message || "Failed to add comment.");
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeActivityTitle =
    activityFilter === "all"
      ? "All Activities"
      : activityFilter === "kudos"
        ? "Kudos"
        : activityFilter === "polls"
          ? "Polls"
          : "Posts";

  return (
    <div className="flex h-full w-full bg-[#f8fafc] px-6 py-6 dark:bg-black">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        {/* Breadcrumb: Engage */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <svg className="h-3.5 w-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
          </svg>
          <span>Engage</span>
        </div>

        {/* 1. greytHR Welcome Panel */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-border dark:bg-card">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f87171] font-bold text-sm text-white shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Hey {employeeName},
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready to dive in ?
              </p>
            </div>
          </div>

          {/* 3 Compact Action Tiles */}
          <div className="flex items-center gap-3">
            {/* Give Kudos Tile */}
            <button
              type="button"
              data-testid="give-kudos-tile"
              onClick={() => setShowKudosModal(true)}
              className="flex min-w-[76px] sm:min-w-[82px] flex-col items-center justify-center rounded-xl border border-pink-200 bg-pink-50/50 p-2.5 transition hover:bg-pink-100/60 dark:border-pink-900/40 dark:bg-pink-950/20"
            >
              <Award className="h-4 w-4 text-pink-500 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                Give
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                Kudos
              </span>
            </button>

            {/* Create Polls Tile */}
            <button
              type="button"
              data-testid="create-polls-tile"
              onClick={() => setShowPollModal(true)}
              className="flex min-w-[76px] sm:min-w-[82px] flex-col items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50/50 p-2.5 transition hover:bg-cyan-100/60 dark:border-cyan-900/40 dark:bg-cyan-950/20"
            >
              <BarChart2 className="h-4 w-4 text-cyan-500 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                Create
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                Polls
              </span>
            </button>

            {/* Create Posts Tile */}
            <button
              type="button"
              data-testid="create-posts-tile"
              onClick={() => setShowPostModal(true)}
              className="flex min-w-[76px] sm:min-w-[82px] flex-col items-center justify-center rounded-xl border border-purple-200 bg-purple-50/50 p-2.5 transition hover:bg-purple-100/60 dark:border-purple-900/40 dark:bg-purple-950/20"
            >
              <FileText className="h-4 w-4 text-purple-500 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                Create
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                Posts
              </span>
            </button>
          </div>
        </div>

        {/* 2. Main Two-Column Layout (Filters Left, Feed Right) */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Filter Panel */}
          <div className="w-full lg:w-60 shrink-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-border dark:bg-card space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Filters
              </h2>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Activities
              </p>

              {/* Activities Radio List */}
              <div className="space-y-1">
                {[
                  { key: "all", label: "All Activities", icon: Grid },
                  { key: "kudos", label: "Kudos", icon: Award },
                  { key: "polls", label: "Polls", icon: BarChart2 },
                  { key: "posts", label: "Posts", icon: FileText },
                ].map(({ key, label, icon: Icon }) => {
                  const isSelected = activityFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActivityFilter(key as ActivityFilterType)}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/40 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{label}</span>
                      </div>
                      <Icon className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative pt-1 border-t border-slate-100 dark:border-border/60">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-3 pr-8 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-border dark:bg-muted/50 dark:text-slate-100"
              />
              <Search className="absolute right-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Accordion: Groups */}
            <div className="border-t border-slate-100 dark:border-border/60 pt-2">
              <button
                type="button"
                onClick={() => setGroupsExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <span>Groups</span>
                {groupsExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
              {groupsExpanded && (
                <div className="mt-1 space-y-1 pl-1">
                  {["All Groups", "Events", "General", "Engineering", "HR"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGroup(g)}
                      className={`block w-full text-left rounded px-2 py-1 text-xs transition ${
                        selectedGroup === g
                          ? "bg-slate-100 font-semibold text-blue-600 dark:bg-muted"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion: Location */}
            <div className="border-t border-slate-100 dark:border-border/60 pt-2">
              <button
                type="button"
                onClick={() => setLocationExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <span>Location</span>
                {locationExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
              {locationExpanded && (
                <div className="mt-1 space-y-1 pl-1">
                  {["All Locations", "Bangalore", "Mumbai", "Remote"].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setSelectedLocation(loc)}
                      className={`block w-full text-left rounded px-2 py-1 text-xs transition ${
                        selectedLocation === loc
                          ? "bg-slate-100 font-semibold text-blue-600 dark:bg-muted"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion: Department */}
            <div className="border-t border-slate-100 dark:border-border/60 pt-2">
              <button
                type="button"
                onClick={() => setDepartmentExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <span>Department</span>
                {departmentExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
              {departmentExpanded && (
                <div className="mt-1 space-y-1 pl-1">
                  {["All Departments", "Engineering", "HR", "Finance", "Operations"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDepartment(d)}
                      className={`block w-full text-left rounded px-2 py-1 text-xs transition ${
                        selectedDepartment === d
                          ? "bg-slate-100 font-semibold text-blue-600 dark:bg-muted"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Central Activity Feed */}
          <div className="flex-1 min-w-0 space-y-3.5">
            {/* Feed Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-cyan-500" />
                <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {activeActivityTitle} - {selectedGroup}
                </h2>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none dark:border-border dark:bg-card dark:text-slate-200"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {/* Feed Cards List */}
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-border dark:bg-card">
                <Smile className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No activities found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are no updates matching your current filters. Try selecting &ldquo;All Activities&rdquo; or clearing your search.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const reactions = reactionsMap.get(item.id) || { count: 0, hasReacted: false };
                const comments = commentsMap.get(item.id) || [];
                const isCommentsOpen = openComments[item.id] ?? false;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden dark:border-border dark:bg-card transition hover:border-slate-300"
                  >
                    {/* Card Top Branding & Group */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-border/60">
                      <div className="flex items-center gap-2">
                        {/* IndiaPay Yellow Reference Logo Tag */}
                        <div className="bg-[#facc15] px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider text-slate-900 shadow-xs">
                          IndiaPay
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          Group: {item.group}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {item.type === "celebration" ? (
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <CelebrationIllustration className="w-24 h-24 shrink-0" />
                          <div className="space-y-1.5 text-center sm:text-left">
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.content}
                            </p>
                            <div className="inline-flex items-center gap-2 pt-1">
                              <div className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                                {item.celebrationData?.name?.[0] || "U"}
                              </div>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                {item.celebrationData?.name} just joined us!
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : item.type === "kudos" ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-semibold text-pink-600 border border-pink-200 dark:bg-pink-950/40 dark:border-pink-900/40">
                              Kudos • {item.badge}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {item.title}
                          </p>
                          <blockquote className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 italic border-l-2 border-pink-400 dark:bg-muted/40 dark:text-slate-300">
                            &ldquo;{item.content}&rdquo;
                          </blockquote>
                        </div>
                      ) : item.type === "poll" && item.pollData ? (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {item.pollData.question}
                          </h3>
                          <div className="space-y-2">
                            {item.pollData.options.map((opt, optIdx) => {
                              const voteCount = item.pollData?.voteCounts?.[optIdx] ?? 0;
                              const pct =
                                (item.pollData?.totalVotes ?? 0) > 0
                                  ? Math.round((voteCount / (item.pollData?.totalVotes ?? 1)) * 100)
                                  : 0;
                              const isMyVote = item.pollData?.myVoteIndex === optIdx;

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={item.pollData?.hasVoted || votingPollId === item.pollData?.pollId}
                                  onClick={() => item.pollData && handleVote(item.pollData.pollId, optIdx)}
                                  className={`relative w-full overflow-hidden rounded-lg border p-2.5 text-left text-xs transition ${
                                    isMyVote
                                      ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 font-semibold"
                                      : "border-slate-200 hover:border-cyan-300 bg-white dark:border-border dark:bg-card"
                                  }`}
                                >
                                  {/* Percentage Fill Bar */}
                                  {item.pollData?.hasVoted && (
                                    <div
                                      className="absolute inset-y-0 left-0 bg-cyan-100/60 dark:bg-cyan-950/50 transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  )}
                                  <div className="relative flex items-center justify-between">
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {opt} {isMyVote && "✓"}
                                    </span>
                                    {item.pollData?.hasVoted && (
                                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                                        {pct}% ({voteCount})
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {item.pollData.totalVotes} total vote{item.pollData.totalVotes !== 1 ? "s" : ""}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {item.title && (
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {item.title}
                            </h3>
                          )}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                          {item.authorName && (
                            <p className="text-[10px] text-slate-400 pt-1">
                              Posted by {item.authorName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Reaction & Comment Buttons */}
                    <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-2.5 bg-slate-50/30 dark:border-border/60 dark:bg-muted/10 text-xs">
                      {/* Reaction Action */}
                      <button
                        type="button"
                        onClick={() => handleToggleReaction(item.id, item.type)}
                        className={`flex items-center gap-1.5 font-medium transition ${
                          reactions.hasReacted
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <ThumbsUp
                          className={`h-3.5 w-3.5 ${
                            reactions.hasReacted ? "fill-blue-600 text-blue-600" : ""
                          }`}
                        />
                        <span>Reaction</span>
                        {reactions.count > 0 && (
                          <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 dark:bg-muted dark:text-slate-300">
                            {reactions.count}
                          </span>
                        )}
                      </button>

                      {/* Comment Action */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800 transition dark:text-slate-400"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Comment</span>
                        {comments.length > 0 && (
                          <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 dark:bg-muted dark:text-slate-300">
                            {comments.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Expandable Comments Drawer */}
                    {isCommentsOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3 dark:border-border/60 dark:bg-muted/20">
                        {comments.length > 0 && (
                          <div className="space-y-2">
                            {comments.map((c) => (
                              <div
                                key={c._id}
                                className="rounded-lg bg-white p-2.5 text-xs shadow-2xs border border-slate-100 dark:bg-card dark:border-border"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    {c.userName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {timeAgo(c.createdAt)}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300">
                                  {c.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[item.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(item.id, item.type);
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-border dark:bg-card dark:text-slate-100"
                          />
                          <Button
                            size="sm"
                            data-testid="submit-comment-btn"
                            disabled={isSubmittingComment[item.id] || !commentInputs[item.id]?.trim()}
                            onClick={() => handleAddComment(item.id, item.type)}
                            className="bg-[#4361ee] hover:bg-[#3b53cc] text-white text-xs px-3"
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Give Kudos Modal ─────────────────────────────────────────────────── */}
      {showKudosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                <Award className="h-5 w-5" />
                <h3 className="font-semibold text-sm text-primary">Give Kudos</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKudosModal(false)}
                className="text-primary/40 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendKudos} className="space-y-4">
              {kudosError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{kudosError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Recipient Colleague
                </label>
                <select
                  value={kudosReceiverId}
                  onChange={(e) => setKudosReceiverId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="">Select a colleague...</option>
                  {(employees ?? [])
                    .filter((e) => e._id !== me?._id)
                    .map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.firstName} {e.lastName} ({e.designation || e.department || "Employee"})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Recognition Badge
                </label>
                <select
                  value={kudosBadge}
                  onChange={(e) => setKudosBadge(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="Team Player">🤝 Team Player</option>
                  <option value="Going the Extra Mile">🚀 Going the Extra Mile</option>
                  <option value="Innovator">💡 Innovator</option>
                  <option value="Customer Champion">🌟 Customer Champion</option>
                  <option value="Rockstar Performer">🎸 Rockstar Performer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Appreciation Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Share what makes their contribution special..."
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKudosModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingKudos}
                  className="bg-pink-600 hover:bg-pink-700 text-white text-xs gap-1.5"
                >
                  {isSubmittingKudos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                  Send Kudos
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Poll Modal ────────────────────────────────────────────────── */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <BarChart2 className="h-5 w-5" />
                <h3 className="font-semibold text-sm text-primary">Create Team Poll</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="text-primary/40 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              {pollError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pollError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Poll Question
                </label>
                <input
                  type="text"
                  placeholder="What would you like to ask the team?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-primary">
                  Answer Options
                </label>
                <input
                  type="text"
                  placeholder="Option 1"
                  value={pollOption1}
                  onChange={(e) => setPollOption1(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Option 2"
                  value={pollOption2}
                  onChange={(e) => setPollOption2(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Option 3 (Optional)"
                  value={pollOption3}
                  onChange={(e) => setPollOption3(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPollModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingPoll}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs gap-1.5"
                >
                  {isSubmittingPoll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart2 className="h-3.5 w-3.5" />}
                  Publish Poll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Post Modal ────────────────────────────────────────────────── */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold text-sm text-primary">Create Post</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-primary/40 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {postError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{postError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Target Group
                </label>
                <select
                  value={postGroup}
                  onChange={(e) => setPostGroup(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="General">General</option>
                  <option value="Events">Events</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR & Culture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  data-testid="post-title-input"
                  placeholder="Post headline..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Post Content
                </label>
                <textarea
                  rows={4}
                  data-testid="post-content-input"
                  placeholder="Share updates, ideas, or questions with the team..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  data-testid="publish-post-btn"
                  disabled={isSubmittingPost}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                >
                  {isSubmittingPost ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Publish Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
