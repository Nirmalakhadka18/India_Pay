import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireRole } from "./orgs";

/**
 * EPFO Electronic Challan cum Return (ECR Version 2.0) Generator & Reconciliation Engine.
 *
 * Official Specification:
 * - Text file (.txt) using delimiter: #~#
 * - Delimiter between fields: exactly "#~#"
 * - Exactly 11 mandatory columns per member row:
 *   1. UAN (12 numeric digits)
 *   2. MEMBER_NAME (Uppercase, alphanumeric/spaces/dots/apostrophes, max 80 chars)
 *   3. GROSS_WAGES (Whole rupees)
 *   4. EPF_WAGES (Statutory ceiling ₹15,000 or voluntary actual basic)
 *   5. EPS_WAGES (Capped at statutory EPS ceiling ₹15,000)
 *   6. EDLI_WAGES (Capped at statutory EDLI ceiling ₹15,000)
 *   7. EE_SHARE (Employee 12% EPF share)
 *   8. EPS_SHARE (Employer 8.33% EPS share, capped at ₹1,250)
 *   9. ER_SHARE (Employer EPF share: EE_SHARE - EPS_SHARE)
 *   10. NCP_DAYS (Non-Contributing Period days, 0 to 31)
 *   11. REFUND_OF_ADVANCES (0)
 */

export const ECR_DELIMITER = "#~#";

export interface EpfoEcrRowInput {
  uan: string;
  memberName: string;
  grossWages: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  eeShare: number;
  epsShare: number;
  erShare: number;
  ncpDays: number;
  refundOfAdvances?: number;
}

export interface EpfoEcrRowResult {
  formattedLine: string;
  uan: string;
  memberName: string;
  grossWages: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  eeShare: number;
  epsShare: number;
  erShare: number;
  ncpDays: number;
  refundOfAdvances: number;
}

export interface EpfoChallanAccountSummary {
  account1: {
    accountNumber: "1";
    name: "Employees' Provident Fund (A/c 1)";
    eeShare: number;
    erShare: number;
    total: number;
  };
  account2: {
    accountNumber: "2";
    name: "EPF Administrative Charges (A/c 2 - 0.50%)";
    rate: "0.50%";
    calculatedAmount: number;
    statutoryMinimum: number;
    minimumApplied: boolean;
    total: number;
  };
  account10: {
    accountNumber: "10";
    name: "Employees' Pension Scheme (A/c 10 - 8.33%)";
    rate: "8.33%";
    total: number;
  };
  account21: {
    accountNumber: "21";
    name: "EDLI Contribution (A/c 21 - 0.50%)";
    rate: "0.50%";
    calculatedAmount: number;
    total: number;
  };
  account22: {
    accountNumber: "22";
    name: "EDLI Administrative Charges (A/c 22 - Waived)";
    rate: "0.00%";
    total: 0;
  };
  totalRemittance: number;
}

export interface EpfoEcrSummary {
  periodMonth: string;
  establishmentCode?: string;
  totalMembers: number;
  totalGrossWages: number;
  totalEpfWages: number;
  totalEpsWages: number;
  totalEdliWages: number;
  totalEeShare: number;
  totalEpsShare: number;
  totalErShare: number;
  totalNcpDays: number;
  totalRefundOfAdvances: number;
  challanAccounts: EpfoChallanAccountSummary;
}

// ── Validation and Sanitization Functions ─────────────────────────────────────

