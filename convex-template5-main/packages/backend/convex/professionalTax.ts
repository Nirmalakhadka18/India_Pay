/**
 * Multi-State Professional Tax Calculation Engine for IndiaPay
 *
 * Supported State Schedules:
 * - Karnataka: The Karnataka Tax on Professions, Trades, Callings and Employments Act, 1976
 * - Maharashtra: The Maharashtra State Tax on Professions, Trades, Callings and Employments Act, 1975
 * - Telangana: The Telangana Tax on Professions, Trades, Callings and Employments Act, 1987
 * - Andhra Pradesh: The Andhra Pradesh Tax on Professions, Trades, Callings and Employments Act, 1987
 * - Nil-PT Jurisdictions: Delhi, Haryana, Rajasthan, Uttar Pradesh, Himachal Pradesh, etc.
 *
 * SAFETY & COMPLIANCE RULES:
 * 1. Karnataka rules remain 100% backward compatible (exempt under ₹25k; ₹200 standard, ₹300 Feb).
 * 2. Never default non-Karnataka employees to Karnataka slabs.
 * 3. Unrecognized or missing states safely return ₹0 with an explicit audit warning.
 */

export type IndianState =
  | "Karnataka"
  | "Maharashtra"
  | "Telangana"
  | "Andhra Pradesh"
  | "Delhi"
  | "Haryana"
  | "Rajasthan"
  | "Tamil Nadu"
  | "West Bengal"
  | "Gujarat"
  | "Other";

export interface ProfessionalTaxInput {
  grossSalary: number;
  month: number; // 1 to 12 (calendar month, where 2 = February)
  state?: string;
  gender?: "male" | "female" | "other";
  ptEnabled: boolean;
}

export interface ProfessionalTaxResult {
  amount: number;
  applicableState: string;
  isExempt: boolean;
  warnings: string[];
  scheduleDescription: string;
}

export function computeProfessionalTax(input: ProfessionalTaxInput): ProfessionalTaxResult {
  const warnings: string[] = [];

  if (!input.ptEnabled) {
    return {
      amount: 0,
      applicableState: input.state ?? "None",
      isExempt: true,
      warnings: [],
      scheduleDescription: "Professional Tax is disabled for this workspace.",
    };
  }

  const rawState = (input.state ?? "").trim();
  const gross = Math.max(0, input.grossSalary);
  const month = input.month;

  if (!rawState) {
    warnings.push("Missing employee/workspace Professional Tax state. Defaulted to ₹0 deduction.");
    return {
      amount: 0,
      applicableState: "Unspecified",
      isExempt: true,
      warnings,
      scheduleDescription: "No state specified. No deduction applied.",
    };
  }

  const normalizedState = rawState.toLowerCase();

  // 1. KARNATAKA (Statutory Schedule)
  // Gross < ₹25,000: Nil
  // Gross >= ₹25,000: ₹200 (March - January), ₹300 (February) -> Total ₹2,500/year
  if (normalizedState === "karnataka") {
    if (gross < 25000) {
      return {
        amount: 0,
        applicableState: "Karnataka",
        isExempt: true,
        warnings,
        scheduleDescription: "Karnataka: Gross < ₹25,000 is exempt.",
      };
    }
    const amount = month === 2 ? 300 : 200;
    return {
      amount,
      applicableState: "Karnataka",
      isExempt: false,
      warnings,
      scheduleDescription: `Karnataka: Gross >= ₹25,000 (Month ${month === 2 ? "Feb ₹300" : "Standard ₹200"}).`,
    };
  }

  // 2. MAHARASHTRA
  // Men / Default:
  //   <= ₹7,500: Nil
  //   ₹7,501 to ₹10,000: ₹175
  //   > ₹10,000: ₹200 (March - January), ₹300 (February)
  // Women (under 2023 notification):
  //   <= ₹25,000: Nil
  //   > ₹25,000: ₹200 (March - Jan), ₹300 (Feb)
  if (normalizedState === "maharashtra") {
    const isFemale = input.gender === "female";

    if (isFemale) {
      if (gross <= 25000) {
        return {
          amount: 0,
          applicableState: "Maharashtra",
          isExempt: true,
          warnings,
          scheduleDescription: "Maharashtra (Female): Gross <= ₹25,000 is exempt.",
        };
      }
      const amount = month === 2 ? 300 : 200;
      return {
        amount,
        applicableState: "Maharashtra",
        isExempt: false,
        warnings,
        scheduleDescription: `Maharashtra (Female): Gross > ₹25,000 (${month === 2 ? "Feb ₹300" : "Standard ₹200"}).`,
      };
    }

    // Male or unspecified gender
    if (gross <= 7500) {
      return {
        amount: 0,
        applicableState: "Maharashtra",
        isExempt: true,
        warnings,
        scheduleDescription: "Maharashtra: Gross <= ₹7,500 is exempt.",
      };
    }
    if (gross <= 10000) {
      return {
        amount: 175,
        applicableState: "Maharashtra",
        isExempt: false,
        warnings,
        scheduleDescription: "Maharashtra: Gross ₹7,501 to ₹10,000 slab (₹175/month).",
      };
    }
    const amount = month === 2 ? 300 : 200;
    return {
      amount,
      applicableState: "Maharashtra",
      isExempt: false,
      warnings,
      scheduleDescription: `Maharashtra: Gross > ₹10,000 (${month === 2 ? "Feb ₹300" : "Standard ₹200"}).`,
    };
  }

  // 3. TELANGANA & ANDHRA PRADESH
  // <= ₹15,000: Nil
  // ₹15,001 to ₹20,000: ₹150
  // > ₹20,000: ₹200
  if (normalizedState === "telangana" || normalizedState === "andhra pradesh") {
    const stateName = normalizedState === "telangana" ? "Telangana" : "Andhra Pradesh";
    if (gross <= 15000) {
      return {
        amount: 0,
        applicableState: stateName,
        isExempt: true,
        warnings,
        scheduleDescription: `${stateName}: Gross <= ₹15,000 is exempt.`,
      };
    }
    if (gross <= 20000) {
      return {
        amount: 150,
        applicableState: stateName,
        isExempt: false,
        warnings,
        scheduleDescription: `${stateName}: Gross ₹15,001 to ₹20,000 (₹150/month).`,
      };
    }
    return {
      amount: 200,
      applicableState: stateName,
      isExempt: false,
      warnings,
      scheduleDescription: `${stateName}: Gross > ₹20,000 (₹200/month).`,
    };
  }

  // 4. NIL-PT JURISDICTIONS (No Professional Tax under state legislation)
  const nilPtStates = [
    "delhi",
    "national capital territory of delhi",
    "haryana",
    "rajasthan",
    "uttar pradesh",
    "himachal pradesh",
    "punjab",
    "chandigarh",
    "uttarakhand",
    "goa",
  ];
  if (nilPtStates.includes(normalizedState)) {
    return {
      amount: 0,
      applicableState: rawState,
      isExempt: true,
      warnings,
      scheduleDescription: `${rawState}: No Professional Tax levied under state law.`,
    };
  }

  // 5. UNRECOGNIZED OR UNSUPPORTED STATE
  // Never default blindly to Karnataka
  warnings.push(
    `Unsupported Professional Tax state: "${rawState}". Zero deduction applied pending state rule configuration.`
  );
  return {
    amount: 0,
    applicableState: rawState,
    isExempt: true,
    warnings,
    scheduleDescription: `Unsupported state: ${rawState}. Safe ₹0 fallback applied.`,
  };
}
