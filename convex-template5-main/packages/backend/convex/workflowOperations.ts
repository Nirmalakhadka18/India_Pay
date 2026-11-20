import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireMember, requireRole } from "./orgs";

// ═════════════════════════════════════════════════════════════════════════════
// 1. LEAVE CANCEL WORKFLOW OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const listLeaveCancelRequests = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    // Fetch leaves that are either pending, approved, or cancelled
    const leaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const empMap = new Map(employees.map((e) => [e._id, e]));

    return leaves.map((l) => {
      const emp = empMap.get(l.employeeId);
      return {
        ...l,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
        employeeCode: emp ? (emp.employeeIdNumber ?? emp._id.slice(-6).toUpperCase()) : "EMP",
        department: emp?.department ?? "General",
        designation: emp?.designation ?? "Associate",
      };
    });
  },
});

export const cancelLeaveAdmin = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    requestId: v.id("leaveRequests"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const req = await ctx.db.get(args.requestId);
    if (!req || req.workspaceId !== args.workspaceId) {
      throw new ConvexError("Leave request not found");
    }

    if (req.status === "cancelled") {
      throw new ConvexError("Leave request is already cancelled");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      reviewRemarks: `Cancelled by Admin: ${args.reason.trim()}`,
      reviewedBy: userId,
      reviewedAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "leave.cancel_admin", {
      requestId: args.requestId,
      employeeId: req.employeeId,
      leaveType: req.leaveType,
      daysCount: req.daysCount,
      reason: args.reason.trim(),
    });

    return { success: true };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. HELP DESK WORKFLOW OPERATIONS (ADMIN ESCALATION & RESOLUTION)
// ═════════════════════════════════════════════════════════════════════════════

export const listHelpDeskTicketsAdmin = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const tickets = await ctx.db
      .query("helpdeskTickets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const empMap = new Map(employees.map((e) => [e._id, e]));

    return tickets.map((t) => {
      const emp = empMap.get(t.employeeId);
      return {
        ...t,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown",
        employeeCode: emp ? (emp.employeeIdNumber ?? emp._id.slice(-6).toUpperCase()) : "EMP",
        department: emp?.department ?? "General",
      };
    });
  },
});

export const resolveTicketAdmin = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    ticketId: v.id("helpdeskTickets"),
    status: v.union(v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    resolutionRemarks: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.workspaceId !== args.workspaceId) {
      throw new ConvexError("Ticket not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: args.status,
      assignedTo: userId,
      resolutionRemarks: args.resolutionRemarks.trim(),
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "helpdesk.resolve", {
      ticketId: args.ticketId,
      status: args.status,
    });

    return { success: true };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. EMPLOYEE ONBOARDING WORKFLOW OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const listOnboardingTasks = query({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    let tasksQuery = ctx.db
      .query("onboardingTasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    if (args.employeeId) {
      tasksQuery = ctx.db
        .query("onboardingTasks")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!));
    }

    const tasks = await tasksQuery.order("desc").collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const empMap = new Map(employees.map((e) => [e._id, e]));

    return tasks.map((t) => {
      const emp = empMap.get(t.employeeId);
      return {
        ...t,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "New Hire",
        employeeCode: emp ? (emp.employeeIdNumber ?? emp._id.slice(-6).toUpperCase()) : "EMP",
        department: emp?.department ?? "Operations",
      };
    });
  },
});

export const createOnboardingTask = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    taskName: v.string(),
    category: v.union(
      v.literal("documentation"),
      v.literal("it_setup"),
      v.literal("training"),
      v.literal("hr_orientation"),
      v.literal("compliance"),
    ),
    assignedRole: v.optional(v.string()),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    if (!args.taskName.trim()) {
      throw new ConvexError("Task name cannot be empty");
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("onboardingTasks", {
      workspaceId: args.workspaceId,
      employeeId: args.employeeId,
      taskName: args.taskName.trim(),
      category: args.category,
      assignedRole: args.assignedRole?.trim() || "HR Operations",
      dueDate: args.dueDate,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "onboarding.task_create", {
      taskId,
      employeeId: args.employeeId,
      taskName: args.taskName,
    });

    return taskId;
  },
});

