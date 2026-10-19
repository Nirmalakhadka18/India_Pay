import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules: Record<string, () => Promise<any>> =
  typeof (import.meta as any).glob === "function"
    ? (import.meta as any).glob(["./**/*.*s", "!./**/*.test.*"])
    : {
        "./ResendOTP.ts": () => import("./ResendOTP"),
        "./apiKeys.ts": () => import("./apiKeys"),
        "./audit.ts": () => import("./audit"),
        "./auditLog.ts": () => import("./auditLog"),
        "./auth.config.ts": () => import("./auth.config"),
        "./auth.ts": () => import("./auth"),
        "./backend.ts": () => import("./backend"),
        "./counters.ts": () => import("./counters"),
        "./dashboard.ts": () => import("./dashboard"),
        "./devGuard.ts": () => import("./devGuard"),
        "./email.ts": () => import("./email"),
        "./env.ts": () => import("./env"),
        "./files.ts": () => import("./files"),
        "./http.ts": () => import("./http"),
        "./init.ts": () => import("./init"),
        "./jobs.ts": () => import("./jobs"),
        "./notifications.ts": () => import("./notifications"),
        "./orgs.ts": () => import("./orgs"),
        "./passwordProviders.ts": () => import("./passwordProviders"),
        "./schema.ts": () => import("./schema"),
        "./seed.ts": () => import("./seed"),
        "./sessions.ts": () => import("./sessions"),
        "./subscriptions.ts": () => import("./subscriptions"),
        "./usage.ts": () => import("./usage"),
        "./users.ts": () => import("./users"),
        "./web.ts": () => import("./web"),
        "./attendance.ts": () => import("./attendance"),
        "./compliance.ts": () => import("./compliance"),
        "./declarations.ts": () => import("./declarations"),
        "./employees.ts": () => import("./employees"),
        "./leaves.ts": () => import("./leaves"),
        "./lop.ts": () => import("./lop"),
        "./payroll.ts": () => import("./payroll"),
        "./salaries.ts": () => import("./salaries"),
        "./statutory.ts": () => import("./statutory"),
        "./statutoryTds.ts": () => import("./statutoryTds"),
        "./professionalTax.ts": () => import("./professionalTax"),
        "./devAccounts.ts": () => import("./devAccounts"),
        "./devAccountsMutation.ts": () => import("./devAccountsMutation"),
        "./_generated/api.js": () => import("./_generated/api.js"),
        "./_generated/server.js": () => import("./_generated/server.js"),
      };

const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

async function seedDeclarationWorkspace(t: any) {
  let ws: any;
  let owner: any;
  let admin: any;
  let user1: any;
  let user2: any;
  let emp1: any;
  let emp2: any;

  await t.run(async (ctx: any) => {
    owner = await ctx.db.insert("users", {
      name: "Owner User",
      email: "owner@test.com",
    });
    admin = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@test.com",
    });
    user1 = await ctx.db.insert("users", {
      name: "Employee One",
      email: "emp1@test.com",
    });
    user2 = await ctx.db.insert("users", {
      name: "Employee Two",
      email: "emp2@test.com",
    });

    ws = await ctx.db.insert("workspaces", {
      name: "Tax Test Corp",
      ownerId: owner,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: owner,
      role: "owner",
      createdAt: Date.now(),
    });
    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: admin,
      role: "admin",
      createdAt: Date.now(),
    });
    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: user1,
      role: "member",
      createdAt: Date.now(),
    });
    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: user2,
      role: "member",
      createdAt: Date.now(),
    });

    emp1 = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Rohan",
      lastName: "Sharma",
      email: "rohan@test.com",
      status: "active",
      userId: user1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    emp2 = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Priya",
      lastName: "Verma",
      email: "priya@test.com",
      status: "active",
      userId: user2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Seed salary for emp1: Basic ₹50,000, HRA ₹25,000, Gross ₹100,000
    await ctx.db.insert("salaries", {
      workspaceId: ws,
      employeeId: emp1,
      basicSalary: 50000,
      allowances: [
        { name: "HRA", amount: 25000 },
        { name: "Special", amount: 25000 },
      ],
      deductions: [],
      grossSalary: 100000,
      effectiveDate: Date.now() - 10000,
      createdAt: Date.now() - 10000,
    });

    // Seed compliance for emp1
    await ctx.db.insert("employeeCompliance", {
      workspaceId: ws,
      employeeId: emp1,
      taxRegime: "old",
      epfOptOut: false,
      tdsOverride: 2500, // Manual override
      updatedAt: Date.now(),
    });
  });

  return { ws, owner, admin, user1, user2, emp1, emp2 };
}

