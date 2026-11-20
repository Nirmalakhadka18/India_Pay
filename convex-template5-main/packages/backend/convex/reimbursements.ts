import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireMember, requireRole } from "./orgs";

// ═════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURABLE REIMBURSEMENT CATEGORIES
// ═════════════════════════════════════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
  {
    code: "TRAVEL",
    name: "Travel Expenses",
    description: "Domestic and international business airfare, rail, or cab expenses",
    maxLimit: 100000,
    receiptRequired: true,
    taxTreatment: "NON_TAXABLE_BUSINESS" as const,
    mgrApproval: true,
    finApproval: true,
  },
  {
    code: "CONVEYANCE",
    name: "Local Conveyance",
    description: "Local auto, metro, taxi, or inter-city site visits",
    maxLimit: 15000,
    receiptRequired: true,
    taxTreatment: "NON_TAXABLE_BUSINESS" as const,
    mgrApproval: true,
    finApproval: true,
  },
  {
    code: "FUEL",
    name: "Fuel Expenses",
    description: "Vehicle fuel claims with logged mileage",
    maxLimit: 10000,
    receiptRequired: true,
    taxTreatment: "POTENTIALLY_EXEMPT" as const,
    mgrApproval: true,
    finApproval: true,
  },
  {
    code: "HOTEL",
    name: "Hotel Accommodation",
    description: "Lodging and stay expenses for business tours",
    maxLimit: 50000,
    receiptRequired: true,
    taxTreatment: "NON_TAXABLE_BUSINESS" as const,
    mgrApproval: true,
    finApproval: true,
  },
  {
    code: "FOOD",
    name: "Meals & Client Entertainment",
    description: "Official meals, team outings, or client refreshments",
    maxLimit: 10000,
    receiptRequired: true,
    taxTreatment: "TAXABLE" as const,
    mgrApproval: true,
    finApproval: true,
  },
  {
    code: "TELECOM",
    name: "Telephone & Internet",
    description: "Official broadband and mobile bill reimbursements",
    maxLimit: 4000,
    receiptRequired: true,
    taxTreatment: "NON_TAXABLE_BUSINESS" as const,
    mgrApproval: false, // direct finance verification
    finApproval: true,
  },
  {
    code: "MEDICAL",
    name: "Medical Expenses",
    description: "Out-patient consultations, medicines, or health checkups",
    maxLimit: 15000,
    receiptRequired: true,
    taxTreatment: "TAXABLE" as const,
    mgrApproval: false,
    finApproval: true,
  },
  {
    code: "LEARNING",
    name: "Professional Development & Certifications",
    description: "Technical certifications, exams, workshops, or training courses",
    maxLimit: 30000,
    receiptRequired: true,
    taxTreatment: "NON_TAXABLE_BUSINESS" as const,
    mgrApproval: true,
    finApproval: true,
  },
  {
    code: "BOOKS",
    name: "Books & Periodicals",
    description: "Professional reference books and journal subscriptions",
    maxLimit: 5000,
    receiptRequired: true,
    taxTreatment: "NON_TAXABLE_BUSINESS" as const,
    mgrApproval: false,
    finApproval: true,
  },
  {
    code: "GENERAL",
    name: "General Business Expenses",
    description: "Office supplies, courier, emergency purchases",
    maxLimit: 10000,
    receiptRequired: true,
    taxTreatment: "REQUIRES_REVIEW" as const,
    mgrApproval: true,
    finApproval: true,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 1. REIMBURSEMENT CATEGORY MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Lists categories for a workspace, auto-seeding defaults if none exist.
 */
export const listCategories = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const categories = await ctx.db
      .query("reimbursementCategories")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (categories.length > 0) {
      return categories;
    }

    // Return virtual defaults if not yet seeded
    return DEFAULT_CATEGORIES.map((cat, idx) => ({
      _id: `default_${idx}` as unknown as Id<"reimbursementCategories">,
      _creationTime: Date.now(),
      workspaceId: args.workspaceId,
      categoryCode: cat.code,
      categoryName: cat.name,
      description: cat.description,
      isActive: true,
      maxClaimLimit: cat.maxLimit,
      receiptRequired: cat.receiptRequired,
      taxTreatment: cat.taxTreatment,
      requiresManagerApproval: cat.mgrApproval,
      requiresFinanceApproval: cat.finApproval,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  },
});

/**
 * Seeds or updates default categories for a workspace.
 */
export const seedDefaultCategories = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const existing = await ctx.db
      .query("reimbursementCategories")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const existingCodes = new Set(existing.map((c) => c.categoryCode));
    const now = Date.now();

    for (const cat of DEFAULT_CATEGORIES) {
      if (!existingCodes.has(cat.code)) {
        await ctx.db.insert("reimbursementCategories", {
          workspaceId: args.workspaceId,
          categoryCode: cat.code,
          categoryName: cat.name,
          description: cat.description,
          isActive: true,
          maxClaimLimit: cat.maxLimit,
          receiptRequired: cat.receiptRequired,
          taxTreatment: cat.taxTreatment,
          requiresManagerApproval: cat.mgrApproval,
          requiresFinanceApproval: cat.finApproval,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. REIMBURSEMENT CLAIMS LIFECYCLE (DRAFT, SUBMISSION, EDIT, CANCEL)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Creates or updates an employee reimbursement claim in DRAFT or SUBMITTED state.
 */
export const saveClaim = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    claimId: v.optional(v.id("reimbursementClaims")),
    employeeId: v.id("employees"),
    categoryCode: v.string(),
    claimAmount: v.number(),
    expenseDate: v.string(), // "YYYY-MM-DD"
    businessPurpose: v.string(),
    description: v.string(),
    paymentMethod: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    billAttachmentStorageId: v.optional(v.id("_storage")),
    submitNow: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const member = await requireMember(ctx, userId, args.workspaceId);

    // Validate employee ownership (Members can only claim for themselves unless admin)
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Invalid employee reference or cross-tenant violation");
    }

    if (member.role === "member" && employee.userId !== userId) {
      throw new ConvexError("Forbidden: You can only submit reimbursement claims for yourself");
    }

    if (args.claimAmount <= 0) {
      throw new ConvexError("Claim amount must be greater than zero");
    }

    // Validate expense date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.expenseDate)) {
      throw new ConvexError("Invalid expense date format. Must be YYYY-MM-DD.");
    }

    // Check category configuration
    const category = await ctx.db
      .query("reimbursementCategories")
      .withIndex("by_workspace_code", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("categoryCode", args.categoryCode)
      )
      .first();

    const taxTreatment = category?.taxTreatment || "REQUIRES_REVIEW";
    const isTaxExempt = taxTreatment === "NON_TAXABLE_BUSINESS" || taxTreatment === "POTENTIALLY_EXEMPT";
    const maxLimit = category?.maxClaimLimit;

    if (maxLimit && args.claimAmount > maxLimit) {
      throw new ConvexError(
        `Claim amount (₹${args.claimAmount}) exceeds maximum category limit (₹${maxLimit}) for ${category?.categoryName || args.categoryCode}`
      );
    }

    const now = Date.now();
    const targetStatus = args.submitNow
      ? category?.requiresManagerApproval !== false
        ? "MANAGER_REVIEW"
        : "FINANCE_REVIEW"
      : "DRAFT";

    let targetClaimId = args.claimId;

    if (targetClaimId) {
      // Editing existing draft
      const existing = await ctx.db.get(targetClaimId);
      if (!existing || existing.workspaceId !== args.workspaceId) {
        throw new ConvexError("Claim not found or cross-tenant violation");
      }

      if (existing.status !== "DRAFT" && existing.status !== "RETURNED_FOR_CORRECTION") {
        throw new ConvexError(`Cannot modify claim in status: ${existing.status}`);
      }

      await ctx.db.patch(targetClaimId, {
        categoryCode: args.categoryCode,
        claimType: category?.categoryName || args.categoryCode,
        claimAmount: args.claimAmount,
        expenseDate: args.expenseDate,
        businessPurpose: args.businessPurpose,
        description: args.description,
        paymentMethod: args.paymentMethod,
        referenceNumber: args.referenceNumber,
        billAttachmentStorageId: args.billAttachmentStorageId ?? existing.billAttachmentStorageId,
        taxTreatment,
        isTaxExempt,
        status: targetStatus,
        updatedAt: now,
      });

      // Audit log entry
      await ctx.db.insert("reimbursementAuditLogs", {
        workspaceId: args.workspaceId,
        claimId: targetClaimId,
        action: args.submitNow ? "SUBMITTED" : "EDITED_DRAFT",
        actorUserId: userId,
        fromStatus: existing.status,
        toStatus: targetStatus,
        notes: args.submitNow ? "Submitted for review" : "Draft updated",
        timestamp: now,
      });
    } else {
      // New claim generation
      const count = await ctx.db
        .query("reimbursementClaims")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();

      const yearMonth = new Date().toISOString().slice(0, 7).replace("-", "");
      const claimNumber = `CLM-${yearMonth}-${String(count.length + 1).padStart(4, "0")}`;

      targetClaimId = await ctx.db.insert("reimbursementClaims", {
        workspaceId: args.workspaceId,
        claimNumber,
        employeeId: args.employeeId,
        categoryCode: args.categoryCode,
        claimType: category?.categoryName || args.categoryCode,
        claimAmount: args.claimAmount,
        expenseDate: args.expenseDate,
        businessPurpose: args.businessPurpose,
        description: args.description,
        paymentMethod: args.paymentMethod || "PAYROLL",
        referenceNumber: args.referenceNumber,
        billAttachmentStorageId: args.billAttachmentStorageId,
        taxTreatment,
        isTaxExempt,
        status: targetStatus,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("reimbursementAuditLogs", {
        workspaceId: args.workspaceId,
        claimId: targetClaimId,
        action: args.submitNow ? "SUBMITTED" : "CREATED_DRAFT",
        actorUserId: userId,
        fromStatus: "NEW",
        toStatus: targetStatus,
        notes: args.submitNow ? "Created and submitted claim" : "Saved as draft",
        timestamp: now,
      });
    }

    await audit(ctx, args.workspaceId, userId, "reimbursement.save", {
      claimId: targetClaimId,
      status: targetStatus,
      amount: args.claimAmount,
    });

    return { claimId: targetClaimId, status: targetStatus };
  },
});

/**
 * Cancel a pending or draft reimbursement claim (Employee action).
 */
export const cancelClaim = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    claimId: v.id("reimbursementClaims"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const member = await requireMember(ctx, userId, args.workspaceId);

    const claim = await ctx.db.get(args.claimId);
    if (!claim || claim.workspaceId !== args.workspaceId) {
      throw new ConvexError("Claim not found or cross-tenant violation");
    }

    // Must be owner or admin
    const employee = await ctx.db.get(claim.employeeId);
    if (member.role === "member" && employee?.userId !== userId) {
      throw new ConvexError("Forbidden: You can only cancel your own claims");
    }

    if (claim.status === "APPROVED" || claim.status === "PROCESSING" || claim.status === "SETTLED") {
      throw new ConvexError(`Cannot cancel claim in settled or approved status: ${claim.status}`);
    }

    const now = Date.now();
    await ctx.db.patch(claim._id, {
      status: "CANCELLED",
      rejectionReason: args.reason || "Cancelled by employee",
      updatedAt: now,
    });

    await ctx.db.insert("reimbursementAuditLogs", {
      workspaceId: args.workspaceId,
      claimId: claim._id,
      action: "CANCELLED",
      actorUserId: userId,
      fromStatus: claim.status,
      toStatus: "CANCELLED",
      notes: args.reason || "Employee cancelled claim",
      timestamp: now,
    });

    return { success: true };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. MULTI-STAGE APPROVAL WORKFLOW (MANAGER & FINANCE REVIEWS)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Manager review step (Approve, Reject, or Return for Correction).
 */
export const managerReviewClaim = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    claimId: v.id("reimbursementClaims"),
    action: v.union(v.literal("APPROVE"), v.literal("REJECT"), v.literal("RETURN")),
    comments: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    // Require manager or admin role
    await requireRole(ctx, userId, args.workspaceId, ["admin", "owner"]);

    const claim = await ctx.db.get(args.claimId);
    if (!claim || claim.workspaceId !== args.workspaceId) {
      throw new ConvexError("Claim not found or cross-tenant violation");
    }

    // Separation of duties: Prevent self-approval
    const employee = await ctx.db.get(claim.employeeId);
    if (employee && employee.userId === userId) {
      throw new ConvexError("Separation of duties violation: You cannot approve your own reimbursement claim");
    }

    if (claim.status !== "MANAGER_REVIEW" && claim.status !== "SUBMITTED") {
      throw new ConvexError(`Cannot perform manager review on claim with status: ${claim.status}`);
    }

    const now = Date.now();
    let toStatus: Doc<"reimbursementClaims">["status"] = "FINANCE_REVIEW";
    let actionLog = "MANAGER_APPROVED";

    if (args.action === "APPROVE") {
      toStatus = "FINANCE_REVIEW";
      actionLog = "MANAGER_APPROVED";
      await ctx.db.patch(claim._id, {
        status: toStatus,
        managerReviewedBy: userId,
        managerReviewedAt: now,
        managerComments: args.comments,
        updatedAt: now,
      });
    } else if (args.action === "REJECT") {
      if (!args.rejectionReason) throw new ConvexError("Rejection reason is mandatory");
      toStatus = "REJECTED";
      actionLog = "MANAGER_REJECTED";
      await ctx.db.patch(claim._id, {
        status: toStatus,
        managerReviewedBy: userId,
        managerReviewedAt: now,
        rejectionReason: args.rejectionReason,
        managerComments: args.comments,
        updatedAt: now,
      });
    } else if (args.action === "RETURN") {
      toStatus = "RETURNED_FOR_CORRECTION";
      actionLog = "RETURNED_FOR_CORRECTION";
      await ctx.db.patch(claim._id, {
        status: toStatus,
        managerReviewedBy: userId,
        managerReviewedAt: now,
        managerComments: args.comments || "Returned for correction",
        updatedAt: now,
      });
    }

    await ctx.db.insert("reimbursementAuditLogs", {
      workspaceId: args.workspaceId,
      claimId: claim._id,
      action: actionLog,
      actorUserId: userId,
      fromStatus: claim.status,
      toStatus,
      notes: args.comments || args.rejectionReason,
      timestamp: now,
    });

    return { success: true, newStatus: toStatus };
  },
});

