import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireMember, requireRole } from "./orgs";

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
      epfEstablishmentCode: undefined,
      esiEnabled: false,
      esiWageCeiling: 21000,
      ptState: "Karnataka",
      ptEnabled: false,
      lwfEnabled: false,
      lwfState: "Karnataka",
      tan: undefined,
      employerPan: undefined,
      deductorType: undefined,
      responsiblePersonName: undefined,
      responsiblePersonPan: undefined,
      responsiblePersonDesignation: undefined,
      responsiblePersonEmail: undefined,
      responsiblePersonMobile: undefined,
      responsiblePersonAddress: undefined,
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
    epfEstablishmentCode: v.optional(v.string()),
    esiEnabled: v.boolean(),
    esiWageCeiling: v.optional(v.number()),
    ptState: v.optional(v.string()),
    ptEnabled: v.boolean(),
    lwfEnabled: v.optional(v.boolean()),
    lwfState: v.optional(v.string()),
    // TDS Master fields
    tan: v.optional(v.string()),
    employerPan: v.optional(v.string()),
    deductorType: v.optional(
      v.union(
        v.literal("company"),
        v.literal("individual"),
        v.literal("firm"),
        v.literal("government"),
        v.literal("other"),
      ),
    ),
    responsiblePersonName: v.optional(v.string()),
    responsiblePersonPan: v.optional(v.string()),
    responsiblePersonDesignation: v.optional(v.string()),
    responsiblePersonEmail: v.optional(v.string()),
    responsiblePersonMobile: v.optional(v.string()),
    responsiblePersonAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    if (
      args.epfWageCeiling !== undefined &&
      (Number.isNaN(args.epfWageCeiling) || args.epfWageCeiling < 0)
    ) {
      throw new ConvexError("EPF wage ceiling must be a positive number or 0");
    }
    if (
      args.epsWageCeiling !== undefined &&
      (Number.isNaN(args.epsWageCeiling) || args.epsWageCeiling < 0)
    ) {
      throw new ConvexError("EPS wage ceiling must be a positive number or 0");
    }
    if (
      args.esiWageCeiling !== undefined &&
      (Number.isNaN(args.esiWageCeiling) || args.esiWageCeiling < 0)
    ) {
      throw new ConvexError("ESI wage ceiling must be a positive number or 0");
    }

    const cleanTan = args.tan?.trim().toUpperCase();
    if (cleanTan && !/^[A-Z]{4}\d{5}[A-Z]$/.test(cleanTan)) {
      throw new ConvexError(
        "Invalid TAN format. TAN must be 10 alphanumeric characters (e.g. BLRK12345A)",
      );
    }

    const cleanEmployerPan = args.employerPan?.trim().toUpperCase();
    if (cleanEmployerPan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanEmployerPan)) {
      throw new ConvexError(
        "Invalid Employer PAN format. PAN must be 10 alphanumeric characters (e.g. AABCI1234F)",
      );
    }

    const cleanRespPan = args.responsiblePersonPan?.trim().toUpperCase();
    if (cleanRespPan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanRespPan)) {
      throw new ConvexError(
        "Invalid Responsible Person PAN format. PAN must be 10 alphanumeric characters",
      );
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
      epfEstablishmentCode: args.epfEstablishmentCode?.trim() || undefined,
      esiEnabled: args.esiEnabled,
      esiWageCeiling: args.esiWageCeiling ?? 21000,
      ptState: args.ptState,
      ptEnabled: args.ptEnabled,
      lwfEnabled: args.lwfEnabled ?? false,
      lwfState: args.lwfState ?? args.ptState ?? "Karnataka",
      tan: cleanTan || undefined,
      employerPan: cleanEmployerPan || undefined,
      deductorType: args.deductorType,
      responsiblePersonName: args.responsiblePersonName?.trim() || undefined,
      responsiblePersonPan: cleanRespPan || undefined,
      responsiblePersonDesignation:
        args.responsiblePersonDesignation?.trim() || undefined,
      responsiblePersonEmail: args.responsiblePersonEmail?.trim() || undefined,
      responsiblePersonMobile:
        args.responsiblePersonMobile?.trim() || undefined,
      responsiblePersonAddress:
        args.responsiblePersonAddress?.trim() || undefined,
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
    const m = await requireMember(ctx, userId, args.workspaceId);

    // If plain member, restrict to only viewing their own compliance configuration
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId),
        )
        .first();
      if (!me || me._id !== args.employeeId) {
        throw new ConvexError(
          "Forbidden: You cannot view another employee's compliance settings",
        );
      }
    }

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
    esiContributionPeriodCovered: v.optional(v.boolean()),
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
      if (
        typeof args.tdsOverride !== "number" ||
        Number.isNaN(args.tdsOverride) ||
        args.tdsOverride < 0
      ) {
        throw new ConvexError(
          "TDS override amount must be a non-negative number",
        );
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
      esiContributionPeriodCovered:
        args.esiContributionPeriodCovered ??
        existing?.esiContributionPeriodCovered ??
        false,
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

/**
 * Advisory TDS Projection Query (Section 192, FY 2026-27).
 * Allows Owners, Admins, and the Employee themselves to preview annual income tax liability
 * and estimated monthly withholding without modifying production payroll runs or manual overrides.
 */
export const previewTdsProjection = query({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    financialYear: v.optional(v.string()),
    remainingPayrollMonths: v.optional(v.number()),
    declarations: v.optional(
      v.object({
        section80C: v.optional(v.number()),
        section80D: v.optional(v.number()),
        section80CCD1B: v.optional(v.number()),
        otherChapterVIA: v.optional(v.number()),
        homeLoanInterestSec24: v.optional(v.number()),
        hraExemption: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    // IDOR protection: Plain member can only view their own projection
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId),
        )
        .first();
      if (!me || me._id !== args.employeeId) {
        throw new ConvexError(
          "Forbidden: You cannot view another employee's TDS projection",
        );
      }
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found in workspace");
    }

    // Get current salary structure
    const allSalaries = await ctx.db
      .query("salaries")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    allSalaries.sort((a, b) => b.effectiveDate - a.effectiveDate);
    const currentSalary = allSalaries[0];
    const monthlyGross = currentSalary
      ? Math.max(0, currentSalary.grossSalary)
      : 0;

    // Get compliance configuration
    const compliance = await ctx.db
      .query("employeeCompliance")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    const fy = args.financialYear ?? "2026-27";

    // Check for Form 12BB tax declaration for this financial year
    const decl = await ctx.db
      .query("taxDeclarations")
      .withIndex("by_employee_fy", (q) =>
        q.eq("employeeId", args.employeeId).eq("financialYear", fy),
      )
      .first();

    // Use elected regime from approved/submitted declaration or fall back to compliance
    const regime = decl ? decl.regime : compliance?.taxRegime ?? "new";

    let effectiveDeclarations = args.declarations;
    if (
      !effectiveDeclarations &&
      decl &&
      (decl.status === "approved" || decl.status === "submitted")
    ) {
      let hraExemption = 0;
      if (decl.hra && currentSalary) {
        const annualBasic = (currentSalary.basicSalary || 0) * 12;
        const hraAllowance =
          currentSalary.allowances?.find((a) =>
            a.name.toLowerCase().includes("hra"),
          )?.amount || 0;
        const annualHra = hraAllowance * 12;
        const rentMinus10Percent = Math.max(
          0,
          decl.hra.annualRentPaid - annualBasic * 0.1,
        );
        const percentLimit = decl.hra.cityType === "metro" ? 0.5 : 0.4;
        const basicCap = annualBasic * percentLimit;
        hraExemption = Math.min(
          annualHra > 0 ? annualHra : rentMinus10Percent,
          rentMinus10Percent,
          basicCap,
        );
      }

      effectiveDeclarations = {
        section80C: decl.chapterVIA?.section80C ?? 0,
        section80D: decl.chapterVIA?.section80D ?? 0,
        section80CCD1B: decl.chapterVIA?.section80CCD1B ?? 0,
        otherChapterVIA:
          (decl.chapterVIA?.section80E ?? 0) +
          (decl.chapterVIA?.section80G ?? 0) +
          (decl.chapterVIA?.otherDeductions ?? 0),
        homeLoanInterestSec24: decl.homeLoan?.annualInterest ?? 0,
        hraExemption,
      };
    }

    // Dynamic import of statutoryTds
    const { calculateAnnualTds } = await import("./statutoryTds");

    const result = calculateAnnualTds({
      currentMonthlyGross: monthlyGross,
      remainingPayrollMonths: args.remainingPayrollMonths ?? 12,
      taxRegime: regime,
      declarations: effectiveDeclarations,
    });

    return {
      ...result,
      declarationStatus: decl ? decl.status : "none",
      declarationId: decl ? decl._id : null,
      financialYear: fy,
    };
  },
});
