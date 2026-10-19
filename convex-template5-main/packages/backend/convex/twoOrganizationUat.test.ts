import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id, MutationCtx } from "./_generated/dataModel";
import schema from "./schema";

// biome-ignore lint/suspicious/noExplicitAny: convexTest modules map
const modules: any = import.meta.glob("./**/*.*s");

const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

describe("Two-Organization Multi-Tenant User Acceptance Test (UAT)", () => {
  test("Complete cross-organization isolation across employees, payroll runs, approvals, payslips, and statutory reports", async () => {
    const t = convexTest(schema, modules);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SETUP TWO INDEPENDENT WORKSPACES (COMPANIES)
    // ─────────────────────────────────────────────────────────────────────────
    let ws1Id!: Id<"workspaces">;
    let ws2Id!: Id<"workspaces">;

    let owner1Id!: Id<"users">;
    let admin1Id!: Id<"users">;
    let emp1UserId!: Id<"users">;

    let owner2Id!: Id<"users">;
    let admin2Id!: Id<"users">;
    let emp2UserId!: Id<"users">;

    await t.run(async (ctx: MutationCtx) => {
      // Organization 1 Users
      owner1Id = await ctx.db.insert("users", {
        name: "Apex Owner",
        email: "owner@apex.com",
      });
      admin1Id = await ctx.db.insert("users", {
        name: "Apex Admin",
        email: "admin@apex.com",
      });
      emp1UserId = await ctx.db.insert("users", {
        name: "Vikram Malhotra",
        email: "vikram@apex.com",
      });

      // Organization 2 Users
      owner2Id = await ctx.db.insert("users", {
        name: "Nexus Owner",
        email: "owner@nexus.com",
      });
      admin2Id = await ctx.db.insert("users", {
        name: "Nexus Admin",
        email: "admin@nexus.com",
      });
      emp2UserId = await ctx.db.insert("users", {
        name: "Rahul Verma",
        email: "rahul@nexus.com",
      });

      // Workspace 1: Tata Apex Digital Pvt Ltd
      ws1Id = await ctx.db.insert("workspaces", {
        name: "Tata Apex Digital Pvt Ltd",
        ownerId: owner1Id,
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws1Id,
        userId: owner1Id,
        role: "owner",
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws1Id,
        userId: admin1Id,
        role: "admin",
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws1Id,
        userId: emp1UserId,
        role: "member",
        createdAt: Date.now(),
      });

      // Workspace 2: Reliance Nexus Systems Ltd
      ws2Id = await ctx.db.insert("workspaces", {
        name: "Reliance Nexus Systems Ltd",
        ownerId: owner2Id,
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws2Id,
        userId: owner2Id,
        role: "owner",
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws2Id,
        userId: admin2Id,
        role: "admin",
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws2Id,
        userId: emp2UserId,
        role: "member",
        createdAt: Date.now(),
      });

      // Workspace 1 Compliance Settings (Bengaluru, Karnataka)
      await ctx.db.insert("workspaceCompliance", {
        workspaceId: ws1Id,
        epfEnabled: true,
        epfWageCeiling: 15000,
        epfEstablishmentCode: "KNBLR0012345000",
        esiEnabled: true,
        esiWageCeiling: 21000,
        ptEnabled: true,
        ptState: "Karnataka",
        lwfEnabled: true,
        lwfState: "Karnataka",
        tan: "BLRK12345A",
        employerPan: "AABCI1234F",
        deductorType: "company",
        updatedAt: Date.now(),
      });

      // Workspace 2 Compliance Settings (Mumbai, Maharashtra)
      await ctx.db.insert("workspaceCompliance", {
        workspaceId: ws2Id,
        epfEnabled: true,
        epfWageCeiling: 15000,
        epfEstablishmentCode: "MHBAN0098765000",
        esiEnabled: true,
        esiWageCeiling: 21000,
        ptEnabled: true,
        ptState: "Maharashtra",
        lwfEnabled: true,
        lwfState: "Maharashtra",
        tan: "MUMR54321B",
        employerPan: "BBBCI5678G",
        deductorType: "company",
        updatedAt: Date.now(),
      });
    });

    const asOwner1 = t.withIdentity(as(owner1Id));
    const asAdmin1 = t.withIdentity(as(admin1Id));
    const asEmp1 = t.withIdentity(as(emp1UserId));

    const asOwner2 = t.withIdentity(as(owner2Id));
    const asAdmin2 = t.withIdentity(as(admin2Id));
    const asEmp2 = t.withIdentity(as(emp2UserId));

    // ─────────────────────────────────────────────────────────────────────────
    // 2. EMPLOYEE CREATION & WORKSPACE ISOLATION
    // ─────────────────────────────────────────────────────────────────────────
    // Organization 1 creates Vikram
    const emp1Id = await asAdmin1.mutation(api.employees.add, {
      workspaceId: ws1Id,
      firstName: "Vikram",
      lastName: "Malhotra",
      email: "vikram@apex.com",
      pan: "ABCDE1234F",
      uan: "100987654321",
      bankAccountNumber: "50100234567890",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0001234",
    });
    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.patch(emp1Id, { userId: emp1UserId });
    });

    // Organization 2 creates Rahul
    const emp2Id = await asAdmin2.mutation(api.employees.add, {
      workspaceId: ws2Id,
      firstName: "Rahul",
      lastName: "Verma",
      email: "rahul@nexus.com",
      pan: "XYZPA9876K",
      uan: "100123456789",
      bankAccountNumber: "60200987654321",
      bankName: "ICICI Bank",
      ifscCode: "ICIC0005678",
    });
    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.patch(emp2Id, { userId: emp2UserId });
    });

    // Verification: Organization 1 Admin can ONLY see Vikram
    const ws1Employees = await asAdmin1.query(api.employees.list, {
      workspaceId: ws1Id,
    });
    expect(ws1Employees.length).toBe(1);
    expect(ws1Employees[0]!.firstName).toBe("Vikram");
    expect(ws1Employees.some((e) => e.firstName === "Rahul")).toBe(false);

    // Verification: Organization 2 Admin can ONLY see Rahul
    const ws2Employees = await asAdmin2.query(api.employees.list, {
      workspaceId: ws2Id,
    });
    expect(ws2Employees.length).toBe(1);
    expect(ws2Employees[0]!.firstName).toBe("Rahul");
    expect(ws2Employees.some((e) => e.firstName === "Vikram")).toBe(false);

    // Negative IDOR Test: Admin 1 cannot access Organization 2 employees
    await expect(
      asAdmin1.query(api.employees.list, { workspaceId: ws2Id }),
    ).rejects.toThrow("Forbidden");

    // Negative IDOR Test: Admin 2 cannot access Organization 1 employees
    await expect(
      asAdmin2.query(api.employees.list, { workspaceId: ws1Id }),
    ).rejects.toThrow("Forbidden");

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SALARY STRUCTURE & ATTENDANCE SETUP
    // ─────────────────────────────────────────────────────────────────────────
    // Org 1: Vikram has Basic ₹50,000 + HRA ₹20,000 = ₹70,000
    await asAdmin1.mutation(api.salaries.add, {
      workspaceId: ws1Id,
      employeeId: emp1Id,
      basicSalary: 50000,
      allowances: [{ name: "HRA", amount: 20000 }],
      deductions: [],
      effectiveDate: Date.now(),
    });

    // Org 2: Rahul has Basic ₹30,000 + HRA ₹10,000 = ₹40,000
    await asAdmin2.mutation(api.salaries.add, {
      workspaceId: ws2Id,
      employeeId: emp2Id,
      basicSalary: 30000,
      allowances: [{ name: "HRA", amount: 10000 }],
      deductions: [],
      effectiveDate: Date.now(),
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. INDEPENDENT PAYROLL RUNS & MAKER-CHECKER PER WORKSPACE
    // ─────────────────────────────────────────────────────────────────────────
    // Org 1 Admin creates April 2026 payroll run
    const run1Id = await asAdmin1.mutation(api.payroll.createRun, {
      workspaceId: ws1Id,
      periodMonth: "2026-04",
    });
    const run1Details = await asAdmin1.query(api.payroll.getRunDetails, {
      workspaceId: ws1Id,
      payrollRunId: run1Id,
    });
    expect(run1Details.run.totalEmployees).toBe(1);
    expect(run1Details.run.totalGrossSalary).toBe(70000);

    // Org 2 Admin creates April 2026 payroll run
    const run2Id = await asAdmin2.mutation(api.payroll.createRun, {
      workspaceId: ws2Id,
      periodMonth: "2026-04",
    });
    const run2Details = await asAdmin2.query(api.payroll.getRunDetails, {
      workspaceId: ws2Id,
      payrollRunId: run2Id,
    });
    expect(run2Details.run.totalEmployees).toBe(1);
    expect(run2Details.run.totalGrossSalary).toBe(40000);

    // Negative IDOR: Org 2 Admin cannot query Org 1 payroll run
    await expect(
      asAdmin2.query(api.payroll.getRunDetails, {
        workspaceId: ws1Id,
        payrollRunId: run1Id,
      }),
    ).rejects.toThrow("Forbidden");

    // Maker-Checker in Org 1:
    await asAdmin1.mutation(api.payroll.submitForApproval, {
      workspaceId: ws1Id,
      payrollRunId: run1Id,
    });

    // Submitter cannot approve their own run
    await expect(
      asAdmin1.mutation(api.payroll.approveRun, {
        workspaceId: ws1Id,
        payrollRunId: run1Id,
      }),
    ).rejects.toThrow("You cannot approve a payroll run that you submitted");

    // Cross-tenant approval attempt: Org 2 Owner cannot approve Org 1 run
    await expect(
      asOwner2.mutation(api.payroll.approveRun, {
        workspaceId: ws1Id,
        payrollRunId: run1Id,
      }),
    ).rejects.toThrow("Forbidden");

    // Valid Approval & Finalization in Org 1:
    await asOwner1.mutation(api.payroll.approveRun, {
      workspaceId: ws1Id,
      payrollRunId: run1Id,
    });
    await asOwner1.mutation(api.payroll.finalizeRun, {
      workspaceId: ws1Id,
      payrollRunId: run1Id,
    });

    // Valid Approval & Finalization in Org 2:
    await asAdmin2.mutation(api.payroll.submitForApproval, {
      workspaceId: ws2Id,
      payrollRunId: run2Id,
    });
    await asOwner2.mutation(api.payroll.approveRun, {
      workspaceId: ws2Id,
      payrollRunId: run2Id,
    });
    await asOwner2.mutation(api.payroll.finalizeRun, {
      workspaceId: ws2Id,
      payrollRunId: run2Id,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. EMPLOYEE PAYSLIP ACCESS & NEGATIVE IDOR CHECKS
    // ─────────────────────────────────────────────────────────────────────────
    // Emp 1 (Vikram) queries his own finalized payslip in Org 1 -> SUCCESS
    const emp1Payslip = await asEmp1.query(api.payroll.getPayslip, {
      workspaceId: ws1Id,
      payrollRunId: run1Id,
      employeeId: emp1Id,
    });
    expect(emp1Payslip.employeeName).toBe("Vikram Malhotra");
    expect(emp1Payslip.maskedPan).toBe("••••••234F");
    expect(emp1Payslip.maskedBankAccountNumber).toBe("••••••••••7890");

    // Emp 2 (Rahul) queries his own finalized payslip in Org 2 -> SUCCESS
    const emp2Payslip = await asEmp2.query(api.payroll.getPayslip, {
      workspaceId: ws2Id,
      payrollRunId: run2Id,
      employeeId: emp2Id,
    });
    expect(emp2Payslip.employeeName).toBe("Rahul Verma");
    expect(emp2Payslip.maskedPan).toBe("••••••876K");
    expect(emp2Payslip.maskedBankAccountNumber).toBe("••••••••••4321");

    // Negative IDOR: Emp 2 attempts to query Emp 1's payslip in Org 1 -> FORBIDDEN
    await expect(
      asEmp2.query(api.payroll.getPayslip, {
        workspaceId: ws1Id,
        payrollRunId: run1Id,
        employeeId: emp1Id,
      }),
    ).rejects.toThrow("Forbidden");

    // Negative IDOR: Emp 1 attempts to query Emp 2's payslip in Org 2 -> FORBIDDEN
    await expect(
      asEmp1.query(api.payroll.getPayslip, {
        workspaceId: ws2Id,
        payrollRunId: run2Id,
        employeeId: emp2Id,
      }),
    ).rejects.toThrow("Forbidden");

    // ─────────────────────────────────────────────────────────────────────────
    // 6. STATUTORY REPORT ACCESS ISOLATION (EPFO ECR & TDS FORM 138)
    // ─────────────────────────────────────────────────────────────────────────
    // Org 1 EPFO ECR: Contains Vikram's UAN, never Rahul's
    const ws1Ecr = await asAdmin1.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws1Id,
      payrollRunId: run1Id,
    });
    expect(ws1Ecr.success).toBe(true);
    expect(ws1Ecr.totalRecords).toBe(1);
    expect(ws1Ecr.fileContent).toContain("100987654321");
    expect(ws1Ecr.fileContent).toContain("VIKRAM MALHOTRA");
    expect(ws1Ecr.fileContent).not.toContain("100123456789");
    expect(ws1Ecr.fileContent).not.toContain("RAHUL VERMA");

    // Org 2 EPFO ECR: Contains Rahul's UAN, never Vikram's
    const ws2Ecr = await asAdmin2.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws2Id,
      payrollRunId: run2Id,
    });
    expect(ws2Ecr.success).toBe(true);
    expect(ws2Ecr.totalRecords).toBe(1);
    expect(ws2Ecr.fileContent).toContain("100123456789");
    expect(ws2Ecr.fileContent).toContain("RAHUL VERMA");
    expect(ws2Ecr.fileContent).not.toContain("100987654321");
    expect(ws2Ecr.fileContent).not.toContain("VIKRAM MALHOTRA");

    // Negative IDOR: Org 2 Admin cannot preview Org 1 EPFO ECR
    await expect(
      asAdmin2.query(api.epfoEcr.previewEpfoEcrExport, {
        workspaceId: ws1Id,
        payrollRunId: run1Id,
      }),
    ).rejects.toThrow("Forbidden");

    // Org 1 TDS Form 138: Contains Org 1 TAN (BLRK12345A) and Vikram's PAN
    await asAdmin1.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws1Id,
      financialYear: "2026-27",
      quarter: "Q1",
      bsrCode: "0210001",
      depositDate: "2026-05-07",
      challanSerialNumber: "00050",
      minorHead: "200",
      taxAmount: 5000,
    });
    const ws1Tds = await asAdmin1.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws1Id,
      financialYear: "2026-27",
      quarter: "Q1",
    });
    expect(ws1Tds.success).toBe(true);
    expect(ws1Tds.fileContent).toContain("BLRK12345A");
    expect(ws1Tds.fileContent).toContain("ABCDE1234F");
    expect(ws1Tds.fileContent).not.toContain("MUMR54321B");
    expect(ws1Tds.fileContent).not.toContain("XYZPA9876K");

    // Negative IDOR: Org 2 Admin cannot preview Org 1 TDS Form 138
    await expect(
      asAdmin2.query(api.form138Tds.previewQuarterlyTds, {
        workspaceId: ws1Id,
        financialYear: "2026-27",
        quarter: "Q1",
      }),
    ).rejects.toThrow("Forbidden");
  });
});
