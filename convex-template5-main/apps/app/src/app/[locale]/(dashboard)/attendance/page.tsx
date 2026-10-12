"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@v1/ui/dialog";
import { Input } from "@v1/ui/input";
import { useMutation, useQuery } from "convex/react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  FileCheck,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AttendancePage() {
  const { current } = useWorkspace();
  const workspaceId = current;

  // Active tab state: "attendance" | "leaves" | "lop"
  const [tab, setTab] = useState<"attendance" | "leaves" | "lop">("attendance");

  // Date filters for attendance
  const todayStr = new Date().toISOString().split("T")[0] as string;
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [search, setSearch] = useState("");

  // Queries
  const employees = useQuery(
    api.employees.list,
    workspaceId ? { workspaceId } : "skip"
  );
  const attendanceList = useQuery(
    api.attendance.list,
    workspaceId ? { workspaceId, startDate, endDate } : "skip"
  );
  const attendanceSummary = useQuery(
    api.attendance.summary,
    workspaceId && startDate && endDate ? { workspaceId, startDate, endDate } : "skip"
  );
  const leaveRequests = useQuery(
    api.leaves.list,
    workspaceId ? { workspaceId } : "skip"
  );
  const lopData = useQuery(
    api.lop.calculateLOP,
    workspaceId && startDate && endDate ? { workspaceId, startDate, endDate, daysInPeriod: 30 } : "skip"
  );
  const lopSettings = useQuery(
    api.lop.getSettings,
    workspaceId ? { workspaceId } : "skip"
  );

  // Mutations
  const markAttendance = useMutation(api.attendance.mark);
  const submitLeave = useMutation(api.leaves.submit);
  const reviewLeave = useMutation(api.leaves.review);
  const updateLopSettings = useMutation(api.lop.updateSettings);

  // Attendance Form state
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [attEmployeeId, setAttEmployeeId] = useState("");
  const [attDate, setAttDate] = useState<string>(todayStr);
  const [attStatus, setAttStatus] = useState<
    "present" | "absent" | "half_day" | "paid_leave" | "unpaid_leave"
  >("present");
  const [attCheckIn, setAttCheckIn] = useState("09:00");
  const [attCheckOut, setAttCheckOut] = useState("18:00");
  const [attRemarks, setAttRemarks] = useState("");
  const [isMarking, setIsMarking] = useState(false);

  // Leave Form state
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState("");
  const [leaveType, setLeaveType] = useState<
    "casual" | "sick" | "earned" | "unpaid"
  >("casual");
  const [leaveStart, setLeaveStart] = useState<string>(todayStr);
  const [leaveEnd, setLeaveEnd] = useState<string>(todayStr);
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // LOP Settings Form state
  const [calcBasis, setCalcBasis] = useState<
    "calendar_days" | "fixed_30_days" | "working_days"
  >("calendar_days");
  const [incUnpaid, setIncUnpaid] = useState(true);
  const [incAbsent, setIncAbsent] = useState(true);
  const [isSavingLop, setIsSavingLop] = useState(false);

  // Handlers
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !attEmployeeId) {
      toast.error("Please select an employee");
      return;
    }
    setIsMarking(true);
    try {
      await markAttendance({
        workspaceId,
        employeeId: attEmployeeId as Id<"employees">,
        date: attDate,
        status: attStatus,
        checkInTime: attCheckIn,
        checkOutTime: attCheckOut,
        remarks: attRemarks,
      });
      toast.success("Attendance marked successfully");
      setIsMarkOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to mark attendance");
    } finally {
      setIsMarking(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !leaveEmpId) {
      toast.error("Please select an employee");
      return;
    }
    setIsSubmittingLeave(true);
    try {
      await submitLeave({
        workspaceId,
        employeeId: leaveEmpId as Id<"employees">,
        leaveType,
        startDate: leaveStart,
        endDate: leaveEnd,
        daysCount: Number(leaveDays),
        reason: leaveReason,
      });
      toast.success("Leave request submitted");
      setIsLeaveOpen(false);
      setLeaveReason("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to submit leave request");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleReviewLeave = async (
    requestId: Id<"leaveRequests">,
    status: "approved" | "rejected"
  ) => {
    if (!workspaceId) return;
    try {
      await reviewLeave({
        workspaceId,
        requestId,
        status,
      });
      toast.success(`Leave request ${status}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || `Failed to ${status} leave`);
    }
  };

  const handleSaveLopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setIsSavingLop(true);
    try {
      await updateLopSettings({
        workspaceId,
        calculationBasis: calcBasis,
        includeUnpaidLeave: incUnpaid,
        includeAbsent: incAbsent,
        halfDayFactor: 0.5,
      });
      toast.success("LOP settings updated");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to save settings");
    } finally {
      setIsSavingLop(false);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees?.find((e) => e._id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const filteredAttendance = attendanceList?.filter((a) => {
    const name = getEmpName(a.employeeId).toLowerCase();
    return name.includes(search.toLowerCase()) || a.date.includes(search);
  });

  return (
    <div className="flex h-full w-full flex-col bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary">
              Attendance & Leave Management
            </h1>
            <p className="text-sm text-primary/60">
              Track employee attendance, manage leave requests, and calculate Loss of Pay (LOP).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tab === "attendance" && (
              <Dialog open={isMarkOpen} onOpenChange={setIsMarkOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Mark Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark / Update Attendance</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMarkAttendance} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employee</label>
                      <select
                        required
                        value={attEmployeeId}
                        onChange={(e) => setAttEmployeeId(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Employee</option>
                        {employees?.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                          type="date"
                          required
                          value={attDate}
                          onChange={(e) => setAttDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={attStatus}
                          onChange={(e) => setAttStatus(e.target.value as typeof attStatus)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                          <option value="paid_leave">Paid Leave</option>
                          <option value="unpaid_leave">Unpaid Leave</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Check-In</label>
                        <Input
                          type="time"
                          value={attCheckIn}
                          onChange={(e) => setAttCheckIn(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Check-Out</label>
                        <Input
                          type="time"
                          value={attCheckOut}
                          onChange={(e) => setAttCheckOut(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remarks</label>
                      <Input
                        placeholder="Optional note"
                        value={attRemarks}
                        onChange={(e) => setAttRemarks(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isMarking}
                      className="w-full"
                    >
                      {isMarking ? "Saving..." : "Save Record"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {tab === "leaves" && (
              <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Request Leave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Leave Request</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitLeave} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employee</label>
                      <select
                        required
                        value={leaveEmpId}
                        onChange={(e) => setLeaveEmpId(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select Employee</option>
                        {employees?.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Leave Type</label>
                        <select
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value as typeof leaveType)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="casual">Casual Leave</option>
                          <option value="sick">Sick Leave</option>
                          <option value="earned">Earned Leave</option>
                          <option value="unpaid">Unpaid Leave</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Days Count</label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          required
                          value={leaveDays}
                          onChange={(e) => setLeaveDays(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <Input
                          type="date"
                          required
                          value={leaveStart}
                          onChange={(e) => setLeaveStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <Input
                          type="date"
                          required
                          value={leaveEnd}
                          onChange={(e) => setLeaveEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason</label>
                      <Input
                        required
                        placeholder="Reason for leave"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingLeave}
                      className="w-full"
                    >
                      {isSubmittingLeave ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("attendance")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "attendance"
                ? "border-primary text-primary"
                : "border-transparent text-primary/60 hover:text-primary"
            }`}
          >
            Attendance Logs
          </button>
          <button
            type="button"
            onClick={() => setTab("leaves")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "leaves"
                ? "border-primary text-primary"
                : "border-transparent text-primary/60 hover:text-primary"
            }`}
          >
            Leave Requests
          </button>
          <button
            type="button"
            onClick={() => setTab("lop")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === "lop"
                ? "border-primary text-primary"
                : "border-transparent text-primary/60 hover:text-primary"
            }`}
          >
            Loss of Pay (LOP) Rules
          </button>
        </div>

        {/* Tab 1: ATTENDANCE LOGS */}
        {tab === "attendance" && (
          <div className="space-y-6">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-primary/60">Total Logs</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {attendanceSummary?.totalRecords ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Present
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {attendanceSummary?.present ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  Absent
                </p>
                <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
                  {attendanceSummary?.absent ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Half Day
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {attendanceSummary?.halfDay ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Leaves
                </p>
                <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {(attendanceSummary?.paidLeave ?? 0) +
                    (attendanceSummary?.unpaidLeave ?? 0)}
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                <Input
                  placeholder="Search by employee name or date..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary/60">From:</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary/60">To:</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-primary/60">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check-In / Out</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAttendance === undefined ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-primary/60">
                        Loading attendance logs...
                      </td>
                    </tr>
                  ) : filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-primary/60">
                        No attendance records found for selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => (
                      <tr key={record._id} className="hover:bg-primary/5">
                        <td className="px-4 py-3 font-medium text-primary">
                          {getEmpName(record.employeeId)}
                        </td>
                        <td className="px-4 py-3 text-primary/80">{record.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              record.status === "present"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : record.status === "absent"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : record.status === "half_day"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {record.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-primary/70">
                          {record.checkInTime || "--:--"} - {record.checkOutTime || "--:--"}
                        </td>
                        <td className="px-4 py-3 text-primary/60">
                          {record.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: LEAVE REQUESTS */}
        {tab === "leaves" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-primary/60">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaveRequests === undefined ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-primary/60">
                        Loading leave requests...
                      </td>
                    </tr>
                  ) : leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-primary/60">
                        No leave requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-primary/5">
                        <td className="px-4 py-3 font-medium text-primary">
                          {getEmpName(req.employeeId)}
                        </td>
                        <td className="px-4 py-3 capitalize text-primary/80">
                          {req.leaveType}
                        </td>
                        <td className="px-4 py-3 text-xs text-primary/70">
                          {req.startDate} to {req.endDate}
                        </td>
                        <td className="px-4 py-3 font-medium text-primary/80">
                          {req.daysCount}
                        </td>
                        <td className="px-4 py-3 text-primary/70 max-w-xs truncate">
                          {req.reason}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              req.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : req.status === "rejected"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : req.status === "pending"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400"
                                onClick={() => handleReviewLeave(req._id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 hover:bg-red-50 dark:text-red-400"
                                onClick={() => handleReviewLeave(req._id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: LOSS OF PAY (LOP) CALCULATIONS & SETTINGS */}
        {tab === "lop" && (
          <div className="space-y-6">
            {/* LOP Config Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-medium text-primary mb-2">
                Loss of Pay (LOP) Configuration
              </h2>
              <p className="text-sm text-primary/60 mb-4">
                Define how unpaid absences and leave affect employee salary calculations for this organization.
              </p>
              <form onSubmit={handleSaveLopSettings} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calculation Basis</label>
                  <select
                    value={calcBasis}
                    onChange={(e) => setCalcBasis(e.target.value as typeof calcBasis)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="calendar_days">
                      Actual Calendar Days in Month (Gross / Days in Month)
                    </option>
                    <option value="fixed_30_days">
                      Fixed 30 Days Standard Basis (Gross / 30)
                    </option>
                    <option value="working_days">
                      Working Days Basis (Excludes weekends)
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incUnpaid}
                      onChange={(e) => setIncUnpaid(e.target.checked)}
                      className="rounded border-border"
                    />
                    Include Unpaid Leave
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incAbsent}
                      onChange={(e) => setIncAbsent(e.target.checked)}
                      className="rounded border-border"
                    />
                    Include Marked Absences
                  </label>
                </div>

                <Button type="submit" size="sm" disabled={isSavingLop}>
                  {isSavingLop ? "Saving Settings..." : "Save LOP Configuration"}
                </Button>
              </form>
            </div>

            {/* LOP Projection Table */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium text-primary">
                    Calculated Loss of Pay (Period: {startDate} to {endDate})
                  </h3>
                  <p className="text-xs text-primary/60">
                    Calculated deduction amounts ready to be consumed by the payroll engine.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-primary/60">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Gross Salary (₹)</th>
                      <th className="px-4 py-3">LOP Days</th>
                      <th className="px-4 py-3">Estimated Daily Rate (₹)</th>
                      <th className="px-4 py-3 text-right">LOP Deduction (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lopData?.employeeSummary === undefined ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-primary/60">
                          Calculating LOP deductions...
                        </td>
                      </tr>
                    ) : lopData.employeeSummary.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-primary/60">
                          No employees configured for LOP calculations.
                        </td>
                      </tr>
                    ) : (
                      lopData.employeeSummary.map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-primary/5">
                          <td className="px-4 py-3 font-medium text-primary">
                            {emp.employeeName}
                          </td>
                          <td className="px-4 py-3 text-primary/80">
                            ₹{emp.grossSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                            {emp.lopDays} days
                          </td>
                          <td className="px-4 py-3 text-primary/70">
                            ₹{emp.dailyRate.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                            ₹{emp.deductionAmount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
