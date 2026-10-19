import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireRole } from "./orgs";
import { calculateAnnualTds } from "./statutoryTds";

/**
 * Quarterly Salary-TDS Reporting & Reconciliation Engine.
 *
 * Applicable Filing Specifications:
 * 1. Form No. 138 (FY 2026–27 onwards):
 *    - Governing Law: Section 397(3)(b) of the Income-tax Act, 2025 read with Rule 219, Income-tax Rules, 2026.
 *    - Nature of Payment / Section Code: "1002" (TDS on Salary under Section 392).
 *    - Modernized streamlined record structure processed by Protean/Income Tax Department FVU.
 *
 * 2. Form No. 24Q (FY 2025–26 and earlier):
 *    - Governing Law: Section 200(3) of the Income-tax Act, 1961 read with Rule 31A, Income-tax Rules, 1962.
 *    - Nature of Payment / Section Code: "92B" (TDS on Salary under Section 192).
 *
 * Structural Record Hierarchy (ASCII caret-delimited "^"):
 * - FH: File Header (File metadata, software identifier, deductor TAN)
 * - BH: Batch Header (Quarter, Financial Year, Assessment Year, Employer TAN/PAN, Responsible Person)
 * - CD: Challan Detail (ITNS 281 BSR code, deposit date, serial number, minor head 200, tax breakdown)
 * - DD: Deductee Detail - Annexure I (Quarterly employee PAN, payment date, gross wages, TDS deducted)
 * - SD: Salary Detail - Annexure II (Mandatory for Q4 ONLY - Annual salary, exemptions, Section 16, Chapter VI-A)
 */

export const TDS_DELIMITER = "^";

export type TdsQuarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface QuarterMonths {
  quarter: TdsQuarter;
  months: string[]; // e.g. ["2026-04", "2026-05", "2026-06"]
  quarterLabel: string;
}

export function getQuarterMonths(
  financialYear: string,
  quarter: TdsQuarter,
): QuarterMonths {
  const [startYearStr, endYearShort] = financialYear.split("-");
  const startYear = Number.parseInt(startYearStr ?? "2026", 10);
  const endYear = startYear + 1;

  switch (quarter) {
    case "Q1":
      return {
        quarter: "Q1",
        months: [`${startYear}-04`, `${startYear}-05`, `${startYear}-06`],
        quarterLabel: `Q1 (April - June ${startYear})`,
      };
    case "Q2":
      return {
        quarter: "Q2",
        months: [`${startYear}-07`, `${startYear}-08`, `${startYear}-09`],
        quarterLabel: `Q2 (July - September ${startYear})`,
      };
    case "Q3":
      return {
        quarter: "Q3",
        months: [`${startYear}-10`, `${startYear}-11`, `${startYear}-12`],
        quarterLabel: `Q3 (October - December ${startYear})`,
      };
    case "Q4":
      return {
        quarter: "Q4",
        months: [`${endYear}-01`, `${endYear}-02`, `${endYear}-03`],
        quarterLabel: `Q4 (January - March ${endYear})`,
      };
  }
}

export function getAssessmentYear(financialYear: string): string {
  const parts = financialYear.split("-");
  const start = Number.parseInt(parts[0] ?? "2026", 10);
  const ayStart = start + 1;
  const ayEndShort = String((ayStart + 1) % 100).padStart(2, "0");
  return `${ayStart}-${ayEndShort}`;
}

export function isForm138Applicable(financialYear: string): boolean {
  const startYear = Number.parseInt(financialYear.split("-")[0] ?? "2026", 10);
  return startYear >= 2026;
}

export function validateTan(tan: string | undefined | null): {
  valid: boolean;
  cleanTan?: string;
  error?: string;
} {
  if (!tan || !tan.trim()) {
    return {
      valid: false,
      error:
        "Employer TAN is required for TDS filing. Please configure TAN in Compliance Settings.",
    };
  }
  const clean = tan.trim().toUpperCase();
  if (!/^[A-Z]{4}\d{5}[A-Z]$/.test(clean)) {
    return {
      valid: false,
      error: `Invalid TAN "${clean}". TAN must be 10 alphanumeric characters (4 letters, 5 digits, 1 letter, e.g. BLRK12345A).`,
    };
  }
  return { valid: true, cleanTan: clean };
}

export function validatePan(
  pan: string | undefined | null,
  identifier: string,
): { valid: boolean; cleanPan?: string; isMissing?: boolean; error?: string } {
  if (!pan || !pan.trim()) {
    return {
      valid: false,
      isMissing: true,
      error: `Employee "${identifier}" is missing a PAN. A valid PAN or "PANNOTAVBL" is required for TDS filing.`,
    };
  }
  const clean = pan.trim().toUpperCase();
  if (
    clean === "PANNOTAVBL" ||
    clean === "PANAPPLIED" ||
    clean === "PANINVALID"
  ) {
    return { valid: true, cleanPan: clean };
  }
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(clean)) {
    return {
      valid: false,
      isMissing: false,
      error: `Employee "${identifier}" has invalid PAN "${clean}". PAN must be 10 alphanumeric characters (e.g. ABCDE1234F).`,
    };
  }
  return { valid: true, cleanPan: clean };
}

export function formatTwoDecimals(num: number): string {
  return Math.max(0, num).toFixed(2);
}

