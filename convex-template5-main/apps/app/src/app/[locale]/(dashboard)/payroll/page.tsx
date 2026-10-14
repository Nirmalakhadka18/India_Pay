"use client";

import { PayslipModal } from "@/components/payslip-modal";
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
  AlertTriangle,
  Banknote,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Plus,
  Receipt,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PayrollPage() {
  return (
    <RoleGuard allowedRoles={["owner", "admin"]}>
      <PayrollContent />
    </RoleGuard>
  );
}

function PayrollContent() {
  const { current, workspaces } = useWorkspace();
  const workspaceId = current;
  const currentWorkspace = workspaces.find((w) => w._id === current);
  const isOwner = currentWorkspace?.role === "owner";

  // Selected period month (YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [periodMonth, setPeriodMonth] = useState(currentMonthStr);
  const [selectedRunId, setSelectedRunId] = useState<Id<"payrollRuns"> | null>(
    null,
  );
  const [payslipEmployeeId, setPayslipEmployeeId] =
    useState<Id<"employees"> | null>(null);

  // Queries
  const preview = useQuery(
    api.payroll.calculatePreview,
    workspaceId && periodMonth ? { workspaceId, periodMonth } : "skip",
  );
  const payslipData = useQuery(
    api.payroll.getPayslip,
    workspaceId && selectedRunId && payslipEmployeeId
      ? {
          workspaceId,
          payrollRunId: selectedRunId,
          employeeId: payslipEmployeeId,
        }
      : "skip",
  );
  const runsList = useQuery(
    api.payroll.listRuns,
    workspaceId ? { workspaceId } : "skip",
  );
  const runDetails = useQuery(
    api.payroll.getRunDetails,
    workspaceId && selectedRunId
      ? { workspaceId, payrollRunId: selectedRunId }
      : "skip",
  );

  // Mutation
  const createPayrollRun = useMutation(api.payroll.createRun);
  const submitForApproval = useMutation(api.payroll.submitForApproval);
  const approveRun = useMutation(api.payroll.approveRun);
  const rejectRun = useMutation(api.payroll.rejectRun);
  const finalizeRun = useMutation(api.payroll.finalizeRun);

  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  const handleCreateRun = async () => {
    if (!workspaceId || !periodMonth) return;
    setIsProcessing(true);
    try {
      const runId = await createPayrollRun({
        workspaceId,
        periodMonth,
      });
      toast.success(`Payroll run for ${periodMonth} generated successfully`);
      setSelectedRunId(runId);
      setIsPreviewOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create payroll run");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (
    action: () => Promise<unknown>,
    successMsg: string,
  ) => {
    setIsProcessing(true);
    try {
      await action();
      toast.success(successMsg);
      setIsRejectDialogOpen(false);
      setIsFinalizeDialogOpen(false);
      setRejectionReason("");
    } catch (err: unknown) {
      const msg = (err as Error).message || "";
      if (
        msg.includes("Forbidden") ||
        msg.toLowerCase().includes("forbidden")
      ) {
        toast.error(
          "Forbidden: Only workspace Owners can approve or reject payroll runs.",
        );
      } else {
        toast.error(msg || "Operation failed");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const activeRun = runsList?.find((r) => r.periodMonth === periodMonth);

  return (
    <div className="flex h-full w-full flex-col bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary">
              Payroll Processing Engine
            </h1>
            <p className="text-sm text-primary/60">
              Calculate earnings, attendance LOP deductions, custom allowances,
              and statutory rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary/60">
                Period Month:
              </span>
              <Input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="w-44"
              />
            </div>

            <Button
              size="sm"
              disabled={!preview || Boolean(activeRun)}
              onClick={() => setIsPreviewOpen(true)}
              className="gap-2"
            >
              <Calculator className="h-4 w-4" /> Calculate & Preview
            </Button>
          </div>
        </div>

        {/* Existing Run Banner */}
        {activeRun && (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">
                    Payroll Run for {periodMonth} is{" "}
                    <span className="uppercase font-bold">
                      {activeRun.status.replace("_", " ")}
                    </span>
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Total Net Payout: ₹
                    {activeRun.totalNetSalary.toLocaleString("en-IN")} across{" "}
                    {activeRun.totalEmployees} employees.
                  </p>
                  {activeRun.status === "calculated" &&
                    activeRun.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">
                        Last rejected reason: {activeRun.rejectionReason}
                      </p>
                    )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRunId(activeRun._id)}
                >
                  View Run Details
                </Button>

                {activeRun.status === "calculated" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleAction(
                        () =>
                          submitForApproval({
                            workspaceId: workspaceId!,
                            payrollRunId: activeRun._id,
                          }),
                        "Submitted for approval",
                      )
                    }
                    disabled={isProcessing}
                  >
                    Submit for Approval
                  </Button>
                )}

                {activeRun.status === "pending_approval" && (
                  <>
                    {isOwner ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setIsRejectDialogOpen(true)}
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            handleAction(
                              () =>
                                approveRun({
                                  workspaceId: workspaceId!,
                                  payrollRunId: activeRun._id,
                                }),
                              "Payroll approved",
                            )
                          }
                          disabled={isProcessing}
                        >
                          Approve
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                          Awaiting Owner Approval (Owner Only)
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled
                          title="Only workspace Owners can reject payroll runs"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled
                          className="opacity-50"
                          title="Only workspace Owners can approve payroll runs"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {activeRun.status === "approved" && (
                  <Button
                    size="sm"
                    onClick={() => setIsFinalizeDialogOpen(true)}
                    disabled={isProcessing}
                  >
                    Finalize (Lock)
                  </Button>
                )}
              </div>
            </div>

            {/* Reject Dialog */}
            <Dialog
              open={isRejectDialogOpen}
              onOpenChange={setIsRejectDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Payroll</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm">
                    Please provide a reason for rejecting this payroll run.
                  </p>
                  <Input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., Missing LOP for John Doe"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRejectDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!rejectionReason || isProcessing}
                      onClick={() =>
                        handleAction(
                          () =>
                            rejectRun({
                              workspaceId: workspaceId!,
                              payrollRunId: activeRun._id,
                              reason: rejectionReason,
                            }),
                          "Payroll rejected",
                        )
                      }
                    >
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Finalize Dialog */}
            <Dialog
              open={isFinalizeDialogOpen}
              onOpenChange={setIsFinalizeDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalize Payroll</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> This action is
                    irreversible.
                  </p>
                  <p className="text-sm">
                    Finalizing the payroll will permanently lock the
                    calculations for {periodMonth}. You will not be able to
                    edit, delete, or recalculate this run later.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsFinalizeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground"
                      disabled={isProcessing}
                      onClick={() =>
                        handleAction(
                          () =>
                            finalizeRun({
                              workspaceId: workspaceId!,
                              payrollRunId: activeRun._id,
                            }),
                          "Payroll finalized!",
                        )
                      }
                    >
                      Confirm Finalize
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Calculation Summary KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-primary/60">
              Eligible Employees
            </p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {preview?.totalEmployees ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-primary/60">
              Total Gross Salary
            </p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              ₹{(preview?.totalGrossSalary ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Total LOP Deductions
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
              ₹{(preview?.totalLopDeduction ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Statutory Deductions
            </p>
            <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
              ₹
              {(preview?.totalStatutoryDeductions ?? 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-primary/40">
              Unconfigured (₹0)
            </span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Net Payable Amount
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              ₹{(preview?.totalNetSalary ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Live Calculation Preview Table */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-primary">
                Calculated Employee Payroll Preview ({periodMonth})
              </h2>
              <p className="text-xs text-primary/60">
                Integrates basic salary, allowances, attendance LOP deductions,
                and custom deductions.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-primary/60">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Basic (₹)</th>
                  <th className="px-4 py-3">Gross Salary (₹)</th>
                  <th className="px-4 py-3">LOP Deduction (₹)</th>
                  <th className="px-4 py-3">Custom Deductions (₹)</th>
                  <th className="px-4 py-3">Statutory (₹)</th>
                  <th className="px-4 py-3 text-right">Net Salary (₹)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview === undefined ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-primary/60"
                    >
                      Calculating payroll engine metrics...
                    </td>
                  </tr>
                ) : preview.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-primary/60"
                    >
                      No active employees found in workspace for this period.
                    </td>
                  </tr>
                ) : (
                  preview.items.map((item) => (
                    <tr key={item.employeeId} className="hover:bg-primary/5">
                      <td className="px-4 py-3 font-medium text-primary">
                        <div>
                          <p>{item.employeeName}</p>
                          <p className="text-xs text-primary/50 font-normal">
                            {item.department}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-primary/80">
                        ₹{item.basicSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        ₹{item.grossSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-400">
                        ₹{item.lopDeduction.toLocaleString("en-IN")} (
                        {item.lopDays} days)
                      </td>
                      <td className="px-4 py-3 text-primary/70">
                        ₹{item.totalCustomDeductions.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-primary/50 text-xs">
                        ₹0 (Not Configured)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{item.netSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!item.hasSalaryStructure ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" /> No
                            Structure
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historical Runs List */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium text-primary">
            Historical Payroll Runs
          </h2>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-primary/60">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Employees</th>
                  <th className="px-4 py-3">Total Gross (₹)</th>
                  <th className="px-4 py-3">LOP Deductions (₹)</th>
                  <th className="px-4 py-3">Total Net (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runsList === undefined ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-primary/60"
                    >
                      Loading historical runs...
                    </td>
                  </tr>
                ) : runsList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-primary/60"
                    >
                      No payroll runs created yet.
                    </td>
                  </tr>
                ) : (
                  runsList.map((run) => (
                    <tr key={run._id} className="hover:bg-primary/5">
                      <td className="px-4 py-3 font-medium text-primary">
                        {run.periodMonth}
                      </td>
                      <td className="px-4 py-3 text-primary/80">
                        {run.totalEmployees}
                      </td>
                      <td className="px-4 py-3 text-primary/80">
                        ₹{run.totalGrossSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-400">
                        ₹{run.totalLopDeduction.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{run.totalNetSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRunId(run._id)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Payroll Run Confirmation Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Payroll Run Generation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-primary/70">
                You are about to generate a payroll run record for{" "}
                <span className="font-semibold text-primary">
                  {periodMonth}
                </span>
                .
              </p>

              <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary/60">Employees:</span>
                  <span className="font-medium text-primary">
                    {preview?.totalEmployees}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary/60">Gross Salary:</span>
                  <span className="font-medium text-primary">
                    ₹{preview?.totalGrossSalary.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary/60">Total Net Payout:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{preview?.totalNetSalary.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Cancel
                </Button>
                <Button disabled={isProcessing} onClick={handleCreateRun}>
                  {isProcessing ? "Processing..." : "Create Payroll Run"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Selected Historical Run Details Dialog */}
        {selectedRunId && runDetails && (
          <Dialog
            open={Boolean(selectedRunId)}
            onOpenChange={() => setSelectedRunId(null)}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Payroll Run Details: {runDetails.run.periodMonth}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-4 gap-4 rounded-lg border border-border bg-secondary/30 p-3 text-xs">
                  <div>
                    <span className="text-primary/60 block">Status</span>
                    <span className="font-medium capitalize text-primary">
                      {runDetails.run.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-primary/60 block">Employees</span>
                    <span className="font-medium text-primary">
                      {runDetails.run.totalEmployees}
                    </span>
                  </div>
                  <div>
                    <span className="text-primary/60 block">Gross Total</span>
                    <span className="font-medium text-primary">
                      ₹{runDetails.run.totalGrossSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-primary/60 block">Net Total</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{runDetails.run.totalNetSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-secondary/50 uppercase text-primary/60">
                      <tr>
                        <th className="px-3 py-2">Employee</th>
                        <th className="px-3 py-2">Basic (₹)</th>
                        <th className="px-3 py-2">Gross (₹)</th>
                        <th className="px-3 py-2">LOP (₹)</th>
                        <th className="px-3 py-2 text-right">Net (₹)</th>
                        <th className="px-3 py-2 text-right">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {runDetails.items.map((item) => (
                        <tr key={item._id}>
                          <td className="px-3 py-2 font-medium text-primary">
                            {item.employeeName}
                          </td>
                          <td className="px-3 py-2 text-primary/80">
                            ₹{item.basicSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-primary/80">
                            ₹{item.grossSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-amber-600 dark:text-amber-400">
                            ₹{item.lopDeduction.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            ₹{item.netSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {runDetails.run.status === "processed" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] gap-1 px-2"
                                onClick={() =>
                                  setPayslipEmployeeId(item.employeeId)
                                }
                              >
                                <FileText className="h-3 w-3" /> PDF
                              </Button>
                            ) : (
                              <span className="text-primary/40 text-[10px]">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Payslip PDF Modal */}
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
