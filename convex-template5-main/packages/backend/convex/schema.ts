import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Multi-tenant: resources carry workspaceId. It is `optional` on pre-existing tables only so
// deploys don't fail validation against pre-migration rows; the function layer always sets it.
export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    username: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  }).index("email", ["email"]),

  events: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    source: v.string(),
    type: v.string(),
    payload: v.any(),
    receivedAt: v.number(),
  })
    .index("by_received", ["receivedAt"])
    .index("by_workspace", ["workspaceId"]),

  jobs: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    userId: v.id("users"),
    kind: v.string(),
    status: v.string(),
    input: v.optional(v.any()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"]),

  auditLogs: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    userId: v.id("users"),
    action: v.string(),
    meta: v.optional(v.any()),
    at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"]),

  usage: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    userId: v.optional(v.id("users")),
    metric: v.string(),
    count: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_metric", ["userId", "metric"])
    .index("by_workspace_metric", ["workspaceId", "metric"]),

  apiKeys: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    userId: v.id("users"),
    name: v.string(),
    prefix: v.string(),
    hash: v.string(),
    revoked: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_hash", ["hash"]),

  // Files (workspace-scoped). Stored in Convex file storage; row holds metadata.
  files: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    storageId: v.id("_storage"),
    size: v.number(),
    contentType: v.string(),
    createdAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }),
  members: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_user_workspace", ["userId", "workspaceId"]),
  invites: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.string(),
    invitedBy: v.id("users"),
    accepted: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_email", ["email"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  // Maintained counters so dashboard.stats is O(1) instead of scanning every row.
  counters: defineTable({
    workspaceId: v.id("workspaces"),
    metric: v.string(),
    value: v.number(),
  }).index("by_workspace_metric", ["workspaceId", "metric"]),

  employees: defineTable({
    workspaceId: v.id("workspaces"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    designation: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    userId: v.optional(v.id("users")),
    employeeIdNumber: v.optional(v.string()),
    joiningDate: v.optional(v.string()),
    // Banking Master Data
    bankAccountHolderName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    // Statutory Master Data
    pan: v.optional(v.string()),
    uan: v.optional(v.string()),
    esicIpNumber: v.optional(v.string()),
    pfMemberId: v.optional(v.string()),
    isPfMember: v.optional(v.boolean()),
    isEsiMember: v.optional(v.boolean()),
    isRemoved: v.optional(v.boolean()),
    removedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_email", ["email"]),

  salaries: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    basicSalary: v.number(),
    allowances: v.array(v.object({ name: v.string(), amount: v.number() })),
    deductions: v.array(v.object({ name: v.string(), amount: v.number() })),
    grossSalary: v.number(),
    effectiveDate: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"])
    .index("by_employee_date", ["employeeId", "effectiveDate"]),

  attendance: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    date: v.string(), // "YYYY-MM-DD"
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("half_day"),
      v.literal("paid_leave"),
      v.literal("unpaid_leave"),
    ),
    checkInTime: v.optional(v.string()), // "HH:MM"
    checkOutTime: v.optional(v.string()), // "HH:MM"
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_date", ["workspaceId", "date"])
    .index("by_employee", ["employeeId"])
    .index("by_employee_date", ["employeeId", "date"]),

  leaveRequests: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    leaveType: v.union(
      v.literal("casual"),
      v.literal("sick"),
      v.literal("earned"),
      v.literal("unpaid"),
      v.literal("restricted_holiday"),
      v.literal("comp_off"),
    ),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(), // "YYYY-MM-DD"
    daysCount: v.number(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    session: v.optional(
      v.union(
        v.literal("full_day"),
        v.literal("session_1"),
        v.literal("session_2"),
      ),
    ),
    contactDetails: v.optional(v.string()),
    fileAttachment: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    reviewedBy: v.optional(v.id("users")),
    reviewRemarks: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_employee", ["employeeId"])
    .index("by_employee_status", ["employeeId", "status"]),

  lopSettings: defineTable({
    workspaceId: v.id("workspaces"),
    calculationBasis: v.union(
      v.literal("calendar_days"), // Gross / Days in Month
      v.literal("fixed_30_days"), // Gross / 30
      v.literal("working_days"), // Gross / (Month Days - Standard Weekends)
    ),
    includeUnpaidLeave: v.boolean(),
    includeAbsent: v.boolean(),
    halfDayFactor: v.number(), // standard 0.5
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  payrollRuns: defineTable({
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(), // "YYYY-MM-DD"
    status: v.union(
      v.literal("draft"),
      v.literal("calculated"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("processed"),
    ),
    totalEmployees: v.number(),
    totalGrossSalary: v.number(),
    totalLopDeduction: v.number(),
    totalCustomDeductions: v.number(),
    totalStatutoryDeductions: v.number(),
    totalEmployerContributions: v.optional(v.number()),
    totalNetSalary: v.number(),
    createdById: v.id("users"),
    submittedBy: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
    finalizedBy: v.optional(v.id("users")),
    finalizedAt: v.optional(v.number()),
    // Supplementary Run Fields (optional for full backward compatibility)
    runType: v.optional(
      v.union(v.literal("regular"), v.literal("supplementary")),
    ),
    originalPayrollRunId: v.optional(v.id("payrollRuns")),
    targetEmployeeId: v.optional(v.id("employees")),
    adjustmentReason: v.optional(v.string()),
    adjustmentCategory: v.optional(v.string()),
    correctionKey: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_period", ["workspaceId", "periodMonth"]),

  payrollItems: defineTable({
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
    employeeId: v.id("employees"),
    salaryId: v.optional(v.id("salaries")),
    basicSalary: v.number(),
    allowances: v.array(v.object({ name: v.string(), amount: v.number() })),
    grossSalary: v.number(),
    lopDays: v.number(),
    lopDeduction: v.number(),
    customDeductions: v.array(
      v.object({ name: v.string(), amount: v.number() }),
    ),
    totalCustomDeductions: v.number(),
    statutoryDeductions: v.array(
      v.object({
        name: v.string(),
        amount: v.number(),
        isConfigured: v.boolean(),
      }),
    ),
    totalStatutoryDeductions: v.number(),
    employerContributions: v.array(
      v.object({
        name: v.string(),
        amount: v.number(),
        isConfigured: v.boolean(),
      }),
    ),
    totalEmployerContributions: v.optional(v.number()),
    totalDeductions: v.number(),
    netSalary: v.number(),
    hasSalaryStructure: v.boolean(),
    warnings: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_run", ["payrollRunId"])
    .index("by_employee", ["employeeId"]),

  workspaceCompliance: defineTable({
    workspaceId: v.id("workspaces"),
    epfEnabled: v.boolean(),
    epfWageCeiling: v.optional(v.number()), // Statutory default is 15000
    epfRestrictToCeiling: v.optional(v.boolean()), // true = restrict to wage ceiling, false = actual basic
    epsEnabled: v.optional(v.boolean()), // 8.33% EPS pension allocation
    epsWageCeiling: v.optional(v.number()), // EPS ceiling default 15000 (capping EPS at 1250)
    edliEnabled: v.optional(v.boolean()), // 0.5% EDLI insurance
    adminChargesEnabled: v.optional(v.boolean()), // 0.5% admin charges
    epfEstablishmentCode: v.optional(v.string()), // Optional EPFO Establishment Code (e.g. MHBAN0012345000)
    esiEnabled: v.boolean(),
    esiWageCeiling: v.optional(v.number()), // Statutory default 21000
    ptState: v.optional(v.string()), // e.g., "Karnataka"
    ptEnabled: v.boolean(),
    lwfEnabled: v.optional(v.boolean()),
    lwfState: v.optional(v.string()), // e.g., "Karnataka", "Maharashtra"
    // Employer TDS Master Data (Form 138 / Form 24Q)
    tan: v.optional(v.string()), // 10-char Tax Deduction Account Number, e.g. BLRK12345A
    employerPan: v.optional(v.string()), // 10-char Employer PAN
    deductorType: v.optional(
      v.union(
        v.literal("company"),
        v.literal("individual"),
        v.literal("firm"),
        v.literal("government"),
        v.literal("other"),
      ),
    ),
    paoCode: v.optional(v.string()), // Pay and Accounts Office Code (e.g. PAO001)
    ddoCode: v.optional(v.string()), // Drawing and Disbursing Office Code (e.g. DDO001)
    ministryName: v.optional(v.string()), // Ministry Name for Government deductors
    responsiblePersonName: v.optional(v.string()),
    responsiblePersonPan: v.optional(v.string()),
    responsiblePersonDesignation: v.optional(v.string()),
    responsiblePersonEmail: v.optional(v.string()),
    responsiblePersonMobile: v.optional(v.string()),
    responsiblePersonAddress: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  employeeCompliance: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    taxRegime: v.union(v.literal("old"), v.literal("new")),
    epfOptOut: v.boolean(),
    epfOnActualBasic: v.optional(v.boolean()), // Voluntary EPF contribution on full basic
    tdsOverride: v.optional(v.number()), // Manual TDS override amount
    section197CertificateNumber: v.optional(v.string()), // 10-char Certificate Number u/s 197 issued by AO
    section197Rate: v.optional(v.number()), // Lower tax deduction rate (e.g. 0% or 2%)
    esiContributionPeriodCovered: v.optional(v.boolean()), // Continues coverage under Sec 2(9) proviso if crossed 21k mid-period
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"]),

  // Employee Tax Declarations (Form 12BB under Rule 26C, Income-tax Rules, 1962)
  taxDeclarations: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    financialYear: v.string(), // e.g. "2026-27"
    regime: v.union(v.literal("new"), v.literal("old")),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    hra: v.optional(
      v.object({
        annualRentPaid: v.number(),
        landlordName: v.optional(v.string()),
        landlordPan: v.optional(v.string()),
        landlordAddress: v.optional(v.string()),
        cityType: v.optional(
          v.union(v.literal("metro"), v.literal("non_metro")),
        ),
      }),
    ),
    homeLoan: v.optional(
      v.object({
        annualInterest: v.number(),
        lenderName: v.optional(v.string()),
        lenderPan: v.optional(v.string()),
      }),
    ),
    chapterVIA: v.optional(
      v.object({
        section80C: v.optional(v.number()), // Capped at ₹1.5L
        section80D: v.optional(v.number()), // Health insurance
        section80CCD1B: v.optional(v.number()), // Additional NPS up to ₹50k
        section80E: v.optional(v.number()), // Education loan interest
        section80G: v.optional(v.number()), // Donations
        otherDeductions: v.optional(v.number()),
      }),
    ),
    previousEmployer: v.optional(
      v.object({
        grossSalary: v.number(),
        tdsDeducted: v.number(),
        employerName: v.optional(v.string()),
        employerPan: v.optional(v.string()),
        employerTan: v.optional(v.string()),
      }),
    ),
    proofs: v.array(
      v.object({
        id: v.string(),
        category: v.string(), // "rent_receipt", "insurance_receipt", "home_loan_cert", "investment_proof", "other"
        title: v.string(),
        fileId: v.optional(v.id("files")),
        storageId: v.optional(v.id("_storage")),
        fileName: v.string(),
        uploadedAt: v.number(),
      }),
    ),
    reviewRemarks: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee_fy", ["employeeId", "financialYear"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // Quarterly Tax Deposit Challans (ITNS 281) for Form 138 / Form 24Q
  tdsChallans: defineTable({
    workspaceId: v.id("workspaces"),
    quarter: v.union(
      v.literal("Q1"),
      v.literal("Q2"),
      v.literal("Q3"),
      v.literal("Q4"),
    ),
    financialYear: v.string(), // e.g. "2026-27"
    bsrCode: v.string(), // 7 digits
    depositDate: v.string(), // "YYYY-MM-DD"
    challanSerialNumber: v.string(), // 5 digits
    minorHead: v.union(v.literal("200"), v.literal("400")), // 200 = TDS Payable by taxpayer, 400 = Regular Assessment
    taxAmount: v.number(),
    surcharge: v.optional(v.number()),
    cess: v.optional(v.number()),
    interest: v.optional(v.number()),
    fee: v.optional(v.number()), // Section 234E late fee
    penalty: v.optional(v.number()),
    totalAmount: v.number(),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_quarter", ["workspaceId", "financialYear", "quarter"]),

  // Company Holiday Calendar (Indian Statutory / Gazetted & Restricted Holidays)
  holidays: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    type: v.union(v.literal("gazetted"), v.literal("restricted"), v.literal("company")),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_date", ["workspaceId", "date"]),

  // Employee Helpdesk & Support Tickets
  helpdeskTickets: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    ticketNumber: v.string(),
    category: v.union(
      v.literal("payroll"),
      v.literal("leaves"),
      v.literal("attendance"),
      v.literal("benefits"),
      v.literal("general"),
    ),
    subject: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    assignedTo: v.optional(v.id("users")),
    resolutionRemarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // Resignation & Notice Period Requests
  resignations: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    proposedResignationDate: v.string(), // "YYYY-MM-DD"
    noticePeriodDays: v.number(),
    expectedLastWorkingDay: v.string(), // "YYYY-MM-DD"
    approvedLastWorkingDay: v.optional(v.string()),
    reason: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("withdrawn"),
    ),
    hrComments: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // Attendance Regularization Requests
  attendanceRegularizations: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    date: v.string(), // "YYYY-MM-DD"
    requestedStatus: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("half_day"),
      v.literal("paid_leave"),
      v.literal("unpaid_leave"),
    ),
    checkInTime: v.optional(v.string()), // "HH:MM"
    checkOutTime: v.optional(v.string()), // "HH:MM"
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewRemarks: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_employee", ["employeeId"])
    .index("by_employee_date", ["employeeId", "date"]),

  // Workflow Delegation Settings
  workflowDelegates: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    delegateEmployeeId: v.id("employees"),
    workflowType: v.union(
      v.literal("leave_approvals"),
      v.literal("attendance_approvals"),
      v.literal("all"),
    ),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(), // "YYYY-MM-DD"
    status: v.union(v.literal("active"), v.literal("inactive")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"]),

  // Compensatory Off (Comp-Off) Grant Requests
  compOffRequests: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    workDate: v.string(), // "YYYY-MM-DD"
    reason: v.string(),
    daysCount: v.number(), // typically 1 or 0.5
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewRemarks: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // Engage — Company Announcements
  announcements: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("general"),
      v.literal("hr"),
      v.literal("event"),
      v.literal("policy"),
    ),
    authorId: v.id("users"),
    authorName: v.string(),
    pinned: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_pinned", ["workspaceId", "pinned"]),

  // Engage — Interactive Team Polls
  polls: defineTable({
    workspaceId: v.id("workspaces"),
    question: v.string(),
    options: v.array(v.string()),
    createdById: v.id("users"),
    creatorName: v.string(),
    status: v.union(v.literal("active"), v.literal("closed")),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // Engage — Poll Votes
  pollVotes: defineTable({
    workspaceId: v.id("workspaces"),
    pollId: v.id("polls"),
    userId: v.id("users"),
    optionIndex: v.number(),
    createdAt: v.number(),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_user", ["pollId", "userId"])
    .index("by_workspace", ["workspaceId"]),

  // Engage — Peer Recognition & Kudos
  kudos: defineTable({
    workspaceId: v.id("workspaces"),
    senderEmployeeId: v.id("employees"),
    receiverEmployeeId: v.id("employees"),
    message: v.string(),
    badge: v.string(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_receiver", ["receiverEmployeeId"]),

  // Engage — Feed Posts
  posts: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.optional(v.string()),
    content: v.string(),
    group: v.optional(v.string()), // "Events", "General", "Engineering", "HR"
    authorId: v.id("users"),
    authorName: v.string(),
    authorEmployeeId: v.optional(v.id("employees")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_created", ["workspaceId", "createdAt"]),

  // Engage — Activity Reactions
  reactions: defineTable({
    workspaceId: v.id("workspaces"),
    activityId: v.string(),
    activityType: v.string(), // "post", "kudos", "announcement", "poll", "celebration"
    userId: v.id("users"),
    reactionType: v.string(), // "like", "heart", "clap", "celebrate"
    createdAt: v.number(),
  })
    .index("by_activity", ["activityId"])
    .index("by_activity_user", ["activityId", "userId"])
    .index("by_workspace", ["workspaceId"]),

  // Engage — Activity Comments
  comments: defineTable({
    workspaceId: v.id("workspaces"),
    activityId: v.string(),
    activityType: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_activity", ["activityId"])
    .index("by_workspace", ["workspaceId"]),
});
