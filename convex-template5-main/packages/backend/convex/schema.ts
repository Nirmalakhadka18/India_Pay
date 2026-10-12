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
      v.literal("unpaid_leave")
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
      v.literal("unpaid")
    ),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(), // "YYYY-MM-DD"
    daysCount: v.number(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
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
    .index("by_employee_status", ["employeeId", "status"]),

  lopSettings: defineTable({
    workspaceId: v.id("workspaces"),
    calculationBasis: v.union(
      v.literal("calendar_days"), // Gross / Days in Month
      v.literal("fixed_30_days"), // Gross / 30
      v.literal("working_days") // Gross / (Month Days - Standard Weekends)
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
      v.literal("processed")
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
    customDeductions: v.array(v.object({ name: v.string(), amount: v.number() })),
    totalCustomDeductions: v.number(),
    statutoryDeductions: v.array(v.object({ name: v.string(), amount: v.number(), isConfigured: v.boolean() })),
    totalStatutoryDeductions: v.number(),
    employerContributions: v.array(v.object({ name: v.string(), amount: v.number(), isConfigured: v.boolean() })),
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
    esiEnabled: v.boolean(),
    esiWageCeiling: v.optional(v.number()), // Statutory default 21000
    ptState: v.optional(v.string()), // e.g., "Karnataka"
    ptEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  employeeCompliance: defineTable({
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    taxRegime: v.union(v.literal("old"), v.literal("new")),
    epfOptOut: v.boolean(),
    epfOnActualBasic: v.optional(v.boolean()), // Voluntary EPF contribution on full basic
    tdsOverride: v.optional(v.number()), // Manual TDS override amount
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_employee", ["employeeId"]),
});