/**
 * Finance verification step (Approve, Reject, or Put On Hold).
 */
export const financeReviewClaim = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    claimId: v.id("reimbursementClaims"),
    action: v.union(v.literal("APPROVE"), v.literal("REJECT"), v.literal("HOLD")),
    approvedAmount: v.optional(v.number()),
    taxTreatment: v.optional(
      v.union(
        v.literal("TAXABLE"),
        v.literal("POTENTIALLY_EXEMPT"),
        v.literal("NON_TAXABLE_BUSINESS"),
        v.literal("REQUIRES_REVIEW")
      )
    ),
    comments: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin", "owner"]);

    const claim = await ctx.db.get(args.claimId);
    if (!claim || claim.workspaceId !== args.workspaceId) {
      throw new ConvexError("Claim not found or cross-tenant violation");
    }

    // Separation of duties: Prevent self-approval
    const employee = await ctx.db.get(claim.employeeId);
    if (employee && employee.userId === userId) {
      throw new ConvexError("Separation of duties violation: You cannot verify your own reimbursement claim");
    }

    if (claim.status !== "FINANCE_REVIEW" && claim.status !== "ON_HOLD") {
      throw new ConvexError(`Cannot perform finance review on claim with status: ${claim.status}`);
    }

    const now = Date.now();
    let toStatus: Doc<"reimbursementClaims">["status"] = "APPROVED";
    let actionLog = "FINANCE_APPROVED";

    if (args.action === "APPROVE") {
      const finalAmount = args.approvedAmount ?? claim.claimAmount;
      if (finalAmount <= 0) throw new ConvexError("Approved amount must be positive");
      if (finalAmount > claim.claimAmount) {
        throw new ConvexError("Approved amount cannot exceed original claimed amount");
      }

      toStatus = "APPROVED";
      actionLog = "FINANCE_APPROVED";

      const finalTaxTreatment = args.taxTreatment ?? claim.taxTreatment;
      const isTaxExempt =
        finalTaxTreatment === "NON_TAXABLE_BUSINESS" || finalTaxTreatment === "POTENTIALLY_EXEMPT";

      await ctx.db.patch(claim._id, {
        status: toStatus,
        approvedAmount: finalAmount,
        taxTreatment: finalTaxTreatment,
        isTaxExempt,
        financeReviewedBy: userId,
        financeReviewedAt: now,
        financeComments: args.comments,
        reviewedBy: userId,
        reviewedAt: now,
        reviewerComments: args.comments,
        updatedAt: now,
      });
    } else if (args.action === "REJECT") {
      if (!args.reason) throw new ConvexError("Rejection reason is mandatory");
      toStatus = "REJECTED";
      actionLog = "FINANCE_REJECTED";
      await ctx.db.patch(claim._id, {
        status: toStatus,
        financeReviewedBy: userId,
        financeReviewedAt: now,
        rejectionReason: args.reason,
        financeComments: args.comments,
        updatedAt: now,
      });
    } else if (args.action === "HOLD") {
      if (!args.reason) throw new ConvexError("Hold reason is mandatory");
      toStatus = "ON_HOLD";
      actionLog = "FINANCE_HOLD";
      await ctx.db.patch(claim._id, {
        status: toStatus,
        financeReviewedBy: userId,
        financeReviewedAt: now,
        holdReason: args.reason,
        financeComments: args.comments,
        updatedAt: now,
      });
    }

    await ctx.db.insert("reimbursementAuditLogs", {
      workspaceId: args.workspaceId,
      claimId: claim._id,
      action: actionLog,
      actorUserId: userId,
      fromStatus: claim.status,
      toStatus,
      notes: args.comments || args.reason,
      timestamp: now,
    });

    return { success: true, newStatus: toStatus };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. QUERIES & REPORTS (LISTING, METRICS, TIMELINE)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * List workspace claims with filtering and enriched employee data.
 */
