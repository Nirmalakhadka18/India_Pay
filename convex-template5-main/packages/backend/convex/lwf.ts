/**
 * Labour Welfare Fund (LWF) Statutory Calculation Engine for IndiaPay
 *
 * Supported State Schedules:
 * - Karnataka: The Karnataka Labour Welfare Fund Act, 1965
 *   - Frequency: Annual in December (Month 12)
 *   - Rates: Employee ₹20, Employer ₹40 (Total ₹60)
 *   - Statutory Remittance Deadline: 15th January
 *
 * - Maharashtra: The Bombay Labour Welfare Fund Act, 1953
 *   - Frequency: Bi-annual in June (Month 6) and December (Month 12)
 *   - Slabs:
 *     - Gross <= ₹3,000: Exempt (₹0 / ₹0)
 *     - Gross > ₹3,000: Employee ₹12, Employer ₹36 (Total ₹48, 1:3 ratio)
 *   - Statutory Remittance Deadline: 15th July & 15th January
 *
 * - Gujarat: The Gujarat Labour Welfare Fund Act
 *   - Frequency: Bi-annual in June (Month 6) and December (Month 12)
 *   - Rates: Gross > ₹3,000: Employee ₹6, Employer ₹12
 *
 * - Telangana & Andhra Pradesh:
 *   - Frequency: Annual in December (Month 12)
 *   - Rates: Employee ₹20, Employer ₹40
 *
 * - Nil-LWF Jurisdictions:
 *   - Delhi, Haryana, Rajasthan, Uttar Pradesh (Nil / No statutory deduction)
 *
 * SAFETY & COMPLIANCE RULES:
 * 1. If lwfEnabled is false or unspecified, deductions and contributions strictly return ₹0.
 * 2. In non-deduction months, deductions and contributions strictly return ₹0.
 * 3. Unrecognized or missing states safely return ₹0 with an explicit audit warning.
 */

export interface LabourWelfareFundInput {
  grossSalary: number;
  month: number; // 1 to 12 (calendar month, where 6 = June, 12 = December)
  state?: string;
  lwfEnabled: boolean;
}

export interface LabourWelfareFundResult {
  employeeAmount: number;
  employerAmount: number;
  applicableState: string;
  isDeductionMonth: boolean;
  frequency: "annual" | "bi_annual" | "monthly" | "none";
  scheduleDescription: string;
  warnings: string[];
}

