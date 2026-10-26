"use client";

import { RoleGuard } from "@/components/role-guard";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Input } from "@v1/ui/input";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function SalariesPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <SalariesContent />
    </RoleGuard>
  );
}

function SalariesContent() {
  const searchParams = useSearchParams();
  const targetEmployeeId = searchParams?.get("employeeId");
  const { current } = useWorkspace();
  const workspaceId = current;

  const employees = useQuery(
    api.employees.list,
    workspaceId ? { workspaceId } : "skip",
  );
  const currentSalaries = useQuery(
    api.salaries.getCurrentSalaries,
    workspaceId ? { workspaceId } : "skip",
  );
  const addSalary = useMutation(api.salaries.add);

  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{
    _id: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // Salary Form State
  const [monthlyGross, setMonthlyGross] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState<
    { name: string; amount: number }[]
  >([]);
  const [deductions, setDeductions] = useState<
    { name: string; amount: number }[]
  >([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 50/20/30 Distribution: Basic 50%, HRA 20%, Special Allowance remaining 30%
  const apply502030Distribution = (grossVal: number) => {
    const gross = Math.max(0, Math.round(grossVal));
    const basic = Math.round(gross * 0.5);
    const hra = Math.round(gross * 0.2);
    // Special Allowance absorbs any odd-rupee rounding differences
    const special = Math.max(0, gross - basic - hra);

    setBasicSalary(basic.toString());
    const newAllowances: { name: string; amount: number }[] = [];
    if (hra > 0 || gross > 0) {
      newAllowances.push({ name: "HRA", amount: hra });
    }
    if (special > 0 || gross > 0) {
      newAllowances.push({ name: "Special Allowance", amount: special });
    }
    setAllowances(newAllowances);
  };

  const handleGrossChange = (val: string) => {
    setMonthlyGross(val);
    const num = Number(val);
    if (!Number.isNaN(num) && num > 0) {
      apply502030Distribution(num);
    } else if (val === "") {
      setBasicSalary("");
      setAllowances([]);
    }
  };

  const handleRebalanceSpecialAllowance = () => {
    const gross = Number(monthlyGross) || 0;
    const basic = Number(basicSalary) || 0;
    const nonSpecial = allowances.filter(
      (a) => a.name.trim().toLowerCase() !== "special allowance"
    );
    const nonSpecialSum = nonSpecial.reduce(
      (acc, a) => acc + (a.amount || 0),
      0
    );
    const remainder = Math.max(0, gross - basic - nonSpecialSum);

    setAllowances([
      ...nonSpecial,
      { name: "Special Allowance", amount: remainder },
    ]);
  };

  // Real-time component reconciliation
  const grossNum = Number(monthlyGross) || 0;
  const basicNum = Number(basicSalary) || 0;
  const allowancesTotal = allowances.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0
  );
  const totalComponents = basicNum + allowancesTotal;
  const diff = grossNum - totalComponents;
  const isBalanced = grossNum > 0 && Math.abs(diff) < 0.01;

  const activeEmployees = useMemo(() => {
    return employees?.filter((e) => e.status === "active") || [];
  }, [employees]);

  const filtered = activeEmployees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const getGrossSalary = (empId: string) => {
    if (!currentSalaries) return "—";
    const salary = currentSalaries.find((s) => s.employeeId === empId);
    return salary
      ? `₹${salary.grossSalary.toLocaleString("en-IN")}`
      : "Not Set";
  };

  const handleManage = (emp: {
    _id: string;
    firstName: string;
    lastName: string;
  }) => {
    setSelectedEmployee(emp);
    const today = new Date().toISOString().split("T")[0] || "";
    setEffectiveDate(today);

    // Pre-fill if exists
    const existing = currentSalaries?.find((s) => s.employeeId === emp._id);
    if (existing) {
      const computedGross =
        existing.grossSalary ??
        (existing.basicSalary || 0) +
          (existing.allowances || []).reduce(
            (acc, a) => acc + (a.amount || 0),
            0
          );
      setMonthlyGross(computedGross > 0 ? computedGross.toString() : "");
      setBasicSalary(existing.basicSalary?.toString() ?? "");
      setAllowances(
        existing.allowances ? existing.allowances.map((a) => ({ ...a })) : []
      );
      setDeductions(
        existing.deductions ? existing.deductions.map((d) => ({ ...d })) : []
      );
    } else {
      setMonthlyGross("");
      setBasicSalary("");
      setAllowances([]);
      setDeductions([]);
    }
  };

  // Automatically open manage modal if targetEmployeeId is passed via query params
  useEffect(() => {
    if (targetEmployeeId && activeEmployees.length > 0 && !selectedEmployee) {
      const target = activeEmployees.find((e) => e._id === targetEmployeeId);
      if (target) {
        handleManage(target);
      }
    }
  }, [targetEmployeeId, activeEmployees, selectedEmployee, currentSalaries]);

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !selectedEmployee) return;

    if (grossNum <= 0) {
      toast.error("Please enter a valid positive Monthly Gross Salary");
      return;
    }

    if (!isBalanced) {
      toast.error(
        `Components total (₹${totalComponents.toLocaleString("en-IN")}) does not match Monthly Gross Salary (₹${grossNum.toLocaleString("en-IN")})`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addSalary({
        workspaceId,
        employeeId: selectedEmployee._id as Id<"employees">,
        grossSalary: grossNum,
        basicSalary: basicNum,
        allowances,
        deductions,
        effectiveDate: new Date(effectiveDate).getTime(),
      });
      toast.success("Salary structure updated");
      setSelectedEmployee(null);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to save salary");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary">
              Salary Management
            </h1>
            <p className="text-sm text-primary/60">
              Manage basic salary, allowances, and deductions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search active employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Current Gross</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {!employees || !currentSalaries ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No active employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp._id}
                    className="group transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium text-primary">
                      {emp.firstName} {emp.lastName}
                      <div className="text-xs font-normal text-muted-foreground">
                        {emp.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary/70">
                      {emp.designation || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {getGrossSalary(emp._id)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleManage(emp)}
                      >
                        <IndianRupee className="mr-2 h-4 w-4" /> Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Dialog
          open={!!selectedEmployee}
          onOpenChange={(open) => !open && setSelectedEmployee(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Salary Structure for {selectedEmployee?.firstName}{" "}
                {selectedEmployee?.lastName}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSalary} className="space-y-6 pt-4">
              {/* Monthly Gross Salary & Effective Date */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Monthly Gross Salary
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={monthlyGross}
                      onChange={(e) => handleGrossChange(e.target.value)}
                      placeholder="e.g. 50000"
                      className="text-base font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total monthly salary budget for the employee.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Effective Date</label>
                    <Input
                      type="date"
                      required
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Date from which this structure takes effect.
                    </p>
                  </div>
                </div>

                {grossNum > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
                    <span className="text-muted-foreground">
                      Standard Policy: Basic 50% | HRA 20% | Special 30%
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => apply502030Distribution(grossNum)}
                    >
                      <Wand2 className="mr-1.5 h-3 w-3" /> Auto-Distribute (50/20/30)
                    </Button>
                  </div>
                )}
              </div>

              {/* Salary Components Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-primary">
                      Salary Components (Gross Breakdown)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Basic is a core component. The sum of Basic and all allowances must equal the entered Monthly Gross Salary.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAllowances([...allowances, { name: "", amount: 0 }])
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Component
                  </Button>
                </div>

                {/* Core Component: Basic */}
                <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                  <div className="w-1/2">
                    <div className="text-xs font-semibold text-primary">Basic Salary</div>
                    <div className="text-[11px] text-muted-foreground">
                      Core statutory component (50% standard)
                    </div>
                  </div>
                  <div className="w-1/2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Basic Amount"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Allowances List */}
                <div className="space-y-2">
                  {allowances.map((item, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: form builder array
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Component Name (e.g. HRA, Special Allowance)"
                        value={item.name}
                        onChange={(e) => {
                          const newArr = [...allowances];
                          if (newArr[idx]) {
                            newArr[idx].name = e.target.value;
                          }
                          setAllowances(newArr);
                        }}
                        required
                        className="w-1/2"
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={item.amount || ""}
                        onChange={(e) => {
                          const newArr = [...allowances];
                          if (newArr[idx]) {
                            newArr[idx].amount = Number(e.target.value);
                          }
                          setAllowances(newArr);
                        }}
                        required
                        className="w-1/2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setAllowances(allowances.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Reconciliation Meter */}
              {grossNum > 0 && (
                <div
                  className={`rounded-lg border p-3 text-xs ${
                    isBalanced
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      )}
                      <span className="font-semibold">
                        {isBalanced
                          ? "Reconciliation: Balanced (100% Allocated)"
                          : `Reconciliation Mismatch: ₹${Math.abs(diff).toLocaleString("en-IN")} ${diff > 0 ? "Unallocated" : "Overallocated"}`}
                      </span>
                    </div>
                    {!isBalanced && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs bg-background"
                        onClick={handleRebalanceSpecialAllowance}
                      >
                        Balance into Special Allowance
                      </Button>
                    )}
                  </div>
                  <div className="mt-1 flex gap-4 text-[11px] opacity-90">
                    <span>Budgeted Gross: ₹{grossNum.toLocaleString("en-IN")}</span>
                    <span>Components Total: ₹{totalComponents.toLocaleString("en-IN")}</span>
                    <span>Difference: ₹{diff.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              {/* Other / Voluntary Deductions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold">Other / Voluntary Deductions</label>
                    <p className="text-xs text-muted-foreground">
                      Statutory deductions (PF, ESI, PT) are computed automatically during payroll runs.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDeductions([...deductions, { name: "", amount: 0 }])
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
                {deductions.map((item, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: form builder array
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Name (e.g. Voluntary Advance)"
                      value={item.name}
                      onChange={(e) => {
                        const newArr = [...deductions];
                        if (newArr[idx]) {
                          newArr[idx].name = e.target.value;
                        }
                        setDeductions(newArr);
                      }}
                      required
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) => {
                        const newArr = [...deductions];
                        if (newArr[idx]) {
                          newArr[idx].amount = Number(e.target.value);
                        }
                        setDeductions(newArr);
                      }}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDeductions(deductions.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Monthly Gross: </span>
                  <span className="font-semibold text-primary">
                    ₹{grossNum.toLocaleString("en-IN")}
                  </span>
                  {isBalanced && (
                    <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      (Components Validated)
                    </span>
                  )}
                </div>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isBalanced || grossNum <= 0}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Salary Structure
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
