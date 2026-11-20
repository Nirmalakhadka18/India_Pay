"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  PlusCircle,
  Send,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [
  "pdf",
  "xls",
  "xlsx",
  "doc",
  "docx",
  "txt",
  "ppt",
  "pptx",
  "gif",
  "jpg",
  "jpeg",
  "png",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function HelpdeskPage() {
  const { current: workspaceId, workspaces } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const tickets = useQuery(api.helpdesk.listMyTickets, scoped);
  const employees = useQuery(api.employees.list, scoped);

  type TicketItem = NonNullable<typeof tickets>[number];

  const createTicket = useMutation(api.helpdesk.createTicket);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);

  // Page View State: "active" | "closed"
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("high");

  // CC to Recipients State
  const [ccList, setCcList] = useState<string[]>([]);
  const [isAddingCc, setIsAddingCc] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [ccError, setCcError] = useState<string | null>(null);

  // Attachment State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Submission & Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successTicketNumber, setSuccessTicketNumber] = useState<string | null>(
    null,
  );

  // Determine dynamic assignee based on category and workspace data
  const assigneeName = useMemo(() => {
    if (!category) return "";

    // Find designated HR / Admin in the employee list
    const hrEmployee = employees?.find((e) => {
      const dept = (e.department || "").toLowerCase();
      const desig = (e.designation || "").toLowerCase();
      return (
        dept.includes("hr") ||
        dept.includes("human resources") ||
        desig.includes("hr") ||
        desig.includes("admin")
      );
    });

    if (hrEmployee) {
      return `${hrEmployee.firstName} ${hrEmployee.lastName}`;
    }

    // Fallback to first non-self employee or workspace owner name
    const currentWorkspace = workspaces.find((w) => w._id === workspaceId);
    if (currentWorkspace?.name) {
      return "HR Support Desk";
    }

    return "HR Administrator";
  }, [category, employees, workspaces, workspaceId]);

  // Filter tickets into Active vs Closed
  const activeTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(
      (t) => t.status === "open" || t.status === "in_progress",
    );
  }, [tickets]);

  const closedTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed",
    );
  }, [tickets]);

  const currentDisplayTickets =
    activeTab === "active" ? activeTickets : closedTickets;

  // Modal Actions
  const handleOpenModal = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("high");
    setCcList([]);
    setCcInput("");
    setCcError(null);
    setAttachedFile(null);
    setFileError(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
  };

  // CC Handlers
  const handleAddCc = () => {
    const trimmed = ccInput.trim();
    if (!trimmed) {
      setIsAddingCc(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setCcError("Please enter a valid email address.");
      return;
    }
    if (ccList.includes(trimmed)) {
      setCcError("This email has already been added.");
      return;
    }
    setCcList([...ccList, trimmed]);
    setCcInput("");
    setCcError(null);
    setIsAddingCc(false);
  };

  const handleRemoveCc = (emailToRemove: string) => {
    setCcList(ccList.filter((e) => e !== emailToRemove));
  };

  // File Attachment Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(
        `Invalid file type .${ext}. Supported: ${ALLOWED_EXTENSIONS.join(", ")}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File exceeds 10MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError(null);
    setAttachedFile(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // greytHR exact categories
  const HELPDESK_CATEGORIES = [
    "Employee Information",
    "Income Tax",
    "Loans",
    "Others",
    "Payslip",
  ] as const;

  type HelpdeskCategory = (typeof HELPDESK_CATEGORIES)[number];

  // Map display category to backend enum
  const CATEGORY_TO_BACKEND: Record<
    string,
    "payroll" | "leaves" | "attendance" | "benefits" | "general"
  > = {
    "Employee Information": "general",
    "Income Tax": "payroll",
    Loans: "benefits",
    Others: "general",
    Payslip: "payroll",
  };

  // Selected Ticket for Details Modal
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [newComment, setNewComment] = useState("");
  const [ticketComments, setTicketComments] = useState<
    Record<string, { author: string; text: string; time: string }[]>
  >({});
  const [withdrawingTicketId, setWithdrawingTicketId] = useState<string | null>(
    null,
  );

  const getTicketDisplayCategory = (t: TicketItem) => {
    const desc = t.description || "";
    if (desc.startsWith("[Category: ")) {
      const match = desc.match(/^\[Category:\s*([^\]]+)\]/);
      if (match) return match[1];
    }
    const cat = t.category;
    if (cat === "payroll") return "Payslip";
    if (cat === "leaves") return "Others";
    if (cat === "benefits") return "Loans";
    if (cat === "attendance") return "Employee Information";
    if (t.category === "general") return "Employee Information";
    return t.category;
  };

  const handleAddComment = (ticketId: string) => {
    if (!newComment.trim()) return;
    const author = me ? `${me.firstName} ${me.lastName}` : "You";
    const commentObj = {
      author,
      text: newComment.trim(),
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setTicketComments((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), commentObj],
    }));
    setNewComment("");
  };

  const handleWithdrawTicket = (ticketId: string) => {
    setWithdrawingTicketId(ticketId);
    setTimeout(() => {
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: "closed" });
      }
      setWithdrawingTicketId(null);
    }, 600);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setFormError(null);

    if (!category) {
      setFormError("Please select a Category.");
      return;
    }

    if (!subject.trim()) {
      setFormError("Subject line cannot be empty.");
      return;
    }

    if (!description.trim()) {
      setFormError("Description cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalDescription = `[Category: ${category}]\n\n${description.trim()}`;

      // If CC list is present, append informational metadata
      if (ccList.length > 0) {
        finalDescription += `\n\n[CC: ${ccList.join(", ")}]`;
      }

      // If file is attached, upload to Convex Storage
      if (attachedFile) {
        const uploadUrl = await generateUploadUrl({ workspaceId });
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": attachedFile.type || "application/octet-stream",
          },
          body: attachedFile,
        });
        if (!res.ok) throw new Error("File upload failed");
        const { storageId } = await res.json();

        await saveFile({
          workspaceId,
          storageId: storageId as Id<"_storage">,
          name: attachedFile.name,
          size: attachedFile.size,
          contentType: attachedFile.type || "application/octet-stream",
        });

        finalDescription += `\n[Attached File: ${attachedFile.name} (${Math.round(attachedFile.size / 1024)} KB)]`;
      }

      const backendCategory = CATEGORY_TO_BACKEND[category] || "general";

      const ticketNum = await createTicket({
        workspaceId,
        category: backendCategory,
        priority,
        subject: subject.trim(),
        description: finalDescription,
      });

      setSuccessTicketNumber(ticketNum);
      setIsModalOpen(false);
      setActiveTab("active");

      // Auto clear banner after 8s
      setTimeout(() => {
        setSuccessTicketNumber(null);
      }, 8000);
    } catch (err) {
      setFormError(
        (err as Error).message || "Failed to create helpdesk request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-black min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8 space-y-4">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            {/* greytHR folded colorful icon */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6C4 4.89543 4.89543 4 6 4H15L20 9V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
                fill="#818CF8"
                fillOpacity="0.2"
              />
              <path
                d="M14 4V9H19"
                stroke="#6366F1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 13H16M8 17H13"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h1 className="text-base font-medium text-slate-800 dark:text-slate-100">
              Helpdesk
            </h1>
          </div>

          {/* Centered Active / Closed Pills */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`px-6 py-1.5 text-xs font-medium rounded-l transition shadow-sm ${
                activeTab === "active"
                  ? "bg-[#0091FF] text-white"
                  : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("closed")}
              className={`px-6 py-1.5 text-xs font-medium rounded-r transition shadow-sm ${
                activeTab === "closed"
                  ? "bg-[#0091FF] text-white"
                  : "bg-white text-slate-600 border border-l-0 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              Closed
            </button>
          </div>

          {/* New Request Button */}
          <div>
            <button
              type="button"
              onClick={handleOpenModal}
              className="rounded-md border border-[#0091FF] bg-white px-4 py-1.5 text-xs font-medium text-[#0091FF] hover:bg-blue-50/60 dark:bg-transparent dark:hover:bg-blue-950/30 transition shadow-sm"
            >
              New Request
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successTicketNumber && (
          <div className="flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Ticket <strong>#{successTicketNumber}</strong> has been created
                successfully. HR Support has been assigned.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessTicketNumber(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content Area / Empty State */}
        <div className="rounded-lg border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm min-h-[460px] flex flex-col justify-center items-center p-8">
          {tickets === undefined ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#0091FF]" />
              <span className="text-xs">Loading requests…</span>
            </div>
          ) : currentDisplayTickets.length === 0 ? (
            /* greytHR Signature Empty State Illustration */
            <div className="flex flex-col items-center justify-center text-center select-none py-10">
              <svg
                className="w-48 h-36 mb-2"
                viewBox="0 0 200 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Decorative background crosshairs & dots */}
                <path
                  d="M20 75H26M23 72V78"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M175 40H181M178 37V43"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="160" cy="80" r="2.5" fill="#CBD5E1" />
                <circle cx="30" cy="115" r="2" fill="#CBD5E1" />
                <path
                  d="M170 95H176"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Desk/Table baseline shadow */}
                <rect
                  x="25"
                  y="130"
                  width="150"
                  height="3"
                  rx="1.5"
                  fill="#E2E8F0"
                />

                {/* Laptop / Computer Monitor */}
                <rect
                  x="55"
                  y="45"
                  width="90"
                  height="65"
                  rx="4"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  fill="#F8FAFC"
                />
                <rect
                  x="62"
                  y="52"
                  width="76"
                  height="51"
                  rx="2"
                  fill="#FFFFFF"
                />

                {/* Chat Bubble on Laptop */}
                <rect
                  x="75"
                  y="30"
                  width="48"
                  height="26"
                  rx="4"
                  fill="#E2E8F0"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />
                <path d="M85 56L82 62L91 56H85Z" fill="#E2E8F0" />
                <circle cx="89" cy="43" r="2" fill="#94A3B8" />
                <circle cx="99" cy="43" r="2" fill="#94A3B8" />
                <circle cx="109" cy="43" r="2" fill="#94A3B8" />

                {/* Profile Card inside Screen */}
                <rect
                  x="82"
                  y="66"
                  width="36"
                  height="30"
                  rx="2"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  fill="#F1F5F9"
                />
                <circle cx="100" cy="76" r="4" fill="#94A3B8" />
                <path
                  d="M93 88C93 85 96 83 100 83C104 83 107 85 107 88"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Stand */}
                <path
                  d="M92 110L90 120H110L108 110"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  fill="#E2E8F0"
                />
                <rect
                  x="75"
                  y="120"
                  width="50"
                  height="3"
                  rx="1.5"
                  fill="#94A3B8"
                />

                {/* Calendar with X beside laptop */}
                <rect
                  x="40"
                  y="75"
                  width="34"
                  height="36"
                  rx="3"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  fill="#FFFFFF"
                />
                <rect
                  x="40"
                  y="75"
                  width="34"
                  height="8"
                  rx="2"
                  fill="#CBD5E1"
                />
                <circle cx="47" cy="72" r="1.5" fill="#94A3B8" />
                <circle cx="67" cy="72" r="1.5" fill="#94A3B8" />
                <circle
                  cx="57"
                  cy="94"
                  r="7"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  fill="#F8FAFC"
                />
                <path
                  d="M54 91L60 97M60 91L54 97"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-xs text-slate-400 font-normal mt-1">
                No helpdesk items
              </p>
            </div>
          ) : (
            /* Ticket List Table */
            <div className="w-full overflow-x-auto self-start">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ticket #</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentDisplayTickets.map((t) => (
                    <tr
                      key={t._id}
                      tabIndex={0}
                      onClick={() => setSelectedTicket(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedTicket(t);
                        }
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <td className="px-4 py-3 font-semibold text-[#0091FF]">
                        {t.ticketNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {getTicketDisplayCategory(t)}
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {assigneeName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 capitalize font-medium text-slate-700 dark:text-slate-300">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              t.priority === "urgent"
                                ? "bg-purple-500"
                                : t.priority === "high"
                                  ? "bg-red-500"
                                  : t.priority === "medium"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                            }`}
                          />
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                            t.status === "open"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200"
                              : t.status === "in_progress"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 py-3">
          main-2544 | Privacy Policy | Terms Of Service
        </div>
      </div>

      {/* ── NEW REQUEST MODAL (EXACT GREYTHR MATCH) ─────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[620px] rounded-lg bg-white shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Modal Header */}
            <div className="bg-[#F0F4F8] px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
              <h2
                id="modal-title"
                className="text-sm font-semibold text-slate-700"
              >
                New Request
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Row 1: Category & Assigned to */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="ticket-category"
                    className="block text-xs font-normal text-slate-600 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="ticket-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Category..</option>
                    {HELPDESK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-600 mb-1">
                    Assigned to
                  </label>
                  <div className="pt-2 text-xs font-medium text-slate-700 min-h-[34px]">
                    {category ? assigneeName : ""}
                  </div>
                </div>
              </div>

              {/* Row 2: Subject */}
              <div>
                <label
                  htmlFor="ticket-subject"
                  className="block text-xs font-normal text-slate-600 mb-1"
                >
                  Subject<span className="text-red-500">*</span>
                </label>
                <input
                  id="ticket-subject"
                  type="text"
                  placeholder="Subject line.."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 3: Description */}
              <div>
                <label
                  htmlFor="ticket-description"
                  className="block text-xs font-normal text-slate-600 mb-1"
                >
                  Description<span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ticket-description"
                  rows={5}
                  placeholder="Write here.."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Row 4: Attach File */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium cursor-pointer">
                    <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                    <span>Attach File</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.xls,.xlsx,.doc,.docx,.txt,.ppt,.pptx,.gif,.jpg,.jpeg,.png"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">
                    File Types: pdf ,xls ,xlsx ,doc ,docx ,txt ,ppt ,pptx ,gif
                    ,jpg ,jpeg ,png
                  </span>
                </div>

                {attachedFile && (
                  <div className="inline-flex items-center gap-2 rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-700 border border-slate-200 mt-1">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-medium truncate max-w-[220px]">
                      {attachedFile.name}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      ({Math.round(attachedFile.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-slate-600 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-[11px] text-red-500">{fileError}</p>
                )}
              </div>

              {/* Row 5: CC to & Priority */}
              <div className="flex items-start justify-between gap-6 pt-1">
                {/* CC to */}
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-normal text-slate-600 mb-1">
                    CC to
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ccList.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 border border-slate-200"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCc(email)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}

                    {isAddingCc ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="email"
                          placeholder="name@company.com"
                          value={ccInput}
                          onChange={(e) => setCcInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCc();
                            }
                            if (e.key === "Escape") {
                              setIsAddingCc(false);
                              setCcInput("");
                            }
                          }}
                          onBlur={handleAddCc}
                          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-44"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingCc(true)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 cursor-pointer font-medium"
                      >
                        <PlusCircle className="h-4 w-4 text-slate-400" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                  {ccError && (
                    <p className="text-[11px] text-red-500">{ccError}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="w-36">
                  <label
                    htmlFor="ticket-priority"
                    className="block text-xs font-normal text-slate-600 mb-1"
                  >
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      id="ticket-priority"
                      value={priority}
                      onChange={(e) =>
                        setPriority(
                          e.target.value as
                            | "low"
                            | "medium"
                            | "high"
                            | "urgent",
                        )
                      }
                      className="w-full rounded border border-slate-300 bg-white pl-6 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {/* Status Color Dot */}
                    <span
                      className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full pointer-events-none ${
                        priority === "urgent"
                          ? "bg-purple-500"
                          : priority === "high"
                            ? "bg-red-500"
                            : priority === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Form Validation Error Banner */}
              {formError && (
                <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Footer (Centered Buttons Matching greytHR) */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md border border-[#0091FF] bg-white text-[#0091FF] hover:bg-blue-50/70 px-8 py-2 text-xs font-medium transition min-w-[110px] disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-md bg-[#0091FF] text-white hover:bg-[#007cdb] px-8 py-2 text-xs font-medium transition min-w-[110px] disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TICKET DETAILS & CONVERSATION MODAL (GREYTHR PARITY) ─────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[720px] rounded-lg bg-white shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
          >
            {/* Header */}
            <div className="bg-[#F0F4F8] px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0091FF]">
                  {selectedTicket.ticketNumber}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-700">
                  {getTicketDisplayCategory(selectedTicket)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
              {/* Subject & Status */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Created on{" "}
                    {new Date(selectedTicket.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                      selectedTicket.status === "open"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : selectedTicket.status === "in_progress"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium capitalize text-slate-600">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        selectedTicket.priority === "urgent"
                          ? "bg-purple-500"
                          : selectedTicket.priority === "high"
                            ? "bg-red-500"
                            : selectedTicket.priority === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                      }`}
                    />
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Description
                </span>
                <div className="rounded-md bg-slate-50 border border-slate-200/80 p-3.5 whitespace-pre-line text-slate-800 text-xs">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Timeline
                </span>
                <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-[#0091FF] border-2 border-white ring-2 ring-[#0091FF]/20" />
                    <p className="font-medium text-slate-800">
                      Request Submitted
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(selectedTicket.createdAt).toLocaleString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-200" />
                    <p className="font-medium text-slate-800">
                      Assigned to HR Administrator ({assigneeName})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Under review by HR team
                    </p>
                  </div>
                  {selectedTicket.status === "closed" && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200" />
                      <p className="font-medium text-slate-800">
                        Request Withdrawn / Resolved
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ticket has been closed
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments & Activity */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Comments
                </span>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(ticketComments[selectedTicket._id] || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">
                      No comments yet. Type below to reply.
                    </p>
                  ) : (
                    (ticketComments[String(selectedTicket._id)] || []).map(
                      (c, i) => (
                        <div
                          key={`${c.author}-${c.time}-${i}`}
                          className="rounded bg-slate-50 border border-slate-200/70 p-2.5"
                        >
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                            <span>{c.author}</span>
                            <span className="text-slate-400 text-[10px]">
                              {c.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 mt-1">
                            {c.text}
                          </p>
                        </div>
                      ),
                    )
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Type your comment or clarification..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment(selectedTicket._id);
                      }
                    }}
                    className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(selectedTicket._id)}
                    className="rounded bg-[#0091FF] text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Withdraw Action */}
            <div className="px-6 py-3 bg-[#F0F4F8] border-t border-slate-200/80 flex items-center justify-between">
              <div>
                {selectedTicket.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => handleWithdrawTicket(selectedTicket._id)}
                    disabled={withdrawingTicketId === selectedTicket._id}
                    className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {withdrawingTicketId === selectedTicket._id
                      ? "Withdrawing..."
                      : "Withdraw Request"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-5 py-1.5 text-xs font-medium transition cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