export const updateOnboardingTaskStatus = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    taskId: v.id("onboardingTasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("verified"),
    ),
    completionRemarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const task = await ctx.db.get(args.taskId);
    if (!task || task.workspaceId !== args.workspaceId) {
      throw new ConvexError("Onboarding task not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: args.status,
      completionRemarks: args.completionRemarks?.trim(),
      verifiedBy: args.status === "verified" ? userId : undefined,
      verifiedAt: args.status === "verified" ? now : undefined,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "onboarding.task_update", {
      taskId: args.taskId,
      status: args.status,
    });

    return { success: true };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. CONFIRMATION & PROBATION WORKFLOW OPERATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const listConfirmations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const records = await ctx.db
      .query("employeeConfirmations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const empMap = new Map(employees.map((e) => [e._id, e]));

    return records.map((r) => {
      const emp = empMap.get(r.employeeId);
      return {
        ...r,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Employee",
        employeeCode: emp ? (emp.employeeIdNumber ?? emp._id.slice(-6).toUpperCase()) : "EMP",
        department: emp?.department ?? "Operations",
        designation: emp?.designation ?? "Associate",
        joiningDate: emp?.joiningDate ?? "2026-05-01",
      };
    });
  },
});

export const initiateProbation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    probationPeriodMonths: v.number(),
    probationEndDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const now = Date.now();
    const id = await ctx.db.insert("employeeConfirmations", {
      workspaceId: args.workspaceId,
      employeeId: args.employeeId,
      probationPeriodMonths: args.probationPeriodMonths,
      probationEndDate: args.probationEndDate,
      confirmationDueDate: args.probationEndDate,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "probation.initiate", {
      confirmationId: id,
      employeeId: args.employeeId,
    });

    return id;
  },
});

export const reviewConfirmation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    confirmationId: v.id("employeeConfirmations"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("extended"),
      v.literal("terminated"),
    ),
    rating: v.optional(v.union(v.literal("exceeds"), v.literal("meets"), v.literal("needs_improvement"))),
    extensionMonths: v.optional(v.number()),
    effectiveConfirmationDate: v.optional(v.string()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const record = await ctx.db.get(args.confirmationId);
    if (!record || record.workspaceId !== args.workspaceId) {
      throw new ConvexError("Confirmation record not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.confirmationId, {
      status: args.status,
      rating: args.rating,
      extensionMonths: args.extensionMonths,
      effectiveConfirmationDate: args.effectiveConfirmationDate ?? new Date().toISOString().slice(0, 10),
      remarks: args.remarks?.trim(),
      reviewerId: userId,
      reviewedAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "confirmation.review", {
      confirmationId: args.confirmationId,
      status: args.status,
    });

    return { success: true };
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. WORKFLOW DELEGATES (ADMIN OVERVIEW & CONFIGURATION)
// ═════════════════════════════════════════════════════════════════════════════

export const listAllDelegatesAdmin = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const delegates = await ctx.db
      .query("workflowDelegates")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const empMap = new Map(employees.map((e) => [e._id, e]));

    return delegates.map((d) => {
      const grantor = empMap.get(d.employeeId);
      const grantee = empMap.get(d.delegateEmployeeId);
      return {
        ...d,
        grantorName: grantor ? `${grantor.firstName} ${grantor.lastName}` : "Reviewer",
        grantorEmpId: grantor ? (grantor.employeeIdNumber ?? grantor._id.slice(-6).toUpperCase()) : "EMP",
        delegateName: grantee ? `${grantee.firstName} ${grantee.lastName}` : "Proxy Delegate",
        delegateEmpId: grantee ? (grantee.employeeIdNumber ?? grantee._id.slice(-6).toUpperCase()) : "EMP",
        department: grantor?.department ?? "Operations",
      };
    });
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. WORKFLOW REVIEWER TYPES (SETUP CONFIGURATION)
// ═════════════════════════════════════════════════════════════════════════════

export const listReviewerTypes = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const types = await ctx.db
      .query("workflowReviewerTypes")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (types.length === 0) {
      // Return standard default reviewer types
      return [
        {
          _id: "default_mgr" as unknown as typeof types[0]["_id"],
          typeCode: "MANAGER",
          typeName: "Reporting Manager",
          description: "Direct line manager as recorded in employee master data",
          hierarchyLevel: 1,
          isSystemDefault: true,
          status: "active" as const,
        },
        {
          _id: "default_hod" as unknown as typeof types[0]["_id"],
          typeCode: "DEPT_HEAD",
          typeName: "Head of Department (HOD)",
          description: "Functional division leadership oversight",
          hierarchyLevel: 2,
          isSystemDefault: true,
          status: "active" as const,
        },
        {
          _id: "default_hr" as unknown as typeof types[0]["_id"],
          typeCode: "HR_ADMIN",
          typeName: "Human Resources Admin",
          description: "Centralized People Operations & Compliance sign-off",
          hierarchyLevel: 3,
          isSystemDefault: true,
          status: "active" as const,
        },
      ];
    }

    return types;
  },
});