export function formatDateDDMMYYYY(dateStr: string): string {
  // Accepts YYYY-MM-DD or returns current date formatted
  if (!dateStr || !dateStr.includes("-")) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}${m}${d.getFullYear()}`;
  }
  const [y, m, d] = dateStr.split("-");
  return `${d?.padStart(2, "0")}${m?.padStart(2, "0")}${y}`;
}

// ── Convex Queries & Mutations ────────────────────────────────────────────────

export const listTdsChallans = query({
  args: {
    workspaceId: v.id("workspaces"),
    financialYear: v.string(),
    quarter: v.union(
      v.literal("Q1"),
      v.literal("Q2"),
      v.literal("Q3"),
      v.literal("Q4"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    return await ctx.db
      .query("tdsChallans")
      .withIndex("by_workspace_quarter", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("financialYear", args.financialYear)
          .eq("quarter", args.quarter),
      )
      .collect();
  },
});

export const saveTdsChallan = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    challanId: v.optional(v.id("tdsChallans")),
    financialYear: v.string(), // "2026-27"
    quarter: v.union(
      v.literal("Q1"),
      v.literal("Q2"),
      v.literal("Q3"),
      v.literal("Q4"),
    ),
    bsrCode: v.string(), // 7 numeric digits
    depositDate: v.string(), // YYYY-MM-DD
    challanSerialNumber: v.string(), // 5 numeric digits
    minorHead: v.union(v.literal("200"), v.literal("400")),
    taxAmount: v.number(),
    surcharge: v.optional(v.number()),
    cess: v.optional(v.number()),
    interest: v.optional(v.number()),
    fee: v.optional(v.number()),
    penalty: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const cleanBsr = args.bsrCode.trim();
    if (!/^\d{7}$/.test(cleanBsr)) {
      throw new ConvexError(
        "BSR Code must be exactly 7 numeric digits (e.g. 0210001)",
      );
    }

    const cleanSerial = args.challanSerialNumber.trim();
    if (!/^\d{5}$/.test(cleanSerial)) {
      throw new ConvexError(
        "Challan Serial Number must be exactly 5 numeric digits (e.g. 00123)",
      );
    }

    if (args.taxAmount < 0) {
      throw new ConvexError("TDS tax amount cannot be negative");
    }

    const surcharge = Math.max(0, args.surcharge ?? 0);
    const cess = Math.max(0, args.cess ?? 0);
    const interest = Math.max(0, args.interest ?? 0);
    const fee = Math.max(0, args.fee ?? 0);
    const penalty = Math.max(0, args.penalty ?? 0);
    const totalAmount =
      args.taxAmount + surcharge + cess + interest + fee + penalty;

    const now = Date.now();
    const docData = {
      workspaceId: args.workspaceId,
      financialYear: args.financialYear,
      quarter: args.quarter,
      bsrCode: cleanBsr,
      depositDate: args.depositDate,
      challanSerialNumber: cleanSerial,
      minorHead: args.minorHead,
      taxAmount: args.taxAmount,
      surcharge,
      cess,
      interest,
      fee,
      penalty,
      totalAmount,
      remarks: args.remarks?.trim() || undefined,
      updatedAt: now,
    };

    if (args.challanId) {
      const existing = await ctx.db.get(args.challanId);
      if (!existing || existing.workspaceId !== args.workspaceId) {
        throw new ConvexError("Challan record not found");
      }
      await ctx.db.patch(args.challanId, docData);
      await audit(ctx, args.workspaceId, userId, "tds.update_challan", {
        challanId: args.challanId,
        quarter: args.quarter,
        totalAmount,
      });
      return args.challanId;
    }

    const newId = await ctx.db.insert("tdsChallans", {
      ...docData,
      createdAt: now,
    });
    await audit(ctx, args.workspaceId, userId, "tds.create_challan", {
      challanId: newId,
      quarter: args.quarter,
      totalAmount,
    });
    return newId;
  },
});

export const deleteTdsChallan = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    challanId: v.id("tdsChallans"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const existing = await ctx.db.get(args.challanId);
    if (!existing || existing.workspaceId !== args.workspaceId) {
      throw new ConvexError("Challan record not found");
    }

    await ctx.db.delete(args.challanId);
    await audit(ctx, args.workspaceId, userId, "tds.delete_challan", {
      challanId: args.challanId,
    });
  },
});

export const previewQuarterlyTds = query({
  args: {
    workspaceId: v.id("workspaces"),
    financialYear: v.string(), // "2026-27" or "2025-26"
    quarter: v.union(
      v.literal("Q1"),
      v.literal("Q2"),
      v.literal("Q3"),
      v.literal("Q4"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new ConvexError("Workspace not found");

    const compliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const isForm138 = isForm138Applicable(args.financialYear);
    const formName = isForm138 ? "Form 138" : "Form 24Q";
    const governingAct = isForm138
      ? "Income-tax Act, 2025 (Section 397(3)(b) & Section 392, Rule 219)"
      : "Income-tax Act, 1961 (Section 200(3) & Section 192, Rule 31A)";
    const sectionCode = isForm138 ? "1002" : "92B";

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Deductor TAN and PAN
    const tanCheck = validateTan(compliance?.tan);
    if (!tanCheck.valid) {
      errors.push(tanCheck.error!);
    }
    const cleanTan = tanCheck.cleanTan ?? "TANNOTSET1";

    const cleanEmployerPan =
      compliance?.employerPan?.trim().toUpperCase() ?? "";
    if (!cleanEmployerPan) {
      warnings.push(
        "Employer PAN is missing in Compliance settings. This is required for official portal filing.",
      );
    } else if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanEmployerPan)) {
      errors.push(
        `Invalid Employer PAN "${cleanEmployerPan}" in Compliance settings.`,
      );
    }

    const { months, quarterLabel } = getQuarterMonths(
      args.financialYear,
      args.quarter,
    );
    const assessmentYear = getAssessmentYear(args.financialYear);

    // 2. Query processed payroll runs for the quarter
    const allRuns = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const quarterRuns = allRuns.filter(
      (r) => months.includes(r.periodMonth) && r.status === "processed",
    );

    const missingMonths = months.filter(
      (m) =>
        !allRuns.some((r) => r.periodMonth === m && r.status === "processed"),
    );

    if (missingMonths.length > 0) {
      warnings.push(
        `Quarter ${args.quarter} has incomplete processed payroll runs. Missing or unprocessed months: ${missingMonths.join(", ")}.`,
      );
    }

    // 3. Collect deductee items across the quarter
    interface MonthlyDeducteeRecord {
      employeeId: Id<"employees">;
      employeeName: string;
      pan: string;
      isPanMissing: boolean;
      certificateNumber197?: string;
      periodMonth: string;
      paymentDate: string;
      grossSalary: number;
      tdsDeducted: number;
      regime: "new" | "old";
    }

    const monthlyDeductees: MonthlyDeducteeRecord[] = [];
    const employeeMap = new Map<string, Doc<"employees">>();
    const employeeQuarterTotalTds = new Map<string, number>();
    const employeeQuarterGross = new Map<string, number>();

    for (const run of quarterRuns) {
      const items = await ctx.db
        .query("payrollItems")
        .withIndex("by_run", (q) => q.eq("payrollRunId", run._id))
        .collect();

      for (const item of items) {
        let emp = employeeMap.get(item.employeeId);
        if (!emp) {
          const fetched = await ctx.db.get(item.employeeId);
          if (fetched) {
            employeeMap.set(item.employeeId, fetched);
            emp = fetched;
          }
        }
        if (!emp) continue;

        const employeeIdent = `${emp.firstName} ${emp.lastName} (${emp.email})`;
        const panCheck = validatePan(emp.pan, employeeIdent);
        if (!panCheck.valid && !panCheck.isMissing) {
          errors.push(panCheck.error!);
        } else if (panCheck.isMissing) {
          warnings.push(
            `Employee "${employeeIdent}" has no PAN. Will be reported as "PANNOTAVBL" with 20% statutory TDS rate under Section 206AA.`,
          );
        }

        const tdsAmount =
          item.statutoryDeductions.find(
            (d) =>
              d.name.toLowerCase().includes("tds") ||
              d.name.toLowerCase().includes("tax deducted"),
          )?.amount ?? 0;

        // Fetch compliance profile for tax regime
        const empComp = await ctx.db
          .query("employeeCompliance")
          .withIndex("by_employee", (q) => q.eq("employeeId", item.employeeId))
          .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
          .first();

        const regime = empComp?.taxRegime ?? "new";

        // Payment date is the end of the month or 7th of following month
        const [year, month] = run.periodMonth.split("-");
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const paymentDate = `${run.periodMonth}-${String(lastDay).padStart(2, "0")}`;

        monthlyDeductees.push({
          employeeId: emp._id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          pan: panCheck.cleanPan ?? "PANNOTAVBL",
          isPanMissing: panCheck.isMissing ?? false,
          certificateNumber197:
            empComp?.section197CertificateNumber?.trim().toUpperCase() ||
            undefined,
          periodMonth: run.periodMonth,
          paymentDate,
          grossSalary: item.grossSalary,
          tdsDeducted: tdsAmount,
          regime,
        });

        const currentTds = employeeQuarterTotalTds.get(emp._id) ?? 0;
        employeeQuarterTotalTds.set(emp._id, currentTds + tdsAmount);

        const currentGross = employeeQuarterGross.get(emp._id) ?? 0;
        employeeQuarterGross.set(emp._id, currentGross + item.grossSalary);
      }
    }

    // 4. Query quarterly ITNS 281 tax challans
    const challans = await ctx.db
      .query("tdsChallans")
      .withIndex("by_workspace_quarter", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("financialYear", args.financialYear)
          .eq("quarter", args.quarter),
      )
      .collect();

    const totalTdsDeducted = monthlyDeductees.reduce(
      (sum, d) => sum + d.tdsDeducted,
      0,
    );
    const totalGrossSalary = monthlyDeductees.reduce(
      (sum, d) => sum + d.grossSalary,
      0,
    );
    const totalChallanTaxDeposited = challans.reduce(
      (sum, c) => sum + c.taxAmount,
      0,
    );
    const totalChallanRemittance = challans.reduce(
      (sum, c) => sum + c.totalAmount,
      0,
    );

    // Challan reconciliation checks
    if (challans.length === 0 && totalTdsDeducted > 0) {
      warnings.push(
        `Total TDS deducted in ${args.quarter} is ₹${totalTdsDeducted.toLocaleString("en-IN")}, but no ITNS 281 deposit challans have been added. Add challans in the Challans tab to reconcile before official filing.`,
      );
    } else if (totalChallanTaxDeposited < totalTdsDeducted) {
      const shortfall = totalTdsDeducted - totalChallanTaxDeposited;
      warnings.push(
        `Challan underpayment detected: Total challan tax deposited (₹${totalChallanTaxDeposited.toLocaleString("en-IN")}) is less than total TDS deducted (₹${totalTdsDeducted.toLocaleString("en-IN")}) by ₹${shortfall.toLocaleString("en-IN")}.`,
      );
    }

    // 5. Annexure II Salary Details (Compulsory for Q4)
    interface AnnualSalaryDetailRecord {
      employeeId: Id<"employees">;
      employeeName: string;
      pan: string;
      regime: "new" | "old";
      annualGrossSalary: number;
      previousEmployerGross: number;
      previousEmployerTds: number;
      exemptionsSec10: number;
      standardDeduction: number;
      professionalTax: number;
      chapterVIA80C: number;
      chapterVIA80D: number;
      chapterVIAOther: number;
      totalTaxableIncome: number;
      taxPayable: number;
      tdsDeducted: number;
      balancePayableOrRefund: number;
    }

    const annualSalaryDetails: AnnualSalaryDetailRecord[] = [];

    if (args.quarter === "Q4") {
      // Gather full-year salary records for all active employees
      const employees = await ctx.db
        .query("employees")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();

      const startYr = Number.parseInt(
        args.financialYear.split("-")[0] ?? "2026",
        10,
      );
      const allYearMonths = [
        `${startYr}-04`,
        `${startYr}-05`,
        `${startYr}-06`,
        `${startYr}-07`,
        `${startYr}-08`,
        `${startYr}-09`,
        `${startYr}-10`,
        `${startYr}-11`,
        `${startYr}-12`,
        `${startYr + 1}-01`,
        `${startYr + 1}-02`,
        `${startYr + 1}-03`,
      ];

      const fullYearRuns = allRuns.filter(
        (r) =>
          allYearMonths.includes(r.periodMonth) && r.status === "processed",
      );

      for (const emp of employees) {
        let annualGross = 0;
        let annualTds = 0;
        let annualPt = 0;

        for (const run of fullYearRuns) {
          const item = await ctx.db
            .query("payrollItems")
            .withIndex("by_run", (q) => q.eq("payrollRunId", run._id))
            .filter((q) => q.eq(q.field("employeeId"), emp._id))
            .first();

          if (item) {
            annualGross += item.grossSalary;
            const itemTds =
              item.statutoryDeductions.find(
                (d) =>
                  d.name.toLowerCase().includes("tds") ||
                  d.name.toLowerCase().includes("tax deducted"),
              )?.amount ?? 0;
            annualTds += itemTds;

            const itemPt =
              item.statutoryDeductions.find((d) =>
                d.name.toLowerCase().includes("professional tax"),
              )?.amount ?? 0;
            annualPt += itemPt;
          }
        }

        if (annualGross === 0) continue;

        const empComp = await ctx.db
          .query("employeeCompliance")
          .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
          .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
          .first();

        const regime = empComp?.taxRegime ?? "new";

        const declaration = await ctx.db
          .query("taxDeclarations")
          .withIndex("by_employee_fy", (q) =>
            q.eq("employeeId", emp._id).eq("financialYear", args.financialYear),
          )
          .first();

        const prevGross = declaration?.previousEmployer?.grossSalary ?? 0;
        const prevTds = declaration?.previousEmployer?.tdsDeducted ?? 0;
        const combinedGross = annualGross + prevGross;
        const combinedTdsDeducted = annualTds + prevTds;

        // Calculate annual statutory tax liability using verified engine
        const taxLiab = calculateAnnualTds({
          currentMonthlyGross: 0,
          ytdGrossSalary: combinedGross,
          ytdTdsDeducted: combinedTdsDeducted,
          remainingPayrollMonths: 1, // Full year already accumulated in ytdGross
          taxRegime: regime,
          declarations: {
            section80C: declaration?.chapterVIA?.section80C ?? 0,
            section80D: declaration?.chapterVIA?.section80D ?? 0,
            section80CCD1B: declaration?.chapterVIA?.section80CCD1B ?? 0,
            homeLoanInterestSec24: declaration?.homeLoan?.annualInterest ?? 0,
            hraExemption: 0,
          },
        });

        const sec80C = declaration?.chapterVIA?.section80C ?? 0;
        const sec80D = declaration?.chapterVIA?.section80D ?? 0;
        const sec80CCD1B = declaration?.chapterVIA?.section80CCD1B ?? 0;

        annualSalaryDetails.push({
          employeeId: emp._id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          pan: emp.pan?.trim().toUpperCase() || "PANNOTAVBL",
          regime,
          annualGrossSalary: combinedGross,
          previousEmployerGross: prevGross,
          previousEmployerTds: prevTds,
          exemptionsSec10: 0,
          standardDeduction: taxLiab.standardDeduction,
          professionalTax: annualPt,
          chapterVIA80C: sec80C,
          chapterVIA80D: sec80D,
          chapterVIAOther: sec80CCD1B,
          totalTaxableIncome: taxLiab.netTaxableIncome,
          taxPayable: taxLiab.totalAnnualTaxLiability,
          tdsDeducted: annualTds,
          balancePayableOrRefund:
            taxLiab.totalAnnualTaxLiability - combinedTdsDeducted,
        });
      }
    }

    // 6. Generate Caret-delimited Official Filing String
    const fileLines: string[] = [];
    const now = new Date();
    const creationDate = `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}${now.getFullYear()}`;
    const creationTime = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    // Line 1: File Header (FH) - Official Protean Specification (16 fields, 15 delimiters)
    let lineNo = 1;
    const fhRecord = [
      lineNo.toString(), // 1. Line Number
      "FH", // 2. Record Type
      "SL1", // 3. File Type (SL1 for Salary / Form 24Q & Form 138)
      "R", // 4. Upload Type: Regular
      creationDate, // 5. File Creation Date (DDMMYYYY)
      "1", // 6. File Sequence No
      "D", // 7. Uploader Type: Deductor
      cleanTan, // 8. Deductor TAN
      "1", // 9. Total Batches
      "IndiaPay", // 10. Software Vendor / Utility Name
      "1.0", // 11. Software Version
      "", // 12. Reserved
      "", // 13. Reserved
      "", // 14. Reserved
      "", // 15. Reserved
      "", // 16. Reserved
    ].join(TDS_DELIMITER);
    fileLines.push(fhRecord);

    // Line 2: Batch Header (BH) - Official Protean Layout (60 fields)
    lineNo += 1;
    const deductorName = workspace.name
      .replace(/[^A-Za-z0-9 ]/g, "")
      .slice(0, 75)
      .toUpperCase();
    const deductorCatCode =
      compliance?.deductorType === "government"
        ? "G"
        : compliance?.deductorType === "firm"
          ? "F"
          : compliance?.deductorType === "individual"
            ? "I"
            : compliance?.deductorType === "other"
              ? "O"
              : "K"; // K = Company

    const respPerson = (
      compliance?.responsiblePersonName || "AUTHORIZED SIGNATORY"
    )
      .replace(/[^A-Za-z0-9 ]/g, "")
      .slice(0, 75)
      .toUpperCase();
    const respDesig = (compliance?.responsiblePersonDesignation || "DIRECTOR")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .slice(0, 20)
      .toUpperCase();
    const respPan =
      compliance?.responsiblePersonPan || cleanEmployerPan || "PANNOTAVBL";
    const respEmail = compliance?.responsiblePersonEmail || "tax@indiapay.com";
    const respMobile = compliance?.responsiblePersonMobile || "9999999999";
    const respAddr = (compliance?.responsiblePersonAddress || "INDIA")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .slice(0, 50);

    const bhRecord = [
      lineNo.toString(), // 1. Line Number
      "BH", // 2. Record Type
      "1", // 3. Batch Number
      challans.length.toString(), // 4. Count of Challan records
      isForm138 ? "138" : "24Q", // 5. Form Number
      "", // 6. Transaction Type (NA for regular)
      "", // 7. Batch Updation Indicator (NA for regular)
      "", // 8. Original Token Number (NA for regular)
      "", // 9. Previous Token Number (NA for regular)
      "", // 10. Last TAN (NA for regular)
      cleanTan, // 11. Deductor TAN
      cleanEmployerPan || "PANNOTREQD", // 12. Deductor PAN
      args.financialYear, // 13. Financial Year
      assessmentYear, // 14. Assessment Year
      args.quarter, // 15. Period / Quarter
      deductorName, // 16. Deductor Name
      "", // 17. Branch / Division
      deductorCatCode, // 18. Deductor Category
      deductorCatCode === "G" ? compliance?.paoCode || "PAO001" : "", // 19. PAO Code
      deductorCatCode === "G" ? compliance?.ddoCode || "DDO001" : "", // 20. DDO Code
      deductorCatCode === "G"
        ? compliance?.ministryName || "MINISTRY OF FINANCE"
        : "", // 21. Ministry Name
      "", // 22. Ministry Other
      "", // 23. Flat/Door/Block
      "", // 24. Building Name
      "", // 25. Road/Street
      "", // 26. Area/Locality
      "BENGALURU", // 27. Town/City
      "KA", // 28. State Code
      "560001", // 29. PIN Code
      compliance?.responsiblePersonEmail || "tax@indiapay.com", // 30. Deductor Email
      "", // 31. STD Code
      "", // 32. Phone
      "N", // 33. Change of Address Flag (N)
      respPerson, // 34. Responsible Person Name
      respDesig, // 35. Responsible Person Designation
      "", // 36. Resp Person Flat
      "", // 37. Resp Person Building
      "", // 38. Resp Person Road
      "", // 39. Resp Person Area
      respAddr || "BENGALURU", // 40. Resp Person City
      "KA", // 41. Resp Person State Code
      "560001", // 42. Resp Person PIN Code
      respEmail, // 43. Resp Person Email
      respMobile, // 44. Resp Person Mobile
      "", // 45. Resp Person STD Code
      "", // 46. Resp Person Phone
      "N", // 47. Resp Person Change of Address (N)
      respPan, // 48. Resp Person PAN
      monthlyDeductees.length.toString(), // 49. Total Count of Deductee Records
      formatTwoDecimals(totalGrossSalary), // 50. Total Gross Salary Paid
      formatTwoDecimals(totalTdsDeducted), // 51. Total Tax Deducted
      formatTwoDecimals(totalChallanTaxDeposited), // 52. Total Tax Deposited
      args.quarter === "Q4" ? annualSalaryDetails.length.toString() : "0", // 53. Count of Salary Detail Records (SD)
      "", // 54. Filler
      "", // 55. Filler
      "", // 56. Filler
      "", // 57. Filler
      "", // 58. Filler
      "", // 59. Filler
      "", // 60. Filler
    ].join(TDS_DELIMITER);
    fileLines.push(bhRecord);

    // Allocate deductees across challans for exact Protean control totals
    const challanDeducteeMap = new Map<number, MonthlyDeducteeRecord[]>();
    for (let i = 1; i <= challans.length; i++) {
      challanDeducteeMap.set(i, []);
    }

    const deducteeChallanAssignment: {
      challanNumber: number;
      depositDate: string;
      taxDepositedAllocated: number;
    }[] = [];

    if (challans.length <= 1) {
      const chNum = challans.length === 1 ? 1 : 0;
      const chDate = challans[0]?.depositDate ?? "";
      for (const d of monthlyDeductees) {
        if (chNum > 0) {
          challanDeducteeMap.get(1)!.push(d);
        }
        deducteeChallanAssignment.push({
          challanNumber: chNum,
          depositDate: chDate || d.paymentDate,
          taxDepositedAllocated: d.tdsDeducted,
        });
      }
    } else {
      // Multiple challans: allocate deductees sequentially to match challan tax deposits
      let currentChallanIdx = 0;
      let currentChallanRemainingTax = challans[0]?.taxAmount ?? 0;

      for (const d of monthlyDeductees) {
        if (
          currentChallanRemainingTax < d.tdsDeducted &&
          currentChallanIdx < challans.length - 1
        ) {
          currentChallanIdx += 1;
          currentChallanRemainingTax =
            challans[currentChallanIdx]?.taxAmount ?? 0;
        }

        const assignedChNum = currentChallanIdx + 1;
        challanDeducteeMap.get(assignedChNum)!.push(d);
        currentChallanRemainingTax -= d.tdsDeducted;

        deducteeChallanAssignment.push({
          challanNumber: assignedChNum,
          depositDate:
            challans[currentChallanIdx]?.depositDate ?? d.paymentDate,
          taxDepositedAllocated: d.tdsDeducted,
        });
      }
    }

    // Lines 3..: Challan Details (CD) - Official Protean Layout (30 fields)
    let challanIdx = 1;
    for (const ch of challans) {
      lineNo += 1;
      const linkedCount = challanDeducteeMap.get(challanIdx)?.length ?? 0;
      const isGovt = compliance?.deductorType === "government";
      const cdRecord = [
        lineNo.toString(), // 1. Line Number
        "CD", // 2. Record Type
        "1", // 3. Batch Number
        challanIdx.toString(), // 4. Challan Record Number
        linkedCount.toString(), // 5. Count of Deductees mapped to this challan
        ch.taxAmount === 0 ? "Y" : "N", // 6. Nil Challan Indicator
        "", // 7. Challan Updation Indicator (blank)
        "", // 8. Filler 1
        "", // 9. Filler 2
        "", // 10. Filler 3
        "", // 11. Last Bank Challan Serial (blank)
        "", // 12. Last BSR Code (blank)
        "", // 13. Last Deposit Date (blank)
        "", // 14. Last Total Amount (blank)
        ch.challanSerialNumber, // 15. Challan Serial Number (5 digits)
        ch.bsrCode, // 16. Bank BSR Code (7 digits)
        formatDateDDMMYYYY(ch.depositDate), // 17. Date of Deposit (DDMMYYYY)
        ch.minorHead, // 18. Challan Minor Head (200 / 400)
        formatTwoDecimals(ch.taxAmount), // 19. TDS Tax Amount
        formatTwoDecimals(ch.surcharge ?? 0), // 20. Surcharge
        formatTwoDecimals(ch.cess ?? 0), // 21. Health & Education Cess
        formatTwoDecimals(ch.interest ?? 0), // 22. Interest
        formatTwoDecimals(ch.fee ?? 0), // 23. Fee u/s 234E
        formatTwoDecimals(ch.penalty ?? 0), // 24. Penalty / Others
        formatTwoDecimals(ch.totalAmount), // 25. Total Challan Amount
        isGovt ? "Y" : "N", // 26. Book Entry Flag (Y for Book Entry / Transfer Voucher, N for Bank Challan)
        "", // 27. Cheque / DD Number
        "", // 28. Remarks / Filler 1
        "", // 29. Filler 2
        "", // 30. Filler 3
      ].join(TDS_DELIMITER);
      fileLines.push(cdRecord);
      challanIdx += 1;
    }

    // Lines ..: Deductee Details (DD) - Official Protean Layout (30 fields)
    let deducteeIdx = 1;
    for (const d of monthlyDeductees) {
      lineNo += 1;
      const assignment = deducteeChallanAssignment[deducteeIdx - 1];
      const chNumStr =
        assignment?.challanNumber.toString() ??
        (challans.length > 0 ? "1" : "0");
      const depositDateStr = assignment?.depositDate ?? d.paymentDate;
      const allocatedDeposit =
        assignment?.taxDepositedAllocated ?? d.tdsDeducted;

      const refSerial = deducteeIdx.toString().padStart(6, "0");
      const cleanEmpName = d.employeeName
        .replace(/[^A-Za-z0-9 ]/g, "")
        .slice(0, 75)
        .toUpperCase();
      const sec197Cert = d.certificateNumber197 || "";
      const reasonCode = sec197Cert
        ? "A"
        : d.tdsDeducted === 0
          ? "C"
          : d.isPanMissing
            ? "B"
            : "";
      const isGovt = compliance?.deductorType === "government";
      const rateStr =
        d.tdsDeducted > 0 && d.grossSalary > 0
          ? ((d.tdsDeducted / d.grossSalary) * 100).toFixed(4)
          : "0.0000";

      const ddRecord = [
        lineNo.toString(), // 1. Line Number
        "DD", // 2. Record Type
        "1", // 3. Batch Number
        chNumStr, // 4. Challan Record Number mapped
        deducteeIdx.toString(), // 5. Deductee Record Number
        "O", // 6. Mode: "O" for Original
        refSerial, // 7. Employee Serial / Reference Number
        "", // 8. Deductee Party Code (NA for salary)
        "", // 9. Last PAN (blank for regular)
        d.pan, // 10. Employee PAN (or PANNOTAVBL)
        "", // 11. PAN Reference
        cleanEmpName, // 12. Employee Name
        sectionCode, // 13. Section Code (1002 for Form 138 / 92B for Form 24Q)
        formatDateDDMMYYYY(d.paymentDate), // 14. Date of Payment / Credit (DDMMYYYY)
        formatDateDDMMYYYY(d.paymentDate), // 15. Date of Deduction (DDMMYYYY)
        formatTwoDecimals(d.grossSalary), // 16. Gross Salary / Amount Paid
        formatTwoDecimals(d.tdsDeducted), // 17. Tax Deducted (TDS)
        "0.00", // 18. Surcharge
        "0.00", // 19. Education Cess
        formatTwoDecimals(d.tdsDeducted), // 20. Total Tax Deducted
        formatTwoDecimals(allocatedDeposit), // 21. Total Tax Deposited (Allocated)
        formatDateDDMMYYYY(depositDateStr), // 22. Date of Deposit
        rateStr, // 23. Rate at which tax deducted (4 decimals)
        isGovt ? "Y" : "N", // 24. Book Entry Flag
        reasonCode, // 25. Reason for Non-deduction / Lower deduction (C, B, A, or blank)
        sec197Cert, // 26. Certificate Number u/s 197 (if applicable)
        "", // 27. Filler 1
        "", // 28. Filler 2
        "", // 29. Filler 3
        "", // 30. Filler 4
      ].join(TDS_DELIMITER);
      fileLines.push(ddRecord);
      deducteeIdx += 1;
    }

    // Lines ..: Salary Details (SD) - Annexure II (Quarter 4 ONLY)
    if (args.quarter === "Q4") {
      let salaryIdx = 1;
      for (const s of annualSalaryDetails) {
        lineNo += 1;
        const cleanEmpName = s.employeeName
          .replace(/[^A-Za-z0-9 ]/g, "")
          .slice(0, 75)
          .toUpperCase();
        const regimeCode = s.regime === "new" ? "115BAC" : "OLD";
        const startYr = Number.parseInt(
          args.financialYear.split("-")[0] ?? "2026",
          10,
        );
        const startDt = `0104${startYr}`;
        const endDt = `3103${startYr + 1}`;
        const currentEmpGross = Math.max(
          0,
          s.annualGrossSalary - s.previousEmployerGross,
        );

        const sdRecord = [
          lineNo.toString(), // 1. Line Number
          "SD", // 2. Record Type
          "1", // 3. Batch Number
          salaryIdx.toString(), // 4. Salary Detail Record Number
          s.pan, // 5. Employee PAN
          cleanEmpName, // 6. Employee Name
          regimeCode, // 7. Regime Code (115BAC / OLD)
          startDt, // 8. From Date (DDMMYYYY)
          endDt, // 9. To Date (DDMMYYYY)
          formatTwoDecimals(currentEmpGross), // 10. Gross Salary paid by current employer
          "0.00", // 11. Perquisites u/s 17(2)
          "0.00", // 12. Profits in lieu of salary u/s 17(3)
          formatTwoDecimals(currentEmpGross), // 13. Total Gross Salary current employer
          formatTwoDecimals(s.exemptionsSec10), // 14. Total exemptions u/s 10
          formatTwoDecimals(s.standardDeduction), // 15. Standard Deduction u/s 16(ia)
          formatTwoDecimals(s.professionalTax), // 16. Professional Tax u/s 16(iii)
          formatTwoDecimals(
            Math.max(
              0,
              currentEmpGross - s.standardDeduction - s.professionalTax,
            ),
          ), // 17. Income chargeable under head Salaries (Current Employer)
          formatTwoDecimals(s.previousEmployerGross), // 18. Salary reported from other / previous employer(s)
          formatTwoDecimals(
            Math.max(
              0,
              s.annualGrossSalary - s.standardDeduction - s.professionalTax,
            ),
          ), // 19. Gross Total Income
          formatTwoDecimals(s.chapterVIA80C), // 20. Section 80C
          formatTwoDecimals(s.chapterVIA80D), // 21. Section 80D
          formatTwoDecimals(s.chapterVIAOther), // 22. Other Chapter VI-A deductions
          formatTwoDecimals(s.totalTaxableIncome), // 23. Total Taxable Income
          formatTwoDecimals(s.taxPayable), // 24. Tax Payable before cess
          "0.00", // 25. Rebate u/s 87A
          formatTwoDecimals(Math.round(s.taxPayable * 0.04)), // 26. Health & Education Cess
          formatTwoDecimals(s.taxPayable), // 27. Total Tax Liability
          formatTwoDecimals(s.tdsDeducted), // 28. Tax Deducted by Current Employer
          formatTwoDecimals(s.previousEmployerTds), // 29. Tax Deducted by Previous Employer
          formatTwoDecimals(s.balancePayableOrRefund), // 30. Balance Tax Payable / Refundable
        ].join(TDS_DELIMITER);
        fileLines.push(sdRecord);
        salaryIdx += 1;
      }
    }

    const fileContent = errors.length > 0 ? null : fileLines.join("\r\n");
    const safeTan = cleanTan.replace(/[^A-Za-z0-9]/g, "");
    const fileName = isForm138
      ? `Form138_${args.quarter}_${args.financialYear}_${safeTan}.txt`
      : `Form24Q_${args.quarter}_${args.financialYear}_${safeTan}.txt`;

    // 7. Human-readable CSV Audit Worksheet Content
    const csvRows: string[] = [
      `"NOTICE: INTERNAL AUDIT RECONCILIATION REPORT ONLY. NOT AN OFFICIAL E-FILING ARTIFACT. USE OFFICIAL .TXT EXPORT FOR FVU / TRACES SUBMISSION."`,
      `"Statutory Return:","${formName} (${governingAct})"`,
      `"Financial Year:","${args.financialYear}"`,
      `"Assessment Year:","${assessmentYear}"`,
      `"Quarter:","${quarterLabel}"`,
      `"Employer TAN:","${cleanTan}"`,
      `"Employer PAN:","${cleanEmployerPan || "NOT CONFIGURED"}"`,
      `"Total Enrolled Deductees:","${monthlyDeductees.length}"`,
      `"Total Gross Wages Paid:","₹${totalGrossSalary.toLocaleString("en-IN")}"`,
      `"Total TDS Deducted:","₹${totalTdsDeducted.toLocaleString("en-IN")}"`,
      `"Total Challan Deposited:","₹${totalChallanTaxDeposited.toLocaleString("en-IN")}"`,
      `"Reconciliation Variance:","₹${(totalTdsDeducted - totalChallanTaxDeposited).toLocaleString("en-IN")}"`,
      "",
      `"SECTION A: MONTHLY DEDUCTEE TDS BREAKDOWN (ANNEXURE I)"`,
      `"Sl No","Employee Name","PAN","Month","Payment Date","Gross Salary (₹)","TDS Deducted (₹)","Tax Regime","Section Code"`,
    ];

    let sl = 1;
    for (const d of monthlyDeductees) {
      csvRows.push(
        `"${sl}","${d.employeeName}","${d.pan}","${d.periodMonth}","${d.paymentDate}","${d.grossSalary}","${d.tdsDeducted}","${d.regime.toUpperCase()}","${sectionCode}"`,
      );
      sl += 1;
    }

    if (challans.length > 0) {
      csvRows.push("");
      csvRows.push(`"SECTION B: ITNS 281 CHALLAN DEPOSITS"`);
      csvRows.push(
        `"Challan Sl","BSR Code","Deposit Date","Challan Serial","Minor Head","TDS Amount (₹)","Surcharge (₹)","Cess (₹)","Interest (₹)","Fee 234E (₹)","Total Remittance (₹)"`,
      );
      let csl = 1;
      for (const ch of challans) {
        csvRows.push(
          `"${csl}","${ch.bsrCode}","${ch.depositDate}","${ch.challanSerialNumber}","${ch.minorHead}","${ch.taxAmount}","${ch.surcharge ?? 0}","${ch.cess ?? 0}","${ch.interest ?? 0}","${ch.fee ?? 0}","${ch.totalAmount}"`,
        );
        csl += 1;
      }
    }

    if (args.quarter === "Q4" && annualSalaryDetails.length > 0) {
      csvRows.push("");
      csvRows.push(
        `"SECTION C: ANNUAL SALARY AND TAX COMPUTATION (ANNEXURE II - Q4 ONLY)"`,
      );
      csvRows.push(
        `"Sl No","Employee Name","PAN","Regime","Annual Gross (₹)","Prev Employer Gross (₹)","Exemptions Sec 10 (₹)","Standard Deduction (₹)","Prof Tax (₹)","80C (₹)","80D (₹)","Other Deductions (₹)","Taxable Income (₹)","Annual Tax Payable (₹)","Current Employer TDS (₹)","Prev Employer TDS (₹)","Balance / (Refund) (₹)"`,
      );
      let asl = 1;
      for (const a of annualSalaryDetails) {
        csvRows.push(
          `"${asl}","${a.employeeName}","${a.pan}","${a.regime.toUpperCase()}","${a.annualGrossSalary}","${a.previousEmployerGross}","${a.exemptionsSec10}","${a.standardDeduction}","${a.professionalTax}","${a.chapterVIA80C}","${a.chapterVIA80D}","${a.chapterVIAOther}","${a.totalTaxableIncome}","${a.taxPayable}","${a.tdsDeducted}","${a.previousEmployerTds}","${a.balancePayableOrRefund}"`,
        );
        asl += 1;
      }
    }

    const csvContent = csvRows.join("\n");
    const csvFileName = `TDS_Reconciliation_Audit_${args.quarter}_${args.financialYear}_${safeTan}.csv`;

    return {
      success: errors.length === 0,
      isForm138,
      formName,
      governingAct,
      sectionCode,
      financialYear: args.financialYear,
      assessmentYear,
      quarter: args.quarter,
      quarterLabel,
      tan: cleanTan,
      employerPan: cleanEmployerPan,
      totalDeductees: monthlyDeductees.length,
      totalGrossSalary,
      totalTdsDeducted,
      totalChallans: challans.length,
      totalChallanTaxDeposited,
      totalChallanRemittance,
      reconciliationShortfall: Math.max(
        0,
        totalTdsDeducted - totalChallanTaxDeposited,
      ),
      isOfficialFilingVerified: false,
      fvuVersionRequired: isForm138
        ? "e-TDS/TCS FVU Version 1.2"
        : "e-TDS/TCS FVU Version 9.5",
      filingFormatStatus: "DRAFT_LAYOUT_PREVIEW_ONLY" as const,
      filingNotice:
        "Draft text layout for internal review and reconciliation. Direct upload to Protean / ITD portal is disabled because official FVU validation requires the complete ~60-field Batch Header and ~40-field Deductee structure with certified DDO/PAO and postal address block specifications. Please use the Audit Report (.csv) for verified payroll reconciliation.",
      q4AnnexureIIStatus:
        args.quarter === "Q4"
          ? ("ADVISORY_ANNUAL_CALCULATION" as const)
          : ("NOT_APPLICABLE" as const),
      errors,
      warnings,
      fileContent,
      fileName,
      csvContent,
      csvFileName,
      monthlyDeductees: monthlyDeductees.slice(0, 15), // Preview sample
      annualSalaryDetails: annualSalaryDetails.slice(0, 15),
      challans,
    };
  },
});

export const logTdsExportDownload = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    formType: v.string(), // "Form 138" or "Form 24Q" or "CSV Audit"
    financialYear: v.string(),
    quarter: v.string(),
    totalDeductees: v.number(),
    totalTds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    await audit(ctx, args.workspaceId, userId, "tds.export_download", {
      formType: args.formType,
      financialYear: args.financialYear,
      quarter: args.quarter,
      totalDeductees: args.totalDeductees,
      totalTds: args.totalTds,
    });
  },
});
