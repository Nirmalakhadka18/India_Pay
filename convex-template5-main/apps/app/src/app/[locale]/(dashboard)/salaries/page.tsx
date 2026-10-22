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
import { IndianRupee, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function SalariesPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <SalariesContent />
    </RoleGuard>
  );
}

function SalariesContent() {
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
  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState<
    { name: string; amount: number }[]
  >([]);
  const [deductions, setDeductions] = useState<
    { name: string; amount: number }[]
  >([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setBasicSalary(existing.basicSalary?.toString() ?? "");
      setAllowances(existing.allowances || []);
      setDeductions(existing.deductions || []);
    } else {
      setBasicSalary("");
      setAllowances([]);
      setDeductions([]);
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !selectedEmployee) return;

    setIsSubmitting(true);
    try {
      await addSalary({
        workspaceId,
        employeeId: selectedEmployee._id as Id<"employees">,
        basicSalary: Number(basicSalary) || 0,
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Basic Salary</label>
                  <Input
                    type="number"
                    required
                    min="0"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Effective Date</label>
                  <Input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Allowances</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAllowances([...allowances, { name: "", amount: 0 }])
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
                {allowances.map((item, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: form builder array
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Name (e.g. HRA)"
                      value={item.name}
                      onChange={(e) => {
                        const newArr = [...allowances];
                        if (newArr[idx]) {
                          newArr[idx].name = e.target.value;
                        }
                        setAllowances(newArr);
                      }}
                      required
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Deductions</label>
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
                      placeholder="Name (e.g. Tax)"
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

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm font-medium">
                  Gross Salary: ₹
                  {(
                    (Number(basicSalary) || 0) +
                    allowances.reduce((acc, a) => acc + (a.amount || 0), 0)
                  ).toLocaleString("en-IN")}
                </div>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Salary
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