export const upsertReviewerType = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    typeCode: v.string(),
    typeName: v.string(),
    description: v.string(),
    hierarchyLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const existing = await ctx.db
      .query("workflowReviewerTypes")
      .withIndex("by_workspace_code", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("typeCode", args.typeCode.toUpperCase().trim()),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        typeName: args.typeName.trim(),
        description: args.description.trim(),
        hierarchyLevel: args.hierarchyLevel,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("workflowReviewerTypes", {
      workspaceId: args.workspaceId,
      typeCode: args.typeCode.toUpperCase().trim(),
      typeName: args.typeName.trim(),
      description: args.description.trim(),
      hierarchyLevel: args.hierarchyLevel,
      isSystemDefault: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "reviewer_type.upsert", {
      reviewerTypeId: id,
      typeCode: args.typeCode,
    });

    return id;
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. WORKFLOW LEVELS & ESCALATION RULES (SETUP CONFIGURATION)
// ═════════════════════════════════════════════════════════════════════════════

export const listWorkflowLevels = query({
  args: {
    workspaceId: v.id("workspaces"),
    workflowModule: v.optional(
      v.union(
        v.literal("leave"),
        v.literal("leave_cancel"),
        v.literal("comp_off"),
        v.literal("rh_leave"),
        v.literal("resignation"),
        v.literal("confirmation"),
        v.literal("help_desk"),
        v.literal("onboarding"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    let queryBuilder = ctx.db
      .query("workflowLevels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    if (args.workflowModule) {
      queryBuilder = ctx.db
        .query("workflowLevels")
        .withIndex("by_workspace_module", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("workflowModule", args.workflowModule!),
        );
    }

    const levels = await queryBuilder.collect();

    if (levels.length === 0) {
      // Default standard multi-tier level configuration
      return [
        {
          _id: "lvl_1" as unknown as typeof levels[0]["_id"],
          workflowModule: "leave" as const,
          levelIndex: 1,
          levelName: "Level 1: Line Manager",
          reviewerTypeId: "MANAGER",
          autoApprovalDays: 3,
          canEscalate: true,
          status: "active" as const,
        },
        {
          _id: "lvl_2" as unknown as typeof levels[0]["_id"],
          workflowModule: "leave" as const,
          levelIndex: 2,
          levelName: "Level 2: Department Head / HR",
          reviewerTypeId: "HR_ADMIN",
          autoApprovalDays: 2,
          canEscalate: false,
          status: "active" as const,
        },
      ];
    }

    return levels.sort((a, b) => a.levelIndex - b.levelIndex);
  },
});

export const saveWorkflowLevel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    workflowModule: v.union(
      v.literal("leave"),
      v.literal("leave_cancel"),
      v.literal("comp_off"),
      v.literal("rh_leave"),
      v.literal("resignation"),
      v.literal("confirmation"),
      v.literal("help_desk"),
      v.literal("onboarding"),
    ),
    levelIndex: v.number(),
    levelName: v.string(),
    reviewerTypeId: v.string(),
    autoApprovalDays: v.number(),
    canEscalate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const now = Date.now();
    const id = await ctx.db.insert("workflowLevels", {
      workspaceId: args.workspaceId,
      workflowModule: args.workflowModule,
      levelIndex: args.levelIndex,
      levelName: args.levelName.trim(),
      reviewerTypeId: args.reviewerTypeId.trim(),
      autoApprovalDays: args.autoApprovalDays,
      canEscalate: args.canEscalate,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "workflow_level.save", {
      workflowLevelId: id,
      workflowModule: args.workflowModule,
      levelIndex: args.levelIndex,
    });

    return id;
  },
});
