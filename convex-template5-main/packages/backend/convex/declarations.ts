import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireMember, requireRole } from "./orgs";

/**
 * Employee Tax Declarations Module (Form 12BB under Rule 26C, Income-tax Rules, 1962)
 *
 * Applicable Financial Year: FY 2026-27 (AY 2027-28)
 *
 * SECURITY & INTEGRITY DIRECTIVES:
 * 1. Employees can ONLY view, edit, and upload proofs for their OWN declarations.
 * 2. Cross-employee lookups return ConvexError("Forbidden").
 * 3. Admins/Owners review, approve, or reject declarations.
 * 4. Approved declarations feed into the advisory TDS projection without altering production payroll runs.
 * 5. Manual TDS overrides are preserved until explicitly replaced.
 */

// Indian PAN regex pattern: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const getMyDeclaration = query({
  args: {
    workspaceId: v.id("workspaces"),
    financialYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const me = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .first();

    if (!me) {
      return null;
    }

    const fy = args.financialYear ?? "2026-27";

    const declaration = await ctx.db
      .query("taxDeclarations")
      .withIndex("by_employee_fy", (q) =>
        q.eq("employeeId", me._id).eq("financialYear", fy),
      )
      .first();

    if (!declaration) {
      // Get employee's configured tax regime from compliance
      const compliance = await ctx.db
        .query("employeeCompliance")
        .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      return {
        _id: null,
        employeeId: me._id,
        financialYear: fy,
        regime: compliance?.taxRegime ?? ("new" as const),
        status: "draft" as const,
        hra: undefined,
        homeLoan: undefined,
        chapterVIA: undefined,
        proofs: [],
        reviewRemarks: undefined,
        reviewedAt: undefined,
        submittedAt: undefined,
      };
    }

    return declaration;
  },
});

