import { describe, expect, it } from "vitest";
import { computeLabourWelfareFund } from "./lwf";

describe("Labour Welfare Fund (LWF) Statutory Engine", () => {
  describe("Disabled LWF", () => {
    it("returns zero deduction and contribution when lwfEnabled is false", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 12,
        state: "Karnataka",
        lwfEnabled: false,
      });

      expect(result.employeeAmount).toBe(0);
      expect(result.employerAmount).toBe(0);
      expect(result.isDeductionMonth).toBe(false);
      expect(result.frequency).toBe("none");
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("Karnataka LWF Rules (Annual in December)", () => {
    it("deducts Employee ₹20 and Employer ₹40 in December (Month 12)", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 45000,
        month: 12,
        state: "Karnataka",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(20);
      expect(result.employerAmount).toBe(40);
      expect(result.isDeductionMonth).toBe(true);
      expect(result.frequency).toBe("annual");
      expect(result.applicableState).toBe("Karnataka");
      expect(result.scheduleDescription).toContain("15th January");
    });

    it("returns ₹0 in non-December months (e.g. October, Month 10)", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 45000,
        month: 10,
        state: "Karnataka",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(0);
      expect(result.employerAmount).toBe(0);
      expect(result.isDeductionMonth).toBe(false);
    });

    it("handles lowercase state input 'karnataka'", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 80000,
        month: 12,
        state: "karnataka",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(20);
      expect(result.employerAmount).toBe(40);
    });
  });

  describe("Maharashtra LWF Rules (Bi-annual in June & December)", () => {
    it("exempts employees with gross salary <= ₹3,000 in June and December", () => {
      const resultJune = computeLabourWelfareFund({
        grossSalary: 2500,
        month: 6,
        state: "Maharashtra",
        lwfEnabled: true,
      });

      expect(resultJune.employeeAmount).toBe(0);
      expect(resultJune.employerAmount).toBe(0);
      expect(resultJune.isDeductionMonth).toBe(true);

      const resultDec = computeLabourWelfareFund({
        grossSalary: 3000,
        month: 12,
        state: "Maharashtra",
        lwfEnabled: true,
      });

      expect(resultDec.employeeAmount).toBe(0);
      expect(resultDec.employerAmount).toBe(0);
    });

    it("deducts Employee ₹12 and Employer ₹36 for gross > ₹3,000 in June (Month 6)", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 6,
        state: "Maharashtra",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(12);
      expect(result.employerAmount).toBe(36);
      expect(result.isDeductionMonth).toBe(true);
      expect(result.frequency).toBe("bi_annual");
      expect(result.scheduleDescription).toContain("15th July");
    });

    it("deducts Employee ₹12 and Employer ₹36 for gross > ₹3,000 in December (Month 12)", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 75000,
        month: 12,
        state: "Maharashtra",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(12);
      expect(result.employerAmount).toBe(36);
      expect(result.scheduleDescription).toContain("15th January");
    });

    it("returns ₹0 in other months (e.g. October, Month 10)", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 10,
        state: "Maharashtra",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(0);
      expect(result.employerAmount).toBe(0);
      expect(result.isDeductionMonth).toBe(false);
    });
  });

  describe("Gujarat LWF Rules", () => {
    it("calculates bi-annual deductions in June and December", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 35000,
        month: 6,
        state: "Gujarat",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(6);
      expect(result.employerAmount).toBe(12);
      expect(result.isDeductionMonth).toBe(true);
    });
  });

  describe("Telangana / AP LWF Rules", () => {
    it("deducts ₹20 employee and ₹40 employer in December", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 60000,
        month: 12,
        state: "Telangana",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(20);
      expect(result.employerAmount).toBe(40);
      expect(result.isDeductionMonth).toBe(true);
    });
  });

  describe("Nil-LWF States & Edge Cases", () => {
    it("returns ₹0 for Delhi and Haryana without warnings", () => {
      const resultDelhi = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 12,
        state: "Delhi",
        lwfEnabled: true,
      });

      expect(resultDelhi.employeeAmount).toBe(0);
      expect(resultDelhi.employerAmount).toBe(0);
      expect(resultDelhi.warnings).toHaveLength(0);

      const resultHaryana = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 12,
        state: "Haryana",
        lwfEnabled: true,
      });

      expect(resultHaryana.employeeAmount).toBe(0);
      expect(resultHaryana.employerAmount).toBe(0);
    });

    it("returns ₹0 with a warning when state is empty or missing", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 12,
        state: "",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(0);
      expect(result.employerAmount).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("returns ₹0 with a warning for unsupported states", () => {
      const result = computeLabourWelfareFund({
        grossSalary: 50000,
        month: 12,
        state: "UnknownStateXYZ",
        lwfEnabled: true,
      });

      expect(result.employeeAmount).toBe(0);
      expect(result.employerAmount).toBe(0);
      expect(result.warnings[0]).toContain(
        "Unsupported or unverified LWF schedule",
      );
    });
  });
});
