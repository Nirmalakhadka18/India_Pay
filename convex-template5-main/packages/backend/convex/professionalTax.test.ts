import { describe, expect, test } from "vitest";
import { computeProfessionalTax } from "./professionalTax";

describe("Multi-State Professional Tax — Karnataka Schedule", () => {
  test("Gross below statutory threshold (< ₹25,000) is exempt", () => {
    const res = computeProfessionalTax({
      grossSalary: 24999,
      month: 10,
      state: "Karnataka",
      ptEnabled: true,
    });
    expect(res.amount).toBe(0);
    expect(res.isExempt).toBe(true);
    expect(res.applicableState).toBe("Karnataka");
  });

  test("Gross exactly at threshold (₹25,000) is ₹200 in standard months", () => {
    const res = computeProfessionalTax({
      grossSalary: 25000,
      month: 10,
      state: "Karnataka",
      ptEnabled: true,
    });
    expect(res.amount).toBe(200);
    expect(res.isExempt).toBe(false);
  });

  test("Karnataka February adjustment (month 2) is ₹300 to meet ₹2,500 annual cap", () => {
    const res = computeProfessionalTax({
      grossSalary: 50000,
      month: 2,
      state: "Karnataka",
      ptEnabled: true,
    });
    expect(res.amount).toBe(300);
    expect(res.isExempt).toBe(false);
  });
});

describe("Multi-State Professional Tax — Maharashtra Schedule", () => {
  test("Male/Default: Gross <= ₹7,500 is exempt", () => {
    const res = computeProfessionalTax({
      grossSalary: 7500,
      month: 5,
      state: "Maharashtra",
      ptEnabled: true,
    });
    expect(res.amount).toBe(0);
    expect(res.isExempt).toBe(true);
  });

  test("Male/Default: Gross between ₹7,501 and ₹10,000 is ₹175", () => {
    const res = computeProfessionalTax({
      grossSalary: 9000,
      month: 5,
      state: "Maharashtra",
      ptEnabled: true,
    });
    expect(res.amount).toBe(175);
    expect(res.isExempt).toBe(false);
  });

  test("Male/Default: Gross > ₹10,000 is ₹200 in standard months and ₹300 in February", () => {
    const standardRes = computeProfessionalTax({
      grossSalary: 40000,
      month: 7,
      state: "Maharashtra",
      ptEnabled: true,
    });
    expect(standardRes.amount).toBe(200);

    const febRes = computeProfessionalTax({
      grossSalary: 40000,
      month: 2,
      state: "Maharashtra",
      ptEnabled: true,
    });
    expect(febRes.amount).toBe(300);
  });

  test("Female: 2023 amendment exemption up to ₹25,000", () => {
    const exemptRes = computeProfessionalTax({
      grossSalary: 24000,
      month: 5,
      state: "Maharashtra",
      gender: "female",
      ptEnabled: true,
    });
    expect(exemptRes.amount).toBe(0);
    expect(exemptRes.isExempt).toBe(true);

    const aboveRes = computeProfessionalTax({
      grossSalary: 30000,
      month: 5,
      state: "Maharashtra",
      gender: "female",
      ptEnabled: true,
    });
    expect(aboveRes.amount).toBe(200);
  });
});

describe("Multi-State Professional Tax — Telangana & Andhra Pradesh", () => {
  test("Gross <= ₹15,000 is exempt", () => {
    const res = computeProfessionalTax({
      grossSalary: 15000,
      month: 4,
      state: "Telangana",
      ptEnabled: true,
    });
    expect(res.amount).toBe(0);
    expect(res.isExempt).toBe(true);
  });

  test("Gross between ₹15,001 and ₹20,000 is ₹150", () => {
    const res = computeProfessionalTax({
      grossSalary: 18000,
      month: 4,
      state: "Telangana",
      ptEnabled: true,
    });
    expect(res.amount).toBe(150);
  });

  test("Gross > ₹20,000 is ₹200", () => {
    const res = computeProfessionalTax({
      grossSalary: 35000,
      month: 4,
      state: "Andhra Pradesh",
      ptEnabled: true,
    });
    expect(res.amount).toBe(200);
  });
});

describe("Multi-State Professional Tax — Nil-PT & Safe Fallbacks", () => {
  test("Delhi and Haryana do not levy Professional Tax", () => {
    const delhi = computeProfessionalTax({
      grossSalary: 100000,
      month: 6,
      state: "Delhi",
      ptEnabled: true,
    });
    expect(delhi.amount).toBe(0);
    expect(delhi.isExempt).toBe(true);

    const haryana = computeProfessionalTax({
      grossSalary: 100000,
      month: 6,
      state: "Haryana",
      ptEnabled: true,
    });
    expect(haryana.amount).toBe(0);
  });

  test("Disabled Professional Tax yields ₹0 with no warnings", () => {
    const res = computeProfessionalTax({
      grossSalary: 100000,
      month: 6,
      state: "Karnataka",
      ptEnabled: false,
    });
    expect(res.amount).toBe(0);
    expect(res.warnings).toHaveLength(0);
  });

  test("Missing state safely yields ₹0 with warning and does NOT default to Karnataka", () => {
    const res = computeProfessionalTax({
      grossSalary: 50000,
      month: 6,
      state: undefined,
      ptEnabled: true,
    });
    expect(res.amount).toBe(0);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.applicableState).toBe("Unspecified");
  });

  test("Unsupported state safely yields ₹0 with warning and does NOT default to Karnataka", () => {
    const res = computeProfessionalTax({
      grossSalary: 50000,
      month: 6,
      state: "Assam_Unconfigured",
      ptEnabled: true,
    });
    expect(res.amount).toBe(0);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0]).toContain("Unsupported Professional Tax state");
  });
});