export const listWorkspaceClaims = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.string()),
    categoryCode: v.optional(v.string()),
    employeeId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    let claims = await ctx.db
      .query("reimbursementClaims")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    if (args.status && args.status !== "ALL") {
      claims = claims.filter((c) => c.status === args.status);
    }
    if (args.categoryCode && args.categoryCode !== "ALL") {
      claims = claims.filter((c) => c.categoryCode === args.categoryCode);
    }
    if (args.employeeId) {
      claims = claims.filter((c) => c.employeeId === args.employeeId);
    }

    // Enrich claims with employee metadata
    return await Promise.all(
      claims.map(async (c) => {
        const emp = await ctx.db.get(c.employeeId);
        return {
          ...c,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
          employeeCode: emp?.employeeIdNumber || "N/A",
          department: emp?.department || "General",
        };
      })
    );
  },
});

/**
 * Get single claim details with audit timeline.
 */
export const getClaimDetails = query({
  args: {
    workspaceId: v.id("workspaces"),
    claimId: v.id("reimbursementClaims"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const claim = await ctx.db.get(args.claimId);
    if (!claim || claim.workspaceId !== args.workspaceId) {
      throw new ConvexError("Claim not found or cross-tenant violation");
    }

    const employee = await ctx.db.get(claim.employeeId);
    const auditLogs = await ctx.db
      .query("reimbursementAuditLogs")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .order("asc")
      .collect();

    return {
      claim,
      employee: employee
        ? {
            id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            code: employee.employeeIdNumber,
            department: employee.department,
          }
        : null,
      auditTimeline: auditLogs,
    };
  },
});

/**
 * Overall reimbursement metrics for dashboard.
 */
export const getReimbursementMetrics = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const allClaims = await ctx.db
      .query("reimbursementClaims")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const totalClaims = allClaims.length;
    const pendingReview = allClaims.filter(
      (c) => c.status === "SUBMITTED" || c.status === "MANAGER_REVIEW" || c.status === "FINANCE_REVIEW"
    ).length;
    const approved = allClaims.filter((c) => c.status === "APPROVED").length;
    const rejected = allClaims.filter((c) => c.status === "REJECTED").length;
    const onHold = allClaims.filter((c) => c.status === "ON_HOLD").length;
    const settled = allClaims.filter((c) => c.status === "SETTLED").length;

    const totalClaimedAmount = allClaims.reduce((s, c) => s + c.claimAmount, 0);
    const totalApprovedAmount = allClaims
      .filter((c) => c.status === "APPROVED" || c.status === "SETTLED")
      .reduce((s, c) => s + (c.approvedAmount ?? c.claimAmount), 0);
    const totalPendingPayout = allClaims
      .filter((c) => c.status === "APPROVED")
      .reduce((s, c) => s + (c.approvedAmount ?? c.claimAmount), 0);

    return {
      totalClaims,
      pendingReview,
      approved,
      rejected,
      onHold,
      settled,
      totalClaimedAmount,
      totalApprovedAmount,
      totalPendingPayout,
    };
  },
});
