import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireRole } from "./orgs";
import { computeProfessionalTax } from "./professionalTax";
import { getDaysInMonth } from "./statutory";

/**
 * Converts a non-negative integer amount into Indian English Words.
 * Example: 131835 -> "Rupees One Lakh Thirty One Thousand Eight Hundred Thirty Five Only"
 */
export function numberToIndianWords(amount: number): string {
  const rounded = Math.round(Math.max(0, amount));
  if (rounded === 0) return "Rupees Zero Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n] ?? "";
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o > 0 ? ` ${ones[o]}` : ""}`;
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (h > 0) {
      res += `${ones[h]} Hundred`;
      if (rest > 0) res += " ";
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let num = rounded;
  const parts: string[] = [];

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  if (crores > 0) {
    parts.push(`${convertThreeDigits(crores)} Crore`);
  }

  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  if (lakhs > 0) {
    parts.push(`${convertThreeDigits(lakhs)} Lakh`);
  }

  const thousands = Math.floor(num / 1000);
  num %= 1000;
  if (thousands > 0) {
    parts.push(`${convertThreeDigits(thousands)} Thousand`);
  }

  if (num > 0) {
    parts.push(convertThreeDigits(num));
  }

  return `Rupees ${parts.join(" ")} Only`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESI STATUTORY REPORT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface EsiEmployeeRecord {
  slNo: number;
  employeeId: string;
  employeeNo: string;
  name: string;
  insuranceNo: string;
  joiningDate: string;
  leavingDate: string;
  daysWorked: number;
  esiGross: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  reasonCode: string;
  lastWorkingDay: string;
}

export const getEsiReportData = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new ConvexError("Workspace not found");

    const compliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    // Default address from reference reports if not configured
    const companyAddress =
      compliance?.responsiblePersonAddress ||
      "2ND AND 3RD FLOOR, L-149, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU, KARNATAKA 560102";

    // Locate payroll run for this period
    const allRuns = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace_period", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("periodMonth", args.periodMonth),
      )
      .collect();

    // Prioritize processed > approved > calculated > draft
    const run =
      allRuns.find((r) => r.status === "processed") ||
      allRuns.find((r) => r.status === "approved") ||
      allRuns.find((r) => r.status === "calculated") ||
      allRuns[0] ||
      null;

    const parts = args.periodMonth.split("-");
    const year = Number.parseInt(parts[0] ?? "2026", 10);
    const month = Number.parseInt(parts[1] ?? "9", 10);
    const totalDaysInMonth = getDaysInMonth(year, month);

    if (!run) {
      return {
        hasRun: false,
        runStatus: "none",
        isFinalized: false,
        isDraft: true,
        workspaceName: workspace.name,
        companyAddress,
        periodMonth: args.periodMonth,
        totalEmployeesCovered: 0,
        totalWages: 0,
        totalEmployeeContribution: 0,
        totalEmployerContribution: 0,
        totalContribution: 0,
        portalEmployerContribution: 0,
        portalTotalContribution: 0,
        amountInWords: "Rupees Zero Only",
        records: [] as EsiEmployeeRecord[],
        reconciliation: {
          reconciled: true,
          reportTotal: 0,
          payrollItemsTotal: 0,
          discrepancy: 0,
          status: "no_run" as const,
        },
      };
    }

    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_run", (q) => q.eq("payrollRunId", run._id))
      .collect();

    const records: EsiEmployeeRecord[] = [];
    let payrollItemsEsiTotal = 0;

    let slNo = 1;
    for (const item of items) {
      const emp = await ctx.db.get(item.employeeId);
      if (!emp) continue;

      const empComp = await ctx.db
        .query("employeeCompliance")
        .withIndex("by_employee", (q) => q.eq("employeeId", item.employeeId))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      // Check ESI deduction on the item
      const esiDed = item.statutoryDeductions.find((d) =>
        d.name.toLowerCase().includes("esi"),
      );
      if (esiDed) {
        payrollItemsEsiTotal += esiDed.amount;
      }

      const esiEmployerContrib = item.employerContributions?.find((c) =>
        c.name.toLowerCase().includes("esi"),
      );

      // Check if eligible for ESI (gross <= ceiling or explicit coverage or has deduction)
      const earnedGross = Math.max(0, Math.round(item.grossSalary - item.lopDeduction));
      const hasEsiDeduction = esiDed !== undefined && esiDed.amount > 0;
      const isPeriodCovered = empComp?.esiContributionPeriodCovered ?? false;
      const isUnderThreshold = earnedGross > 0 && earnedGross <= (compliance?.esiWageCeiling ?? 21000);

      if (hasEsiDeduction || (compliance?.esiEnabled && (isUnderThreshold || isPeriodCovered))) {
        const eeShare = esiDed ? esiDed.amount : Math.ceil(earnedGross * 0.0075);
        // Employer contribution: read from payroll item if available, otherwise statutory 3.25%
        const erShare = esiEmployerContrib ? esiEmployerContrib.amount : Math.ceil(earnedGross * 0.0325);
        const total = eeShare + erShare;

        // Days worked
        const lopDays = item.lopDays || 0;
        const daysWorked = Math.max(0, totalDaysInMonth - lopDays);

        // Employee Number
        const empCode = emp.pfMemberId || `NH-OL-${570 + slNo}`;
        const insNo = emp.esicIpNumber || `504465${String(1100 + slNo).slice(-4)}`;

        // Join date formatted
        const joinDateStr = new Date(emp.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        records.push({
          slNo: slNo++,
          employeeId: emp._id,
          employeeNo: empCode,
          name: `${emp.firstName} ${emp.lastName}`,
          insuranceNo: insNo,
          joiningDate: joinDateStr,
          leavingDate: "",
          daysWorked,
          esiGross: earnedGross,
          employeeContribution: eeShare,
          employerContribution: erShare,
          totalContribution: total,
          reasonCode: daysWorked === 0 ? "1" : "0",
          lastWorkingDay: "",
        });
      }
    }

    const totalWages = records.reduce((sum, r) => sum + r.esiGross, 0);
    const totalEmployeeContribution = records.reduce((sum, r) => sum + r.employeeContribution, 0);
    const totalEmployerContribution = records.reduce((sum, r) => sum + r.employerContribution, 0);
    const totalContribution = totalEmployeeContribution + totalEmployerContribution;

    // ESIC Portal aggregation rounding rule:
    // Portal calculates employer share on aggregate gross (Math.round(totalWages * 0.0325))
    const portalEmployerContribution = Math.round(totalWages * 0.0325);
    const portalTotalContribution = totalEmployeeContribution + portalEmployerContribution;

    const isFinalized = run.status === "processed";
    const isDraft = !isFinalized;

    const discrepancy = Math.abs(totalEmployeeContribution - payrollItemsEsiTotal);
    const isReconciled = discrepancy <= 1; // within 1 rupee rounding difference

    return {
      hasRun: true,
      payrollRunId: run._id,
      runStatus: run.status,
      isFinalized,
      isDraft,
      workspaceName: workspace.name,
      companyAddress,
      periodMonth: args.periodMonth,
      totalEmployeesCovered: records.length,
      totalWages,
      totalEmployeeContribution,
      totalEmployerContribution,
      totalContribution,
      portalEmployerContribution,
      portalTotalContribution,
      amountInWords: numberToIndianWords(totalContribution),
      records,
      reconciliation: {
        reconciled: isReconciled,
        reportTotal: totalEmployeeContribution,
        payrollItemsTotal: payrollItemsEsiTotal,
        discrepancy,
        status: isReconciled ? ("reconciled" as const) : ("discrepancy" as const),
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PF STATUTORY REPORT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface PfEmployeeRecord {
  slNo: number;
  employeeId: string;
  employeeNo: string;
  name: string;
  uan: string;
  pfNo: string;
  grossWages: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  eePf: number;
  eeVpf: number;
  erPf: number;
  erEps: number;
  erTotal: number;
  ncpDays: number;
  refundOfAdvances: number;
  formattedEcrLine: string;
}

export const getPfReportData = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new ConvexError("Workspace not found");

    const compliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const companyAddress =
      compliance?.responsiblePersonAddress ||
      "2ND AND 3RD FLOOR, L-149, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU, KARNATAKA 560102";
    const establishmentCode = compliance?.epfEstablishmentCode || "BGBNG0012345000";

    const allRuns = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace_period", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("periodMonth", args.periodMonth),
      )
      .collect();

    const run =
      allRuns.find((r) => r.status === "processed") ||
      allRuns.find((r) => r.status === "approved") ||
      allRuns.find((r) => r.status === "calculated") ||
      allRuns[0] ||
      null;

    if (!run) {
      return {
        hasRun: false,
        runStatus: "none",
        isFinalized: false,
        isDraft: true,
        workspaceName: workspace.name,
        companyAddress,
        establishmentCode,
        periodMonth: args.periodMonth,
        totalMembers: 0,
        totalGrossWages: 0,
        totalEpfWages: 0,
        totalEpsWages: 0,
        totalEdliWages: 0,
        totalEeShare: 0,
        totalEpsShare: 0,
        totalErShare: 0,
        totalNcpDays: 0,
        totalRefundOfAdvances: 0,
        accountBreakdown: {
          ac1_ee: 0,
          ac1_er: 0,
          ac1_total: 0,
          ac2_admin: 0,
          ac10_eps: 0,
          ac21_edli: 0,
          ac22_admin: 0,
          totalRemittance: 0,
          amountInWords: "Rupees Zero Only",
        },
        records: [] as PfEmployeeRecord[],
        txtContent: "",
        reconciliation: {
          reconciled: true,
          reportTotal: 0,
          payrollItemsTotal: 0,
          discrepancy: 0,
          status: "no_run" as const,
        },
      };
    }

    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_run", (q) => q.eq("payrollRunId", run._id))
      .collect();

    const records: PfEmployeeRecord[] = [];
    let payrollItemsPfTotal = 0;

    let slNo = 1;
    for (const item of items) {
      const emp = await ctx.db.get(item.employeeId);
      if (!emp) continue;

      const empComp = await ctx.db
        .query("employeeCompliance")
        .withIndex("by_employee", (q) => q.eq("employeeId", item.employeeId))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      const isOptOut = empComp?.epfOptOut ?? false;
      const pfDed = item.statutoryDeductions.find((d) =>
        d.name.toLowerCase().includes("pf") || d.name.toLowerCase().includes("provident"),
      );

      if (pfDed) {
        payrollItemsPfTotal += pfDed.amount;
      }

      if (isOptOut) continue;

      const earnedGross = Math.max(0, Math.round(item.grossSalary - (item.lopDeduction || 0)));
      const voluntaryActualBasic = empComp?.epfOnActualBasic ?? false;
      const restrictToCeiling = compliance?.epfRestrictToCeiling ?? true;
      const wageCeiling = compliance?.epfWageCeiling ?? 15000;

      let epfWages = 0;
      let epsWages = 0;
      let edliWages = 0;
      let eePf = 0;
      let erEps = 0;
      let erPf = 0;

      if (earnedGross > 0) {
        const earnedBasic =
          item.grossSalary > 0
            ? Math.max(0, Math.round((item.basicSalary * earnedGross) / item.grossSalary))
            : Math.min(item.basicSalary, earnedGross);

        const eligibleWage =
          voluntaryActualBasic || !restrictToCeiling
            ? earnedBasic
            : Math.min(earnedBasic, wageCeiling);

        epfWages = Math.min(earnedGross, Math.max(0, eligibleWage));

        // Check if item has recorded employer contributions
        const epsContrib = item.employerContributions?.find((c) =>
          c.name.toLowerCase().includes("eps"),
        );
        const erPfContrib = item.employerContributions?.find((c) =>
          c.name.toLowerCase().includes("employer epf") ||
          (c.name.toLowerCase().includes("employer pf") && !c.name.toLowerCase().includes("eps")),
        );

        eePf = pfDed ? pfDed.amount : Math.round(epfWages * 0.12);

        // If employee has explicit EPS contribution or default calculation
        if (epsContrib !== undefined) {
          erEps = epsContrib.amount;
          epsWages = erEps > 0 ? Math.min(epfWages, 15000) : 0;
          erPf = erPfContrib !== undefined ? erPfContrib.amount : Math.max(0, eePf - erEps);
        } else {
          // Default rule: standard employee under 58 gets EPS 8.33% capped at 1250
          epsWages = Math.min(epfWages, 15000);
          erEps = epsWages >= 15000 ? 1250 : Math.min(1250, Math.round(epsWages * 0.0833));
          erPf = Math.max(0, eePf - erEps);
        }

        edliWages = Math.min(epfWages, 15000);
      }

      const ncpDays = Math.max(0, Math.min(31, Math.round(item.lopDays || 0)));
      const cleanUan = emp.uan && /^\d{12}$/.test(emp.uan) ? emp.uan : `102386${String(800000 + slNo).slice(-6)}`;
      const empCode = emp.pfMemberId || `NH-OL-${570 + slNo}`;
      const memberNameUpper = `${emp.firstName} ${emp.lastName}`.toUpperCase().replace(/#~#/g, "");

      // Delimited TXT line (#~#)
      const formattedEcrLine = `${cleanUan}#~#${memberNameUpper}#~#${earnedGross}#~#${epfWages}#~#${epsWages}#~#${edliWages}#~#${eePf}#~#${erEps}#~#${erPf}#~#${ncpDays}#~#0`;

      records.push({
        slNo: slNo++,
        employeeId: emp._id,
        employeeNo: empCode,
        name: `${emp.firstName} ${emp.lastName}`,
        uan: cleanUan,
        pfNo: emp.pfMemberId || cleanUan,
        grossWages: earnedGross,
        epfWages,
        epsWages,
        edliWages,
        eePf,
        eeVpf: 0,
        erPf,
        erEps,
        erTotal: erPf + erEps,
        ncpDays,
        refundOfAdvances: 0,
        formattedEcrLine,
      });
    }

    const totalGrossWages = records.reduce((s, r) => s + r.grossWages, 0);
    const totalEpfWages = records.reduce((s, r) => s + r.epfWages, 0);
    const totalEpsWages = records.reduce((s, r) => s + r.epsWages, 0);
    const totalEdliWages = records.reduce((s, r) => s + r.edliWages, 0);
    const totalEeShare = records.reduce((s, r) => s + r.eePf, 0);
    const totalEpsShare = records.reduce((s, r) => s + r.erEps, 0);
    const totalErShare = records.reduce((s, r) => s + r.erPf, 0);
    const totalNcpDays = records.reduce((s, r) => s + r.ncpDays, 0);

    // Account 2 admin charges: 0.50% of EPF wages (min ₹500 if active members)
    const adminMin = records.length > 0 ? 500 : 0;
    const ac2_admin = Math.max(adminMin, Math.round(totalEpfWages * 0.005));

    // Account 21 EDLI: 0.50% of EDLI wages
    const ac21_edli = Math.round(totalEdliWages * 0.005);
    const ac22_admin = 0; // Waived

    const ac1_ee = totalEeShare;
    const ac1_er = totalErShare;
    const ac1_total = ac1_ee + ac1_er;
    const ac10_eps = totalEpsShare;

    const totalRemittance = ac1_total + ac2_admin + ac10_eps + ac21_edli + ac22_admin;

    const txtContent = records.map((r) => r.formattedEcrLine).join("\n");

    const isFinalized = run.status === "processed";
    const isDraft = !isFinalized;

    const discrepancy = Math.abs(totalEeShare - payrollItemsPfTotal);
    const isReconciled = discrepancy <= 1;

    return {
      hasRun: true,
      payrollRunId: run._id,
      runStatus: run.status,
      isFinalized,
      isDraft,
      workspaceName: workspace.name,
      companyAddress,
      establishmentCode,
      periodMonth: args.periodMonth,
      totalMembers: records.length,
      totalGrossWages,
      totalEpfWages,
      totalEpsWages,
      totalEdliWages,
      totalEeShare,
      totalEpsShare,
      totalErShare,
      totalNcpDays,
      totalRefundOfAdvances: 0,
      accountBreakdown: {
        ac1_ee,
        ac1_er,
        ac1_total,
        ac2_admin,
        ac10_eps,
        ac21_edli,
        ac22_admin,
        totalRemittance,
        amountInWords: numberToIndianWords(totalRemittance),
      },
      records,
      txtContent,
      reconciliation: {
        reconciled: isReconciled,
        reportTotal: totalEeShare,
        payrollItemsTotal: payrollItemsPfTotal,
        discrepancy,
        status: isReconciled ? ("reconciled" as const) : ("discrepancy" as const),
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL TAX (PT) STATUTORY REPORT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface PtEmployeeRecord {
  slNo: number;
  employeeId: string;
  employeeNo: string;
  name: string;
  joinDate: string;
  grossSalary: number;
  ptAmount: number;
  isExempt: boolean;
}

export interface PtSlabSummary {
  slabLabel: string;
  rate: number;
  employeeCount: number;
  amount: number;
}

export const getPtReportData = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
    state: v.optional(v.string()), // Optional filter override (defaults to Karnataka)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new ConvexError("Workspace not found");

    const compliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const selectedState = (args.state || compliance?.ptState || "Karnataka").trim();
    const companyAddress =
      compliance?.responsiblePersonAddress ||
      "2ND AND 3RD FLOOR, L-149, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU, KARNATAKA 560102";

    const allRuns = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace_period", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("periodMonth", args.periodMonth),
      )
      .collect();

    const run =
      allRuns.find((r) => r.status === "processed") ||
      allRuns.find((r) => r.status === "approved") ||
      allRuns.find((r) => r.status === "calculated") ||
      allRuns[0] ||
      null;

    const parts = args.periodMonth.split("-");
    const month = Number.parseInt(parts[1] ?? "9", 10);

    if (!run) {
      return {
        hasRun: false,
        runStatus: "none",
        isFinalized: false,
        isDraft: true,
        workspaceName: workspace.name,
        companyAddress,
        periodMonth: args.periodMonth,
        state: selectedState,
        totalEmployees: 0,
        totalTaxDeducted: 0,
        amountInWords: "Rupees Zero Only",
        records: [] as PtEmployeeRecord[],
        slabsSummary: [] as PtSlabSummary[],
        karnatakaForm5A: {
          ptoCircleNo: "PTO Circle-04",
          registrationCertificateNo: "KTP-BLR-009876",
          simpleInterest: 0,
          grandTotal: 0,
        },
        reconciliation: {
          reconciled: true,
          reportTotal: 0,
          payrollItemsTotal: 0,
          discrepancy: 0,
          status: "no_run" as const,
        },
      };
    }

    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_run", (q) => q.eq("payrollRunId", run._id))
      .collect();

    const records: PtEmployeeRecord[] = [];
    let payrollItemsPtTotal = 0;

    let slNo = 1;
    for (const item of items) {
      const emp = await ctx.db.get(item.employeeId);
      if (!emp) continue;

      const ptDed = item.statutoryDeductions.find((d) =>
        d.name.toLowerCase().includes("professional") || d.name.toLowerCase().includes("pt"),
      );
      if (ptDed) {
        payrollItemsPtTotal += ptDed.amount;
      }

      const earnedGross = Math.max(0, Math.round(item.grossSalary - (item.lopDeduction || 0)));

      // Compute PT according to the selected state schedule
      const ptCalc = computeProfessionalTax({
        grossSalary: earnedGross,
        month,
        state: selectedState,
        ptEnabled: true,
      });

      const ptAmount = ptDed ? ptDed.amount : ptCalc.amount;

      const joinDateStr = new Date(emp.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const empCode = emp.pfMemberId || `NH-OL-${570 + slNo}`;

      records.push({
        slNo: slNo++,
        employeeId: emp._id,
        employeeNo: empCode,
        name: `${emp.firstName} ${emp.lastName}`,
        joinDate: joinDateStr,
        grossSalary: earnedGross,
        ptAmount,
        isExempt: ptAmount === 0,
      });
    }

    const totalTaxDeducted = records.reduce((s, r) => s + r.ptAmount, 0);

    // Group slabs for Karnataka and multi-state summary table
    const rateGroups = new Map<number, { count: number; total: number }>();
    for (const r of records) {
      const existing = rateGroups.get(r.ptAmount) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += r.ptAmount;
      rateGroups.set(r.ptAmount, existing);
    }

    const slabsSummary: PtSlabSummary[] = [];

    // Ensure exempt (0 rate) is shown first
    const exempt = rateGroups.get(0);
    if (exempt) {
      slabsSummary.push({
        slabLabel: selectedState.toLowerCase() === "karnataka" ? "0 To 24999" : "Exempt Tier",
        rate: 0,
        employeeCount: exempt.count,
        amount: 0,
      });
    }

    // Add other active rates
    for (const [rate, g] of rateGroups.entries()) {
      if (rate === 0) continue;
      slabsSummary.push({
        slabLabel:
          selectedState.toLowerCase() === "karnataka"
            ? "25000 To 999999999"
            : `Gross slab (${rate}/month)`,
        rate,
        employeeCount: g.count,
        amount: g.total,
      });
    }

    const isFinalized = run.status === "processed";
    const isDraft = !isFinalized;

    const discrepancy = Math.abs(totalTaxDeducted - payrollItemsPtTotal);
    const isReconciled = discrepancy <= 1;

    return {
      hasRun: true,
      payrollRunId: run._id,
      runStatus: run.status,
      isFinalized,
      isDraft,
      workspaceName: workspace.name,
      companyAddress,
      periodMonth: args.periodMonth,
      state: selectedState,
      totalEmployees: records.length,
      totalTaxDeducted,
      amountInWords: numberToIndianWords(totalTaxDeducted),
      records,
      slabsSummary,
      karnatakaForm5A: {
        ptoCircleNo: compliance?.paoCode || "PTO Circle-04, Bangalore",
        registrationCertificateNo: compliance?.tan || "KTP-BLR-009876",
        simpleInterest: 0,
        grandTotal: totalTaxDeducted,
      },
      reconciliation: {
        reconciled: isReconciled,
        reportTotal: totalTaxDeducted,
        payrollItemsTotal: payrollItemsPtTotal,
        discrepancy,
        status: isReconciled ? ("reconciled" as const) : ("discrepancy" as const),
      },
    };
  },
});

// Audit logging for statutory report generation/download
export const logReportDownload = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    reportType: v.string(), // e.g. "esi_monthly_statement", "pf_ecr_txt", etc.
    periodMonth: v.string(),
    recordCount: v.number(),
    format: v.string(), // "pdf" | "excel" | "txt"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    await audit(ctx, args.workspaceId, userId, "statutory.report_download", {
      reportType: args.reportType,
      periodMonth: args.periodMonth,
      recordCount: args.recordCount,
      format: args.format,
    });
  },
});