export function sanitizeMemberName(name: string): string {
  if (!name) return "UNKNOWN";
  // Strip the delimiter string #~# and any carriage returns / newlines
  const stripped = name
    .replaceAll(ECR_DELIMITER, "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^A-Za-z0-9 .'-]/g, "") // Keep alphanumeric, spaces, dots, apostrophes, hyphens
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return stripped.slice(0, 80) || "EMPLOYEE";
}

export function validateUanForEcr(
  uan: string | undefined | null,
  employeeIdentifier: string,
): { valid: boolean; error?: string; cleanUan?: string } {
  if (!uan || !uan.trim()) {
    return {
      valid: false,
      error: `Employee "${employeeIdentifier}" is enrolled in EPF but is missing a Universal Account Number (UAN). UAN is mandatory for EPFO ECR filing.`,
    };
  }
  const clean = uan.trim();
  if (!/^\d{12}$/.test(clean)) {
    return {
      valid: false,
      error: `Employee "${employeeIdentifier}" has invalid UAN "${clean}". UAN must be exactly 12 numeric digits.`,
    };
  }
  return { valid: true, cleanUan: clean };
}

export function buildEcrRecord(input: EpfoEcrRowInput): EpfoEcrRowResult {
  const cleanUan = input.uan.trim();
  const cleanName = sanitizeMemberName(input.memberName);
  const gross = Math.max(0, Math.round(input.grossWages));
  const epfWages = Math.max(0, Math.min(gross, Math.round(input.epfWages)));
  const epsWages = Math.max(
    0,
    Math.min(epfWages, 15000, Math.round(input.epsWages)),
  );
  const edliWages = Math.max(
    0,
    Math.min(epfWages, 15000, Math.round(input.edliWages)),
  );
  const eeShare = Math.max(0, Math.round(input.eeShare));
  const epsShare = Math.max(0, Math.min(1250, Math.round(input.epsShare)));
  const erShare = Math.max(0, Math.round(input.erShare));
  const ncpDays = Math.max(0, Math.min(31, Math.round(input.ncpDays)));
  const refund = Math.max(0, Math.round(input.refundOfAdvances ?? 0));

  const columns = [
    cleanUan,
    cleanName,
    gross.toString(),
    epfWages.toString(),
    epsWages.toString(),
    edliWages.toString(),
    eeShare.toString(),
    epsShare.toString(),
    erShare.toString(),
    ncpDays.toString(),
    refund.toString(),
  ];

  const formattedLine = columns.join(ECR_DELIMITER);

  return {
    formattedLine,
    uan: cleanUan,
    memberName: cleanName,
    grossWages: gross,
    epfWages,
    epsWages,
    edliWages,
    eeShare,
    epsShare,
    erShare,
    ncpDays,
    refundOfAdvances: refund,
  };
}

export function calculateChallanAccounts(
  totalEpfWages: number,
  totalEdliWages: number,
  totalEeShare: number,
  totalEpsShare: number,
  totalErShare: number,
  adminChargesEnabled = true,
  edliEnabled = true,
): EpfoChallanAccountSummary {
  // A/c 1: Employee share (12%) + Employer EPF share (ER share)
  const account1Total = totalEeShare + totalErShare;

  // A/c 2: Admin charges (0.50% of EPF wages, Statutory minimum ₹500 for operational est)
  let account2Total = 0;
  let account2Calculated = 0;
  let account2MinApplied = false;
  if (adminChargesEnabled && totalEpfWages > 0) {
    account2Calculated = Math.round(totalEpfWages * 0.005);
    account2Total = Math.max(500, account2Calculated);
    account2MinApplied = account2Total > account2Calculated;
  }

  // A/c 10: Pension fund (8.33% EPS share)
  const account10Total = totalEpsShare;

  // A/c 21: EDLI contribution (0.50% of EDLI wages)
  // Confirmed Statutory Rule: Account 21 has no statutory minimum floor.
  // The historical ₹200 minimum applied to Account 22 (EDLI Admin Charges), which was waived in April 2017.
  let account21Total = 0;
  let account21Calculated = 0;
  if (edliEnabled && totalEdliWages > 0) {
    account21Calculated = Math.round(totalEdliWages * 0.005);
    account21Total = account21Calculated;
  }

  // A/c 22: EDLI Admin charges waived (₹0)
  const account22Total = 0 as const;

  const totalRemittance =
    account1Total + account2Total + account10Total + account21Total;

  return {
    account1: {
      accountNumber: "1",
      name: "Employees' Provident Fund (A/c 1)",
      eeShare: totalEeShare,
      erShare: totalErShare,
      total: account1Total,
    },
    account2: {
      accountNumber: "2",
      name: "EPF Administrative Charges (A/c 2 - 0.50%)",
      rate: "0.50%",
      calculatedAmount: account2Calculated,
      statutoryMinimum: 500,
      minimumApplied: account2MinApplied,
      total: account2Total,
    },
    account10: {
      accountNumber: "10",
      name: "Employees' Pension Scheme (A/c 10 - 8.33%)",
      rate: "8.33%",
      total: account10Total,
    },
    account21: {
      accountNumber: "21",
      name: "EDLI Contribution (A/c 21 - 0.50%)",
      rate: "0.50%",
      calculatedAmount: account21Calculated,
      total: account21Total,
    },
    account22: {
      accountNumber: "22",
      name: "EDLI Administrative Charges (A/c 22 - Waived)",
      rate: "0.00%",
      total: account22Total,
    },
    totalRemittance,
  };
}

// ── Convex Queries & Actions ──────────────────────────────────────────────────

export const previewEpfoEcrExport = query({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "processed") {
      return {
        success: false,
        isFinalized: false,
        runStatus: run.status,
        errors: [
          `Payroll run for period ${run.periodMonth} is currently in "${run.status}" state. EPFO ECR export requires a finalized and processed payroll run.`,
        ],
        summary: null,
        totalRecords: 0,
        fileContent: null,
        fileName: null,
        sampleRecords: [],
      };
    }

    const compliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const epfEnabled = compliance?.epfEnabled ?? false;
    const adminChargesEnabled = compliance?.adminChargesEnabled ?? true;
    const edliEnabled = compliance?.edliEnabled ?? true;
    const estCode = compliance?.epfEstablishmentCode;

    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_run", (q) => q.eq("payrollRunId", args.payrollRunId))
      .collect();

    if (items.length === 0) {
      return {
        success: false,
        isFinalized: true,
        runStatus: run.status,
        errors: ["No payroll records found for this run."],
        summary: null,
        totalRecords: 0,
        fileContent: null,
        fileName: null,
        sampleRecords: [],
      };
    }

    const errors: string[] = [];
    const validRows: EpfoEcrRowResult[] = [];

    for (const item of items) {
      const emp = await ctx.db.get(item.employeeId);
      if (!emp) continue;

      const employeeIdentifier = `${emp.firstName} ${emp.lastName} (${emp.email})`;

      // Check if employee opted out of EPF
      const empComp = await ctx.db
        .query("employeeCompliance")
        .withIndex("by_employee", (q) => q.eq("employeeId", item.employeeId))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      const isOptOut = empComp?.epfOptOut ?? false;

      // Extract PF deduction amount from item
      const pfDeduction =
        item.statutoryDeductions.find(
          (d) =>
            d.name.toLowerCase().includes("pf") ||
            d.name.toLowerCase().includes("provident"),
        )?.amount ?? 0;

      // Only include members who are contributing to EPF
      if (isOptOut || (!epfEnabled && pfDeduction === 0)) {
        continue;
      }

      // Validate UAN
      const uanCheck = validateUanForEcr(emp.uan, employeeIdentifier);
      if (!uanCheck.valid) {
        errors.push(uanCheck.error!);
        continue;
      }

      // Calculate wages according to statutory rules
      const earnedGross = Math.max(
        0,
        Math.round(item.grossSalary - (item.lopDeduction || 0)),
      );
      const voluntaryActualBasic = empComp?.epfOnActualBasic ?? false;
      const restrictToCeiling = compliance?.epfRestrictToCeiling ?? true;
      const wageCeiling = compliance?.epfWageCeiling ?? 15000;

      // When employee earned gross is zero (e.g. full-month unpaid leave / LOP),
      // all wages and contributions must be zero as per official EPFO return filing guidelines.
      let epfWages = 0;
      let epsWages = 0;
      let edliWages = 0;
      let eeShare = 0;
      let epsShare = 0;
      let erShare = 0;

      if (earnedGross > 0) {
        // Compute earned basic salary in proportion to earned gross
        const earnedBasic =
          item.grossSalary > 0
            ? Math.max(
                0,
                Math.round((item.basicSalary * earnedGross) / item.grossSalary),
              )
            : Math.min(item.basicSalary, earnedGross);

        const eligibleWage =
          voluntaryActualBasic || !restrictToCeiling
            ? earnedBasic
            : Math.min(earnedBasic, wageCeiling);

        epfWages = Math.min(earnedGross, Math.max(0, eligibleWage));
        epsWages = Math.min(epfWages, 15000);
        edliWages = Math.min(epfWages, 15000);

        const expectedEeShare = Math.round(epfWages * 0.12);
        // If the processed payroll item deduction matches expected 12% of epf wages, use it;
        // otherwise clamp to statutory 12% of epf wages to guarantee portal validity.
        eeShare =
          pfDeduction > 0 && Math.abs(pfDeduction - expectedEeShare) <= 1
            ? pfDeduction
            : expectedEeShare;

        const expectedEpsShare =
          epsWages >= 15000
            ? 1250
            : Math.min(1250, Math.round(epsWages * 0.0833));
        const epsShareItem = item.employerContributions.find(
          (c) =>
            c.name.toLowerCase().includes("eps") ||
            c.name.toLowerCase().includes("pension"),
        )?.amount;
        epsShare =
          epsShareItem !== undefined &&
          Math.abs(epsShareItem - expectedEpsShare) <= 1
            ? epsShareItem
            : expectedEpsShare;

        // Column 9 (EPF_EPS_DIFF_REMITTED) is statutorily defined as EE Share - EPS Share
        erShare = Math.max(0, eeShare - epsShare);
      }

      const ncpDays = Math.max(0, Math.min(31, Math.round(item.lopDays || 0)));

      const row = buildEcrRecord({
        uan: uanCheck.cleanUan!,
        memberName: `${emp.firstName} ${emp.lastName}`,
        grossWages: earnedGross,
        epfWages,
        epsWages,
        edliWages,
        eeShare,
        epsShare,
        erShare,
        ncpDays,
        refundOfAdvances: 0,
      });

      validRows.push(row);
    }

    if (validRows.length === 0 && errors.length === 0) {
      return {
        success: false,
        isFinalized: true,
        runStatus: run.status,
        errors: [
          "No active EPF contributing employees found in this payroll run. Check that EPF is enabled in Compliance and employees are not opted out.",
        ],
        summary: null,
        totalRecords: 0,
        fileContent: null,
        fileName: null,
        sampleRecords: [],
      };
    }

    // Totals accumulation
    const totalGrossWages = validRows.reduce((acc, r) => acc + r.grossWages, 0);
    const totalEpfWages = validRows.reduce((acc, r) => acc + r.epfWages, 0);
    const totalEpsWages = validRows.reduce((acc, r) => acc + r.epsWages, 0);
    const totalEdliWages = validRows.reduce((acc, r) => acc + r.edliWages, 0);
    const totalEeShare = validRows.reduce((acc, r) => acc + r.eeShare, 0);
    const totalEpsShare = validRows.reduce((acc, r) => acc + r.epsShare, 0);
    const totalErShare = validRows.reduce((acc, r) => acc + r.erShare, 0);
    const totalNcpDays = validRows.reduce((acc, r) => acc + r.ncpDays, 0);
    const totalRefundOfAdvances = validRows.reduce(
      (acc, r) => acc + r.refundOfAdvances,
      0,
    );

    const challanAccounts = calculateChallanAccounts(
      totalEpfWages,
      totalEdliWages,
      totalEeShare,
      totalEpsShare,
      totalErShare,
      adminChargesEnabled,
      edliEnabled,
    );

    const summary: EpfoEcrSummary = {
      periodMonth: run.periodMonth,
      establishmentCode: estCode,
      totalMembers: validRows.length,
      totalGrossWages,
      totalEpfWages,
      totalEpsWages,
      totalEdliWages,
      totalEeShare,
      totalEpsShare,
      totalErShare,
      totalNcpDays,
      totalRefundOfAdvances,
      challanAccounts,
    };

    const hasErrors = errors.length > 0;
    const fileContent = hasErrors
      ? null
      : validRows.map((r) => r.formattedLine).join("\n");

    const safeEstLabel = estCode ? estCode.replace(/[^A-Za-z0-9]/g, "") : "EST";
    const fileName = `EPFO_ECR_${run.periodMonth}_${safeEstLabel}.txt`;

    const sampleRecords = validRows.slice(0, 10).map((r) => ({
      uan: r.uan,
      memberName: r.memberName,
      grossWages: r.grossWages,
      epfWages: r.epfWages,
      epsWages: r.epsWages,
      edliWages: r.edliWages,
      eeShare: r.eeShare,
      epsShare: r.epsShare,
      erShare: r.erShare,
      ncpDays: r.ncpDays,
      refundOfAdvances: r.refundOfAdvances,
      formattedLine: r.formattedLine,
    }));

    return {
      success: !hasErrors,
      isFinalized: true,
      runStatus: run.status,
      errors,
      summary,
      totalRecords: validRows.length,
      fileContent,
      fileName,
      sampleRecords,
    };
  },
});

export const logEcrDownload = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
    totalMembers: v.number(),
    totalRemittance: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    await audit(ctx, args.workspaceId, userId, "epfo.ecr_download", {
      payrollRunId: args.payrollRunId,
      totalMembers: args.totalMembers,
      totalRemittance: args.totalRemittance,
    });
  },
});