export const saveDraftDeclaration = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    financialYear: v.string(), // "2026-27"
    regime: v.union(v.literal("new"), v.literal("old")),
    hra: v.optional(
      v.object({
        annualRentPaid: v.number(),
        landlordName: v.optional(v.string()),
        landlordPan: v.optional(v.string()),
        landlordAddress: v.optional(v.string()),
        cityType: v.optional(v.union(v.literal("metro"), v.literal("non_metro"))),
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
        section80C: v.optional(v.number()),
        section80D: v.optional(v.number()),
        section80CCD1B: v.optional(v.number()),
        section80E: v.optional(v.number()),
        section80G: v.optional(v.number()),
        otherDeductions: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const me = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .first();

    if (!me) {
      throw new ConvexError("Your user account is not linked to an employee profile");
    }

    // Input Validation: Non-negative amounts
    if (args.hra) {
      if (args.hra.annualRentPaid < 0) {
        throw new ConvexError("Annual rent paid cannot be negative");
      }
      if (args.hra.landlordPan?.trim()) {
        const pan = args.hra.landlordPan.trim().toUpperCase();
        if (!PAN_REGEX.test(pan)) {
          throw new ConvexError("Invalid Landlord PAN format. Must be 10 characters (e.g. ABCDE1234F)");
        }
      }
    }

    if (args.homeLoan) {
      if (args.homeLoan.annualInterest < 0) {
        throw new ConvexError("Home loan interest cannot be negative");
      }
      if (args.homeLoan.lenderPan?.trim()) {
        const pan = args.homeLoan.lenderPan.trim().toUpperCase();
        if (!PAN_REGEX.test(pan)) {
          throw new ConvexError("Invalid Lender PAN format. Must be 10 characters (e.g. ABCDE1234F)");
        }
      }
    }

    if (args.chapterVIA) {
      const c = args.chapterVIA;
      if (
        (c.section80C !== undefined && c.section80C < 0) ||
        (c.section80D !== undefined && c.section80D < 0) ||
        (c.section80CCD1B !== undefined && c.section80CCD1B < 0) ||
        (c.section80E !== undefined && c.section80E < 0) ||
        (c.section80G !== undefined && c.section80G < 0) ||
        (c.otherDeductions !== undefined && c.otherDeductions < 0)
      ) {
        throw new ConvexError("Chapter VI-A deduction amounts cannot be negative");
      }
    }

    const existing = await ctx.db
      .query("taxDeclarations")
      .withIndex("by_employee_fy", (q) =>
        q.eq("employeeId", me._id).eq("financialYear", args.financialYear),
      )
      .first();

    const now = Date.now();

    if (existing) {
      if (existing.status === "approved") {
        throw new ConvexError(
          "Cannot edit an approved declaration directly. Contact HR to unlock or request revision.",
        );
      }

      await ctx.db.patch(existing._id, {
        regime: args.regime,
        status: "draft",
        hra: args.hra,
        homeLoan: args.homeLoan,
        chapterVIA: args.chapterVIA,
        updatedAt: now,
      });

      await audit(ctx, args.workspaceId, userId, "declaration.saveDraft", {
        declarationId: existing._id,
        financialYear: args.financialYear,
      });

      return existing._id;
    }

    const id = await ctx.db.insert("taxDeclarations", {
      workspaceId: args.workspaceId,
      employeeId: me._id,
      financialYear: args.financialYear,
      regime: args.regime,
      status: "draft",
      hra: args.hra,
      homeLoan: args.homeLoan,
      chapterVIA: args.chapterVIA,
      proofs: [],
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "declaration.createDraft", {
      declarationId: id,
      financialYear: args.financialYear,
    });

    return id;
  },
});

export const submitDeclaration = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    declarationId: v.id("taxDeclarations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const me = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .first();

    if (!me) {
      throw new ConvexError("Employee profile not linked");
    }

    const decl = await ctx.db.get(args.declarationId);
    if (!decl || decl.workspaceId !== args.workspaceId) {
      throw new ConvexError("Declaration not found");
    }

    // IDOR Protection: Employee can only submit their own declaration
    if (decl.employeeId !== me._id) {
      throw new ConvexError("Forbidden: You cannot submit another employee's declaration");
    }

    if (decl.status === "approved") {
      throw new ConvexError("Declaration is already approved");
    }

    // Mandatory Rule: If rent exceeds ₹1,00,000 per annum, landlord PAN is mandatory under Section 192/Rule 26C
    if (decl.hra && decl.hra.annualRentPaid > 100000) {
      if (!decl.hra.landlordPan || !decl.hra.landlordPan.trim()) {
        throw new ConvexError(
          "Statutory requirement: Landlord PAN is mandatory when annual rent exceeds ₹1,00,000 under CBDT Circulars / Section 192.",
        );
      }
    }

    const now = Date.now();
    await ctx.db.patch(decl._id, {
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "declaration.submit", {
      declarationId: decl._id,
      financialYear: decl.financialYear,
    });

    return decl._id;
  },
});

export const getDeclarationById = query({
  args: {
    workspaceId: v.id("workspaces"),
    declarationId: v.id("taxDeclarations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    const decl = await ctx.db.get(args.declarationId);
    if (!decl || decl.workspaceId !== args.workspaceId) {
      throw new ConvexError("Declaration not found");
    }

    // IDOR Enforcement: Plain member can ONLY view their own declaration
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId),
        )
        .first();
      if (!me || me._id !== decl.employeeId) {
        throw new ConvexError("Forbidden: You cannot view another employee's tax declaration");
      }
    }

    const emp = await ctx.db.get(decl.employeeId);

    return {
      ...decl,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
      employeeEmail: emp?.email ?? "",
      department: emp?.department ?? "General",
    };
  },
});

export const listDeclarations = query({
  args: {
    workspaceId: v.id("workspaces"),
    financialYear: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    let q = ctx.db
      .query("taxDeclarations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    if (args.status) {
      q = ctx.db
        .query("taxDeclarations")
        .withIndex("by_workspace_status", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("status", args.status as "draft" | "submitted" | "approved" | "rejected"),
        );
    }

    const rows = await q.order("desc").collect();

    const filtered = args.financialYear
      ? rows.filter((r) => r.financialYear === args.financialYear)
      : rows;

    return Promise.all(
      filtered.map(async (d) => {
        const emp = await ctx.db.get(d.employeeId);
        return {
          ...d,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
          employeeEmail: emp?.email ?? "",
          department: emp?.department ?? "General",
        };
      }),
    );
  },
});