export function computeLabourWelfareFund(
  input: LabourWelfareFundInput,
): LabourWelfareFundResult {
  const warnings: string[] = [];

  if (!input.lwfEnabled) {
    return {
      employeeAmount: 0,
      employerAmount: 0,
      applicableState: input.state ?? "None",
      isDeductionMonth: false,
      frequency: "none",
      scheduleDescription:
        "Labour Welfare Fund (LWF) is disabled for this workspace.",
      warnings: [],
    };
  }

  const rawState = (input.state ?? "").trim();
  const gross = Math.max(0, input.grossSalary);
  const month = input.month;

  if (!rawState) {
    warnings.push("Missing LWF state. Defaulted to ₹0 deduction.");
    return {
      employeeAmount: 0,
      employerAmount: 0,
      applicableState: "Unspecified",
      isDeductionMonth: false,
      frequency: "none",
      scheduleDescription: "No state specified. No LWF deduction applied.",
      warnings,
    };
  }

  const normalizedState = rawState.toLowerCase();

  // 1. KARNATAKA (The Karnataka Labour Welfare Fund Act, 1965)
  // Frequency: Annual in December (Month 12)
  // Employee: ₹20, Employer: ₹40 (Total ₹60)
  if (normalizedState === "karnataka") {
    const isDecember = month === 12;
    if (isDecember) {
      return {
        employeeAmount: 20,
        employerAmount: 40,
        applicableState: "Karnataka",
        isDeductionMonth: true,
        frequency: "annual",
        scheduleDescription:
          "Karnataka LWF: Annual deduction in December (Employee: ₹20, Employer: ₹40). Remittance due by 15th January.",
        warnings,
      };
    }
    return {
      employeeAmount: 0,
      employerAmount: 0,
      applicableState: "Karnataka",
      isDeductionMonth: false,
      frequency: "annual",
      scheduleDescription:
        "Karnataka LWF: Non-deduction month (deducted annually in December only).",
      warnings,
    };
  }

  // 2. MAHARASHTRA (The Bombay Labour Welfare Fund Act, 1953)
  // Frequency: Bi-annual in June (Month 6) and December (Month 12)
  // Slabs:
  //   Gross <= ₹3,000: Exempt
  //   Gross > ₹3,000: Employee: ₹12, Employer: ₹36
  if (normalizedState === "maharashtra") {
    const isBiAnnualMonth = month === 6 || month === 12;
    if (!isBiAnnualMonth) {
      return {
        employeeAmount: 0,
        employerAmount: 0,
        applicableState: "Maharashtra",
        isDeductionMonth: false,
        frequency: "bi_annual",
        scheduleDescription:
          "Maharashtra LWF: Non-deduction month (deducted bi-annually in June and December only).",
        warnings,
      };
    }

    if (gross <= 3000) {
      return {
        employeeAmount: 0,
        employerAmount: 0,
        applicableState: "Maharashtra",
        isDeductionMonth: true,
        frequency: "bi_annual",
        scheduleDescription:
          "Maharashtra LWF: Gross <= ₹3,000 is exempt from LWF contributions.",
        warnings,
      };
    }

    const monthLabel = month === 6 ? "June" : "December";
    const dueLabel = month === 6 ? "15th July" : "15th January";
    return {
      employeeAmount: 12,
      employerAmount: 36,
      applicableState: "Maharashtra",
      isDeductionMonth: true,
      frequency: "bi_annual",
      scheduleDescription: `Maharashtra LWF: ${monthLabel} deduction for gross > ₹3,000 (Employee: ₹12, Employer: ₹36). Remittance due by ${dueLabel}.`,
      warnings,
    };
  }

  // 3. GUJARAT (The Gujarat Labour Welfare Fund Act)
  // Frequency: Bi-annual in June and December
  if (normalizedState === "gujarat") {
    const isBiAnnualMonth = month === 6 || month === 12;
    if (!isBiAnnualMonth) {
      return {
        employeeAmount: 0,
        employerAmount: 0,
        applicableState: "Gujarat",
        isDeductionMonth: false,
        frequency: "bi_annual",
        scheduleDescription:
          "Gujarat LWF: Non-deduction month (deducted bi-annually in June and December).",
        warnings,
      };
    }
    const empShare = gross > 3000 ? 6 : 3;
    const emplyrShare = gross > 3000 ? 12 : 6;
    return {
      employeeAmount: empShare,
      employerAmount: emplyrShare,
      applicableState: "Gujarat",
      isDeductionMonth: true,
      frequency: "bi_annual",
      scheduleDescription: `Gujarat LWF: Bi-annual deduction (Employee: ₹${empShare}, Employer: ₹${emplyrShare}).`,
      warnings,
    };
  }

  // 4. TELANGANA / ANDHRA PRADESH
  // Frequency: Annual in December
  if (normalizedState === "telangana" || normalizedState === "andhra pradesh") {
    const isDecember = month === 12;
    if (isDecember) {
      return {
        employeeAmount: 20,
        employerAmount: 40,
        applicableState: rawState,
        isDeductionMonth: true,
        frequency: "annual",
        scheduleDescription: `${rawState} LWF: Annual deduction in December (Employee: ₹20, Employer: ₹40).`,
        warnings,
      };
    }
    return {
      employeeAmount: 0,
      employerAmount: 0,
      applicableState: rawState,
      isDeductionMonth: false,
      frequency: "annual",
      scheduleDescription: `${rawState} LWF: Non-deduction month (deducted annually in December only).`,
      warnings,
    };
  }

  // 5. NIL-LWF STATES (Delhi, Haryana, Rajasthan, Uttar Pradesh, etc.)
  const nilStates = [
    "delhi",
    "haryana",
    "rajasthan",
    "uttar pradesh",
    "up",
    "himachal pradesh",
    "punjab",
  ];
  if (nilStates.includes(normalizedState)) {
    return {
      employeeAmount: 0,
      employerAmount: 0,
      applicableState: rawState,
      isDeductionMonth: false,
      frequency: "none",
      scheduleDescription: `${rawState} has no statutory Labour Welfare Fund deduction.`,
      warnings,
    };
  }

  // 6. OTHER / UNRECOGNIZED JURISDICTIONS (Safe Fallback)
  warnings.push(
    `Unsupported or unverified LWF schedule for state "${rawState}". Defaulted to ₹0.`,
  );
  return {
    employeeAmount: 0,
    employerAmount: 0,
    applicableState: rawState,
    isDeductionMonth: false,
    frequency: "none",
    scheduleDescription: `No statutory LWF schedule configured for ${rawState}.`,
    warnings,
  };
}
