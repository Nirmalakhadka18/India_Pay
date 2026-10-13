"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useQuery } from "convex/react";
import { Loader2, Download, Printer, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PayslipModal } from "@/components/payslip-modal";

export default function ReportsPage() {
  const { current } = useWorkspace();
  const workspaceId = current;

  const runs = useQuery(api.payroll.listRuns, workspaceId ? { workspaceId } : "skip");

  const [selectedRunId, setSelectedRunId] = useState<Id<"payrollRuns"> | null>(null);
  const runDetails = useQuery(
    api.payroll.getRunDetails,
    workspaceId && selectedRunId ? { workspaceId, payrollRunId: selectedRunId } : "skip"
  );

  const [payslipEmployeeId, setPayslipEmployeeId] = useState<Id<"employees"> | null>(null);
  
  const payslipData = useQuery(
    api.payroll.getPayslip,
    workspaceId && selectedRunId && payslipEmployeeId 
      ? { workspaceId, payrollRunId: selectedRunId, employeeId: payslipEmployeeId } 
      : "skip"
  );

  const handleExportCSV = () => {
    if (!runDetails) return;
    const { run, items } = runDetails;

    const headers = [
      "Employee",
      "Email",
      "Department",
      "Basic Salary",
      "Gross Salary",
      "LOP Days",
      "LOP Deduction",
      "Statutory Deductions",
      "Custom Deductions",
      "Total Deductions",
      "Net Salary",
      "Employer Contributions",
    ];

    const rows = items.map((i: typeof items[0]) => [
      i.employeeName,
      i.email,
      i.department,
      i.basicSalary,
      i.grossSalary,
      i.lopDays,
      i.lopDeduction,
      i.totalStatutoryDeductions,
      i.totalCustomDeductions,
      i.totalDeductions,
      i.netSalary,
      i.totalEmployerContributions || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map((cell: string | number) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_report_${run.periodMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full w-full flex-col bg-secondary px-6 py-8 dark:bg-black overflow-y-auto">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        <div>
          <h1 className="text-xl font-medium text-primary">Reports & Payroll History</h1>
          <p className="text-sm text-primary/60">
            View historical payroll runs, export CSVs, and generate payslips.
          </p>
        </div>

        {!selectedRunId ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <h2 className="font-medium text-sm">Payroll History</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Employees</th>
                  <th className="px-4 py-3 font-medium">Total Gross</th>
                  <th className="px-4 py-3 font-medium text-red-500">Deductions</th>
                  <th className="px-4 py-3 font-medium text-emerald-500">Total Net</th>
                  <th className="px-4 py-3 font-medium text-indigo-500">Employer Contr.</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {!runs ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No payroll runs found.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run._id} className="group transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-primary">
                        <div>{run.periodMonth}</div>
                        {run.finalizedAt && (
                          <div className="text-xs text-muted-foreground font-normal">
                            Finalized: {new Date(run.finalizedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-primary/70 uppercase text-xs font-semibold">
                        {run.status.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-primary/70">{run.totalEmployees}</td>
                      <td className="px-4 py-3 text-primary/70">₹{run.totalGrossSalary.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-red-500/80">₹{(run.totalLopDeduction + run.totalCustomDeductions + run.totalStatutoryDeductions).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 font-medium text-emerald-500">₹{run.totalNetSalary.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-indigo-500/80">₹{(run.totalEmployerContributions || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedRunId(run._id)}>
                          View Details <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedRunId(null)}>
                ← Back to History
              </Button>
              {!runDetails ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center justify-between flex-1">
                  <h2 className="text-lg font-medium">Payroll Summary: {runDetails.run.periodMonth}</h2>
                  <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              )}
            </div>

            {runDetails && (
              <>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="mt-1 text-2xl font-semibold">{runDetails.run.totalEmployees}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Gross</p>
                    <p className="mt-1 text-2xl font-semibold">₹{runDetails.run.totalGrossSalary.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Deductions</p>
                    <p className="mt-1 text-2xl font-semibold text-red-500">₹{(runDetails.run.totalLopDeduction + runDetails.run.totalCustomDeductions + runDetails.run.totalStatutoryDeductions).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Net Salary</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-500">₹{runDetails.run.totalNetSalary.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Employer Contr.</p>
                    <p className="mt-1 text-2xl font-semibold text-indigo-500">₹{(runDetails.run.totalEmployerContributions || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {runDetails.run.status !== "processed" && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> Payslips can only be generated for finalized payroll runs. The current status is <strong>{runDetails.run.status.replace("_", " ")}</strong>.
                  </div>
                )}

                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 font-medium text-right">Basic</th>
                        <th className="px-4 py-3 font-medium text-right">Gross</th>
                        <th className="px-4 py-3 font-medium text-right">LOP Ded.</th>
                        <th className="px-4 py-3 font-medium text-right">Net Salary</th>
                        <th className="px-4 py-3 font-medium text-center">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {runDetails.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            No employee data found for this run.
                          </td>
                        </tr>
                      ) : (
                        runDetails.items.map((item: typeof runDetails.items[0]) => (
                          <tr key={item._id} className="group transition-colors hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-primary">{item.employeeName}</div>
                              <div className="text-xs text-muted-foreground">{item.department}</div>
                            </td>
                            <td className="px-4 py-3 text-right">₹{item.basicSalary.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-right">₹{item.grossSalary.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-right text-red-500">₹{item.lopDeduction.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-right font-medium text-green-500">₹{item.netSalary.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-center">
                              {runDetails.run.status === "processed" ? (
                                <Button variant="ghost" size="icon" onClick={() => setPayslipEmployeeId(item.employeeId)}>
                                  <FileText className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">Locked</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        <PayslipModal
          open={Boolean(payslipEmployeeId)}
          onOpenChange={(open) => !open && setPayslipEmployeeId(null)}
          payslip={payslipData}
          isLoading={payslipEmployeeId !== null && !payslipData}
        />
      </div>
    </div>
  );
}