describe("Employee Tax Declarations (Form 12BB) Suite", () => {
  test("Employee can save and retrieve their draft Form 12BB declaration", async () => {
    const t = convexTest(schema, modules);
    const { ws, user1, emp1 } = await seedDeclarationWorkspace(t);
    const asEmp1 = t.withIdentity(as(user1));

    // Save draft
    const declId = await asEmp1.mutation(
      api.declarations.saveDraftDeclaration,
      {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        hra: {
          annualRentPaid: 180000,
          landlordName: "Venkatesh Rao",
          landlordPan: "ABCDE1234F",
          cityType: "metro",
        },
        chapterVIA: {
          section80C: 150000,
          section80D: 25000,
        },
      },
    );

    expect(declId).toBeDefined();

    // Query own declaration
    const myDecl = await asEmp1.query(api.declarations.getMyDeclaration, {
      workspaceId: ws,
      financialYear: "2026-27",
    });

    expect(myDecl).toBeDefined();
    expect(myDecl?.status).toBe("draft");
    expect(myDecl?.regime).toBe("old");
    expect(myDecl?.hra?.annualRentPaid).toBe(180000);
    expect(myDecl?.chapterVIA?.section80C).toBe(150000);
  });

  test("Input validation: Rejects negative amounts and malformed PAN", async () => {
    const t = convexTest(schema, modules);
    const { ws, user1 } = await seedDeclarationWorkspace(t);
    const asEmp1 = t.withIdentity(as(user1));

    // Negative rent rejected
    await expect(
      asEmp1.mutation(api.declarations.saveDraftDeclaration, {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        hra: { annualRentPaid: -50000, cityType: "metro" },
      }),
    ).rejects.toThrow(/Annual rent paid cannot be negative/);

    // Negative 80C rejected
    await expect(
      asEmp1.mutation(api.declarations.saveDraftDeclaration, {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        chapterVIA: { section80C: -10000 },
      }),
    ).rejects.toThrow(/Chapter VI-A deduction amounts cannot be negative/);

    // Invalid PAN format rejected
    await expect(
      asEmp1.mutation(api.declarations.saveDraftDeclaration, {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        hra: {
          annualRentPaid: 120000,
          landlordPan: "INVALID_PAN_123",
          cityType: "metro",
        },
      }),
    ).rejects.toThrow(/Invalid Landlord PAN format/);
  });

  test("IDOR Defense: Plain member cannot view, submit, or alter another employee's declaration", async () => {
    const t = convexTest(schema, modules);
    const { ws, user1, user2 } = await seedDeclarationWorkspace(t);
    const asEmp1 = t.withIdentity(as(user1));
    const asEmp2 = t.withIdentity(as(user2));

    // Emp1 creates draft declaration
    const emp1DeclId = await asEmp1.mutation(
      api.declarations.saveDraftDeclaration,
      {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        chapterVIA: { section80C: 100000 },
      },
    );

    // Emp2 cannot view Emp1's declaration by ID
    await expect(
      asEmp2.query(api.declarations.getDeclarationById, {
        workspaceId: ws,
        declarationId: emp1DeclId,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Emp2 cannot submit Emp1's declaration
    await expect(
      asEmp2.mutation(api.declarations.submitDeclaration, {
        workspaceId: ws,
        declarationId: emp1DeclId,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Emp2 cannot attach proofs to Emp1's declaration
    await expect(
      asEmp2.mutation(api.declarations.attachProof, {
        workspaceId: ws,
        declarationId: emp1DeclId,
        category: "rent_receipt",
        title: "Malicious Attachment",
        fileName: "hack.pdf",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("Statutory rule: Submission requires landlord PAN if rent > ₹1,00,000", async () => {
    const t = convexTest(schema, modules);
    const { ws, user1 } = await seedDeclarationWorkspace(t);
    const asEmp1 = t.withIdentity(as(user1));

    // Save draft with rent > 100k but NO PAN
    const declId = await asEmp1.mutation(
      api.declarations.saveDraftDeclaration,
      {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        hra: { annualRentPaid: 150000, cityType: "non_metro" },
      },
    );

    // Submitting without landlord PAN must be rejected
    await expect(
      asEmp1.mutation(api.declarations.submitDeclaration, {
        workspaceId: ws,
        declarationId: declId,
      }),
    ).rejects.toThrow(
      /Landlord PAN is mandatory when annual rent exceeds ₹1,00,000/,
    );

    // Update with valid PAN
    await asEmp1.mutation(api.declarations.saveDraftDeclaration, {
      workspaceId: ws,
      financialYear: "2026-27",
      regime: "old",
      hra: {
        annualRentPaid: 150000,
        landlordPan: "ABCDE1234F",
        cityType: "non_metro",
      },
    });

    // Submission now succeeds
    const submittedId = await asEmp1.mutation(
      api.declarations.submitDeclaration,
      {
        workspaceId: ws,
        declarationId: declId,
      },
    );
    expect(submittedId).toBe(declId);
  });

  test("Admin review, approval, and rejection workflow", async () => {
    const t = convexTest(schema, modules);
    const { ws, user1, admin } = await seedDeclarationWorkspace(t);
    const asEmp1 = t.withIdentity(as(user1));
    const asAdmin = t.withIdentity(as(admin));

    const declId = await asEmp1.mutation(
      api.declarations.saveDraftDeclaration,
      {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "new",
      },
    );

    await asEmp1.mutation(api.declarations.submitDeclaration, {
      workspaceId: ws,
      declarationId: declId,
    });

    // Admin lists declarations
    const list = await asAdmin.query(api.declarations.listDeclarations, {
      workspaceId: ws,
      financialYear: "2026-27",
      status: "submitted",
    });
    expect(list.length).toBe(1);
    expect(list[0]._id).toBe(declId);

    // Admin approves declaration
    await asAdmin.mutation(api.declarations.reviewDeclaration, {
      workspaceId: ws,
      declarationId: declId,
      status: "approved",
      reviewRemarks: "Form 12BB verified and accepted",
    });

    const reviewed = await asAdmin.query(api.declarations.getDeclarationById, {
      workspaceId: ws,
      declarationId: declId,
    });
    expect(reviewed.status).toBe("approved");
    expect(reviewed.reviewRemarks).toBe("Form 12BB verified and accepted");
  });

  test("Advisory TDS projection incorporates approved Form 12BB deductions without altering manual overrides", async () => {
    const t = convexTest(schema, modules);
    const { ws, user1, admin, emp1 } = await seedDeclarationWorkspace(t);
    const asEmp1 = t.withIdentity(as(user1));
    const asAdmin = t.withIdentity(as(admin));

    // 1. Submit and approve an Old Regime declaration with ₹1.5L 80C and ₹25k 80D
    const declId = await asEmp1.mutation(
      api.declarations.saveDraftDeclaration,
      {
        workspaceId: ws,
        financialYear: "2026-27",
        regime: "old",
        chapterVIA: {
          section80C: 150000,
          section80D: 25000,
        },
      },
    );

    await asEmp1.mutation(api.declarations.submitDeclaration, {
      workspaceId: ws,
      declarationId: declId,
    });

    await asAdmin.mutation(api.declarations.reviewDeclaration, {
      workspaceId: ws,
      declarationId: declId,
      status: "approved",
    });

    // 2. Query advisory TDS projection: it should automatically incorporate approved deductions
    const projection = await asEmp1.query(api.compliance.previewTdsProjection, {
      workspaceId: ws,
      employeeId: emp1,
      financialYear: "2026-27",
    });

    expect(projection.taxRegime).toBe("old");
    expect(projection.declarationStatus).toBe("approved");
    // Standard deduction (50k) + 80C (150k) + 80D (25k) = 225,000
    expect(projection.totalExemptionsAndDeductions).toBe(225000);
    expect(projection.isAdvisoryOnly).toBe(true);

    // 3. Verify that production compliance still retains manual override (₹2,500)
    const empCompliance = await asAdmin.query(
      api.compliance.getEmployeeCompliance,
      {
        workspaceId: ws,
        employeeId: emp1,
      },
    );
    expect(empCompliance.tdsOverride).toBe(2500);
  });
});