export const reviewDeclaration = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    declarationId: v.id("taxDeclarations"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewRemarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const decl = await ctx.db.get(args.declarationId);
    if (!decl || decl.workspaceId !== args.workspaceId) {
      throw new ConvexError("Declaration not found");
    }

    if (decl.status !== "submitted") {
      throw new ConvexError(`Cannot review declaration with status '${decl.status}'. Must be 'submitted'.`);
    }

    const now = Date.now();
    await ctx.db.patch(decl._id, {
      status: args.status,
      reviewedBy: userId,
      reviewedAt: now,
      reviewRemarks: args.reviewRemarks?.trim(),
      updatedAt: now,
    });

    // If approved, synchronize employee's elected taxRegime in employeeCompliance
    if (args.status === "approved") {
      const existingComp = await ctx.db
        .query("employeeCompliance")
        .withIndex("by_employee", (q) => q.eq("employeeId", decl.employeeId))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      if (existingComp) {
        await ctx.db.patch(existingComp._id, {
          taxRegime: decl.regime,
          updatedAt: now,
        });
      }
    }

    await audit(ctx, args.workspaceId, userId, "declaration.review", {
      declarationId: decl._id,
      status: args.status,
      employeeId: decl.employeeId,
      remarks: args.reviewRemarks,
    });

    return decl._id;
  },
});

export const attachProof = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    declarationId: v.id("taxDeclarations"),
    category: v.string(), // "rent_receipt", "insurance_receipt", "home_loan_cert", "investment_proof", "other"
    title: v.string(),
    fileName: v.string(),
    fileId: v.optional(v.id("files")),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    const decl = await ctx.db.get(args.declarationId);
    if (!decl || decl.workspaceId !== args.workspaceId) {
      throw new ConvexError("Declaration not found");
    }

    // IDOR Protection: Plain member can only attach proofs to their own declaration
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId),
        )
        .first();
      if (!me || me._id !== decl.employeeId) {
        throw new ConvexError("Forbidden: You cannot upload proofs to another employee's declaration");
      }
    }

    if (decl.status === "approved") {
      throw new ConvexError("Cannot attach proofs to an already approved declaration.");
    }

    const proofItem = {
      id: `prf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: args.category,
      title: args.title.trim(),
      fileName: args.fileName,
      fileId: args.fileId,
      storageId: args.storageId,
      uploadedAt: Date.now(),
    };

    const updatedProofs = [...decl.proofs, proofItem];

    await ctx.db.patch(decl._id, {
      proofs: updatedProofs,
      updatedAt: Date.now(),
    });

    await audit(ctx, args.workspaceId, userId, "declaration.attachProof", {
      declarationId: decl._id,
      proofId: proofItem.id,
      title: args.title,
    });

    return proofItem.id;
  },
});

export const removeProof = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    declarationId: v.id("taxDeclarations"),
    proofId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    const decl = await ctx.db.get(args.declarationId);
    if (!decl || decl.workspaceId !== args.workspaceId) {
      throw new ConvexError("Declaration not found");
    }

    // IDOR Protection: Plain member can only remove proofs from their own declaration
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId),
        )
        .first();
      if (!me || me._id !== decl.employeeId) {
        throw new ConvexError("Forbidden: You cannot delete another employee's proof");
      }
    }

    if (decl.status === "approved") {
      throw new ConvexError("Cannot remove proofs from an already approved declaration.");
    }

    const updatedProofs = decl.proofs.filter((p) => p.id !== args.proofId);

    await ctx.db.patch(decl._id, {
      proofs: updatedProofs,
      updatedAt: Date.now(),
    });

    await audit(ctx, args.workspaceId, userId, "declaration.removeProof", {
      declarationId: decl._id,
      proofId: args.proofId,
    });

    return true;
  },
});
