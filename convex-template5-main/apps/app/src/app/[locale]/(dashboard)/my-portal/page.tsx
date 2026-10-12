"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useState } from "react";
import {
  FileText,
  UserCircle,
  CalendarClock,
  Printer,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@v1/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@v1/ui/dialog";

import { format } from "date-fns";

export default function MyPortal() {
  const { current } = useWorkspace();
  const workspaceId = current;
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const payslips = useQuery(api.payroll.getMyPayslips, scoped);
  const myLeaves = useQuery(api.leaves.getMyLeaves, scoped);
  const myAttendance = useQuery(api.attendance.getMyAttendance, workspaceId ? { workspaceId, periodMonth: format(new Date(), "yyyy-MM") } : "skip");
  const linkMyAccount = useMutation(api.employees.linkMyAccount);
  const submitMyLeave = useMutation(api.leaves.submitMyLeave);

  const [linkState, setLinkState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [linkError, setLinkError] = useState("");
  const [selectedPayslipRunId, setSelectedPayslipRunId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "leaves" | "attendance">("profile");

  // Leave Form State
  const [leaveType, setLeaveType] = useState("sick");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const payslipData = useQuery(
    api.payroll.getPayslip,
    workspaceId && selectedPayslipRunId && me
      ? { workspaceId, payrollRunId: selectedPayslipRunId as Id<"payrollRuns">, employeeId: me._id }
      : "skip"
  );

  const handleLink = async () => {
    if (!workspaceId) return;
    setLinkState("loading");
    setLinkError("");
    try {
      await linkMyAccount({ workspaceId });
      setLinkState("success");
    } catch (e) {
      setLinkState("error");
      setLinkError((e as Error).message || "Failed to link account");
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !leaveStart || !leaveEnd) return;
    setIsSubmittingLeave(true);
    try {
      await submitMyLeave({
        workspaceId,
        leaveType: leaveType as "sick" | "casual" | "earned" | "unpaid",
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason,
      });
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
      alert("Leave request submitted successfully.");
    } catch (err) {
      alert(`Failed to submit leave: ${(err as Error).message}`);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!workspaceId) {
    return <div className="p-8">Select a workspace.</div>;
  }

  if (me === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (me === null) {
    return (
      <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
        <div className="mx-auto w-full max-w-screen-md space-y-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your user account is not currently linked to an employee record in this workspace. Please link your account to view your payroll and profile information.
            </p>
            {linkState === "error" && (
              <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive text-left space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" /> 
                  <span>{linkError.replace("ConvexError: ", "")}</span>
                </div>
                {linkError.includes("No employee record found") && (
                  <p className="pl-6 text-destructive/80 text-xs mt-2">
                    Action required: Please ask your workspace administrator to go to the Employees tab and update your employee record email to match your current login email, or have them manually link your account.
                  </p>
                )}
              </div>
            )}
            {linkState === "success" ? (
              <div className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Successfully linked! Refreshing...
              </div>
            ) : (
              <Button onClick={handleLink} disabled={linkState === "loading"}>
                {linkState === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link My Account
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">My Portal</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal profile, leaves, attendance, and view your payslips securely.
          </p>
        </div>

        <div className="flex space-x-1 rounded-lg bg-muted p-1 w-full max-w-lg mb-4">
          <button
            type="button"
            className={`w-full rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "profile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile & Payslips
          </button>
          <button
            type="button"
            className={`w-full rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "leaves" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"}`}
            onClick={() => setActiveTab("leaves")}
          >
            Leave Requests
          </button>
          <button
            type="button"
            className={`w-full rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "attendance" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"}`}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
        </div>
          
        {activeTab === "profile" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="col-span-1 rounded-lg border border-border bg-card p-6 h-fit">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                  {me.firstName[0]}{me.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{me.firstName} {me.lastName}</h2>
                  <p className="text-sm text-muted-foreground">{me.designation || "Employee"}</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Department</p>
                  <p className="font-medium">{me.department || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Work Email</p>
                  <p className="font-medium">{me.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-medium">{me.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
                  <p className="font-medium capitalize text-emerald-500">{me.status}</p>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-6">
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary/50" /> My Payslips
                  </h3>
                </div>
                {payslips === undefined ? (
                  <div className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                ) : payslips.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No finalized payslips available.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 font-medium">Period</th>
                        <th className="px-6 py-3 font-medium">Date Finalized</th>
                        <th className="px-6 py-3 font-medium text-emerald-500">Net Salary</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {payslips.map((p) => (
                        <tr key={p._id} className="group hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-primary">{p.periodMonth}</td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {p.finalizedAt ? new Date(p.finalizedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-3 font-medium text-emerald-500">
                            ₹{p.netSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Button variant="secondary" size="sm" onClick={() => setSelectedPayslipRunId(p.payrollRunId)}>
                              View <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary/50" /> Request Leave
                </h3>
              </div>
              <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="earned">Earned Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <textarea
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Brief description of the leave..."
                  />
                </div>
                <Button type="submit" disabled={isSubmittingLeave} className="w-full">
                  {isSubmittingLeave ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </form>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/50" /> Past Requests
                </h3>
              </div>
              <div className="p-0">
                {myLeaves === undefined ? (
                  <div className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                ) : myLeaves.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No leave requests found.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 font-medium">Dates</th>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {myLeaves.map((l) => (
                        <tr key={l._id} className="group hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-medium text-primary">{l.startDate}</div>
                            <div className="text-xs text-muted-foreground">to {l.endDate}</div>
                          </td>
                          <td className="px-6 py-3 capitalize text-muted-foreground">{l.leaveType}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                              l.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>
                              {l.status}
                            </span>
                            {l.status === 'rejected' && l.reviewRemarks && (
                              <div className="text-xs text-red-500/70 mt-1">{l.reviewRemarks}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="grid gap-6">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary/50" /> My Attendance (Current Month)
                </h3>
              </div>
              <div className="p-0">
                {myAttendance === undefined ? (
                  <div className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                ) : myAttendance.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No attendance records for the current month.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Check-In / Out</th>
                        <th className="px-6 py-3 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {myAttendance.map((a) => (
                        <tr key={a._id} className="group hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-primary">{a.date}</td>
                          <td className="px-6 py-3 capitalize">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              a.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' :
                              a.status === 'absent' ? 'bg-red-500/10 text-red-500' :
                              a.status === 'half_day' ? 'bg-amber-500/10 text-amber-500' :
                              (a.status === 'paid_leave' || a.status === 'unpaid_leave') ? 'bg-blue-500/10 text-blue-500' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {a.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {a.checkInTime || "—"} {a.checkOutTime && `to ${a.checkOutTime}`}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {a.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        <Dialog open={!!selectedPayslipRunId} onOpenChange={(open) => !open && setSelectedPayslipRunId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Payslip Preview</DialogTitle>
                <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
              </div>
            </DialogHeader>
            {!payslipData ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="p-6 bg-white text-black print:p-0 print:bg-transparent rounded-lg border my-4 payslip-print-area">
                <div className="text-center mb-6 border-b pb-4">
                  <h1 className="text-2xl font-bold uppercase tracking-wider">{payslipData.workspaceName}</h1>
                  <h2 className="text-lg font-medium text-gray-700 uppercase mt-1 tracking-wide">Payslip</h2>
                  <p className="text-sm text-gray-500 mt-1">Period: {payslipData.periodMonth}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                  <div>
                    <p className="text-gray-500">Employee Name:</p>
                    <p className="font-semibold">{payslipData.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department:</p>
                    <p className="font-semibold">{payslipData.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Designation:</p>
                    <p className="font-semibold">{payslipData.designation}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">LOP Days:</p>
                    <p className="font-semibold">{payslipData.lopDays}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <h3 className="font-bold border-b pb-2 mb-3 bg-gray-50 px-2 py-1">Earnings</h3>
                    <div className="flex justify-between py-1 px-2">
                      <span>Basic Salary</span>
                      <span>₹{payslipData.basicSalary.toLocaleString("en-IN")}</span>
                    </div>
                    {payslipData.allowances.map((a: { name: string; amount: number }) => (
                      <div key={a.name} className="flex justify-between py-1 px-2">
                        <span>{a.name}</span>
                        <span>₹{a.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 px-2 mt-2 border-t font-semibold">
                      <span>Gross Earnings</span>
                      <span>₹{payslipData.grossSalary.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold border-b pb-2 mb-3 bg-gray-50 px-2 py-1">Deductions</h3>
                    {payslipData.lopDeduction > 0 && (
                      <div className="flex justify-between py-1 px-2">
                        <span>Loss of Pay</span>
                        <span>₹{payslipData.lopDeduction.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {payslipData.customDeductions.map((d: { name: string; amount: number }) => (
                      <div key={d.name} className="flex justify-between py-1 px-2">
                        <span>{d.name}</span>
                        <span>₹{d.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    {payslipData.statutoryDeductions.map((d: { name: string; amount: number }) => d.amount > 0 && (
                      <div key={d.name} className="flex justify-between py-1 px-2">
                        <span>{d.name}</span>
                        <span>₹{d.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 px-2 mt-2 border-t font-semibold">
                      <span>Total Deductions</span>
                      <span>₹{payslipData.totalDeductions.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t-2 border-gray-800 pt-4 text-right">
                  <p className="text-lg">Net Salary Payable: <span className="font-bold text-xl ml-4">₹{payslipData.netSalary.toLocaleString("en-IN")}</span></p>
                </div>

                {(payslipData.totalEmployerContributions || 0) > 0 && (
                  <div className="mt-8 pt-4 border-t border-dashed">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Informational: Employer Contributions</h3>
                    <p className="text-xs text-gray-400 mb-4">
                      These amounts were contributed directly by the employer to your statutory accounts. They are not deducted from your gross salary.
                    </p>
                    <div className="grid grid-cols-2 gap-8 text-sm opacity-80">
                      <div>
                        {payslipData.employerContributions?.map((c: { name: string; amount: number }) => c.amount > 0 && (
                          <div key={c.name} className="flex justify-between py-1 px-2">
                            <span>{c.name}</span>
                            <span>₹{c.amount.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-end">
                        <div className="flex justify-between py-2 px-2 border-t w-full font-semibold">
                          <span>Total Employer Contributions</span>
                          <span>₹{(payslipData.totalEmployerContributions || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
