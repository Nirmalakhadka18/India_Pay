import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

export const getWorkspaceCompliance = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const settings = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    return {
      epfEnabled: false,
      epfWageCeiling: 15000,
      epfRestrictToCeiling: true,
      epsEnabled: true,
      epsWageCeiling: 15000,
      edliEnabled: true,
      adminChargesEnabled: true,
      esiEnabled: false,
      esiWageCeiling: 21000,
      ptState: "Karnataka",
      ptEnabled: false,
      updatedAt: Date.now(),
      ...settings,
    };
  },
});

export const updateWorkspaceCompliance = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    epfEnabled: v.boolean(),
    epfWageCeiling: v.optional(v.number()),
    epfRestrictToCeiling: v.optional(v.boolean()),
    epsEnabled: v.optional(v.boolean()),
    epsWageCeiling: v.optional(v.number()),
    edliEnabled: v.optional(v.boolean()),
    adminChargesEnabled: v.optional(v.boolean()),
    esiEnabled: v.boolean(),
    esiWageCeiling: v.optional(v.number()),
    ptState: v.optional(v.string()),
    ptEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    if (args.epfWageCeiling !== undefined && (isNaN(args.epfWageCeiling) || args.epfWageCeiling < 0)) {
      throw new ConvexError("EPF wage ceiling must be a positive number or 0");
    }
    if (args.epsWageCeiling !== undefined && (isNaN(args.epsWageCeiling) || args.epsWageCeiling < 0)) {
      throw new ConvexError("EPS wage ceiling must be a positive number or 0");
    }
    if (args.esiWageCeiling !== undefined && (isNaN(args.esiWageCeiling) || args.esiWageCeiling < 0)) {
      throw new ConvexError("ESI wage ceiling must be a positive number or 0");
    }

    const existing = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    const payload = {
      epfEnabled: args.epfEnabled,
      epfWageCeiling: args.epfWageCeiling ?? 15000,
      epfRestrictToCeiling: args.epfRestrictToCeiling ?? true,
      epsEnabled: args.epsEnabled ?? true,
      epsWageCeiling: args.epsWageCeiling ?? 15000,
      edliEnabled: args.edliEnabled ?? true,
      adminChargesEnabled: args.adminChargesEnabled ?? true,
      esiEnabled: args.esiEnabled,
      esiWageCeiling: args.esiWageCeiling ?? 21000,
      ptState: args.ptState,
      ptEnabled: args.ptEnabled,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      await audit(ctx, args.workspaceId, userId, "compliance.updateWorkspace", {
        settingsId: existing._id,
      });
      return existing._id;
    }

    const settingsId = await ctx.db.insert("workspaceCompliance", {
      workspaceId: args.workspaceId,
      ...payload,
    });
    await audit(ctx, args.workspaceId, userId, "compliance.createWorkspace", {
      settingsId,
    });
    return settingsId;
  },
});

export const getEmployeeCompliance = query({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const settings = await ctx.db
      .query("employeeCompliance")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    return {
      taxRegime: "new" as const,
      epfOptOut: false,
      epfOnActualBasic: false,
      tdsOverride: undefined,
      updatedAt: Date.now(),
      ...settings,
    };
  },
});

export const updateEmployeeCompliance = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    taxRegime: v.union(v.literal("old"), v.literal("new")),
    epfOptOut: v.boolean(),
    epfOnActualBasic: v.optional(v.boolean()),
    tdsOverride: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found in workspace");
    }

    if (args.tdsOverride !== undefined) {
      if (typeof args.tdsOverride !== "number" || isNaN(args.tdsOverride) || args.tdsOverride < 0) {
        throw new ConvexError("TDS override amount must be a non-negative number");
      }
    }

    const existing = await ctx.db
      .query("employeeCompliance")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    const now = Date.now();
    const payload = {
      taxRegime: args.taxRegime,
      epfOptOut: args.epfOptOut,
      epfOnActualBasic: args.epfOnActualBasic ?? false,
      tdsOverride: args.tdsOverride,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      await audit(ctx, args.workspaceId, userId, "compliance.updateEmployee", {
        employeeId: args.employeeId,
      });
      return existing._id;
    }

    const settingsId = await ctx.db.insert("employeeCompliance", {
      workspaceId: args.workspaceId,
      employeeId: args.employeeId,
      ...payload,
    });
    await audit(ctx, args.workspaceId, userId, "compliance.createEmployee", {
      employeeId: args.employeeId,
    });
    return settingsId;
  },
});
