"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  Filter,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PayrollHeader } from "../payroll-header";

export default function LoansManagementPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "closed" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Modal Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEarlyRepayOpen, setIsEarlyRepayOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Form States for Loan Creation
  const [employeeId, setEmployeeId] = useState("");
  const [loanType, setLoanType] = useState("PERSONAL");
  const [purpose, setPurpose] = useState("");
  const [principalAmount, setPrincipalAmount] = useState<number>(50000);
  const [interestRatePercent, setInterestRatePercent] = useState<number>(0);
  const [tenureMonths, setTenureMonths] = useState<number>(6);
  const [notes, setNotes] = useState("");

  // Rejection & Repayment States
  const [rejectionReason, setRejectionReason] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState<number>(10000);
  const [repaymentNotes, setRepaymentNotes] = useState("");

  // Convex Queries
  const loans = useQuery(
    api.loans.listWorkspaceLoans,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId as any } : "skip"
  );

  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId as any } : "skip"
  );

  const selectedLoanDetails = useQuery(
    api.loans.getLoanDetails,
    effectiveWorkspaceId && selectedLoanId
      ? { workspaceId: effectiveWorkspaceId as any, loanId: selectedLoanId as any }
      : "skip"
  );

  // Schedule Preview Query
  const schedulePreview = useQuery(
    api.loans.previewLoanSchedule,
    principalAmount > 0 && tenureMonths > 0
      ? {
          principalAmount,
          interestRatePercent,
          tenureMonths,
          startMonth: "2026-12",
        }
      : "skip"
  );

  // Convex Mutations
  const createLoan = useMutation(api.loans.createLoanRecord);
  const reviewLoan = useMutation(api.loans.reviewLoanApplication);
  const disburseLoan = useMutation(api.loans.disburseLoan);
  const recordEarlyRepay = useMutation(api.loans.recordEarlyRepayment);
  const closeLoanManually = useMutation(api.loans.closeLoanManually);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    if (!loans) return [];
    return loans.filter((loan) => {
      if (activeTab === "active" && loan.status !== "ACTIVE" && loan.status !== "DISBURSED") return false;
      if (activeTab === "pending" && loan.status !== "PENDING" && loan.status !== "APPROVED") return false;
      if (activeTab === "closed" && loan.status !== "CLOSED" && loan.status !== "REJECTED") return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const empName = (loan.employeeName || "").toLowerCase();
        const code = (loan.employeeCode || "").toLowerCase();
        const type = loan.loanType.toLowerCase();
        return empName.includes(query) || code.includes(query) || type.includes(query);
      }
      return true;
    });
  }, [loans, activeTab, searchQuery]);

  // Handlers
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveWorkspaceId || !employeeId) return;

    try {
      await createLoan({
        workspaceId: effectiveWorkspaceId as any,
        employeeId: employeeId as any,
        loanType,
        purpose,
        principalAmount,
        interestRatePercent,
        tenureMonths,
        startDate: "2026-12",
        notes,
      });
      setIsCreateOpen(false);
      // Reset form
      setPurpose("");
      setNotes("");
    } catch (err: any) {
      alert("Failed to create loan: " + err.message);
    }
  };

  const handleApprove = async (loanId: string) => {
    if (!effectiveWorkspaceId) return;
    try {
      await reviewLoan({
        workspaceId: effectiveWorkspaceId as any,
        loanId: loanId as any,
        action: "APPROVE",
      });
    } catch (err: any) {
      alert("Approval error: " + err.message);
    }
  };

  const handleReject = async () => {
    if (!effectiveWorkspaceId || !selectedLoanId || !rejectionReason.trim()) return;
    try {
      await reviewLoan({
        workspaceId: effectiveWorkspaceId as any,
        loanId: selectedLoanId as any,
        action: "REJECT",
        reason: rejectionReason,
      });
      setIsRejectOpen(false);
      setRejectionReason("");
    } catch (err: any) {
      alert("Rejection error: " + err.message);
    }
  };

  const handleDisburse = async (loanId: string) => {
    if (!effectiveWorkspaceId) return;
    try {
      await disburseLoan({
        workspaceId: effectiveWorkspaceId as any,
        loanId: loanId as any,
      });
    } catch (err: any) {
      alert("Disbursement error: " + err.message);
    }
  };

  const handleEarlyRepay = async () => {
    if (!effectiveWorkspaceId || !selectedLoanId || repaymentAmount <= 0) return;
    try {
      await recordEarlyRepay({
        workspaceId: effectiveWorkspaceId as any,
        loanId: selectedLoanId as any,
        amount: repaymentAmount,
        notes: repaymentNotes,
      });
      setIsEarlyRepayOpen(false);
      setRepaymentNotes("");
    } catch (err: any) {
      alert("Repayment error: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F7F7F7] text-[#394657] font-sans antialiased text-[14px]">
      <PayrollHeader currentTab="inputs" currentSubTitle="Loans & Advances" />

      <main className="flex-1 w-full p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Loans</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {loans?.filter((l) => l.status === "ACTIVE").length || 0}
              </span>
              <span className="text-xs text-emerald-600 font-medium">In Repayment</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">
                {loans?.filter((l) => l.status === "PENDING").length || 0}
              </span>
              <span className="text-xs text-slate-500">Awaiting Admin Action</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Disbursed Balance</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                ₹{loans?.reduce((sum, l) => sum + (l.status === "ACTIVE" ? l.outstandingPrincipal : 0), 0).toLocaleString("en-IN") || 0}
              </span>
              <span className="text-xs text-slate-500">Outstanding Principal</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Recovered</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                ₹{loans?.reduce((sum, l) => sum + l.totalRepaid, 0).toLocaleString("en-IN") || 0}
              </span>
              <span className="text-xs text-emerald-600">Via Payroll Deductions</span>
            </div>
          </div>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E9F0] pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: "active", label: "Active Loans" },
              { id: "pending", label: "Pending Approvals" },
              { id: "closed", label: "Settled & Closed" },
              { id: "all", label: "All Records" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#3557CA] text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or loan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 rounded border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#3557CA] focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded bg-[#3E5ECC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2E4AA3] transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Employee Loan
            </button>
          </div>
        </div>

        {/* Main Loans Table */}
        <div className="rounded-lg border border-[#E4E9F0] bg-white p-6 shadow-xs space-y-4">
          <table className="w-full text-left text-xs text-[#394657] border-collapse">
            <thead>
              <tr className="border-b border-[#E4E9F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#5A6A7C]">
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-4 font-semibold">Loan Type</th>
                <th className="py-3 px-4 font-semibold">Principal</th>
                <th className="py-3 px-4 font-semibold">Rate & Tenure</th>
                <th className="py-3 px-4 font-semibold">Monthly EMI</th>
                <th className="py-3 px-4 font-semibold">Outstanding</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No loan records found in this view.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{loan.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{loan.employeeCode} • {loan.department}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {loan.loanType.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{loan.principalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {loan.interestRatePercent === 0 ? (
                        <span className="font-semibold text-emerald-600">0% (Interest-Free)</span>
                      ) : (
                        `${loan.interestRatePercent}% p.a.`
                      )}{" "}
                      • {loan.tenureMonths} Mo
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{loan.monthlyEmiAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      ₹{loan.outstandingPrincipal.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          loan.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : loan.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : loan.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : loan.status === "CLOSED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {loan.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(loan._id)}
                            className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLoanId(loan._id);
                              setIsRejectOpen(true);
                            }}
                            className="rounded bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {loan.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleDisburse(loan._id)}
                          className="rounded bg-[#0284C7] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0369A1] transition"
                        >
                          Disburse
                        </button>
                      )}

                      {loan.status === "ACTIVE" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoanId(loan._id);
                            setIsEarlyRepayOpen(true);
                          }}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Early Repay
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedLoanId(loan._id)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Loan Repayment Schedule & Ledger Drawer */}
        {selectedLoanDetails && (
          <div className="rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#BAE6FD] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Loan Amortization Schedule & Ledger: {selectedLoanDetails.loan.loanType}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Employee: {selectedLoanDetails.employee?.name} ({selectedLoanDetails.employee?.code}) • Principal: ₹
                  {selectedLoanDetails.loan.principalAmount.toLocaleString("en-IN")} • Outstanding: ₹
                  {selectedLoanDetails.loan.outstandingPrincipal.toLocaleString("en-IN")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLoanId(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close View
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amortization Projection */}
              <div className="bg-white rounded border border-[#E2E8F0] p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Standard Amortization Schedule
                </h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-[11px] text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 font-semibold text-slate-500">
                        <th className="py-1.5">Mo</th>
                        <th className="py-1.5">Period</th>
                        <th className="py-1.5">EMI</th>
                        <th className="py-1.5">Principal</th>
                        <th className="py-1.5">Interest</th>
                        <th className="py-1.5">Ending Bal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoanDetails.amortizationSchedule.map((row: any) => (
                        <tr key={row.installmentNumber}>
                          <td className="py-1">{row.installmentNumber}</td>
                          <td className="py-1 font-medium">{row.repaymentMonth}</td>
                          <td className="py-1 font-semibold">₹{row.emiAmount.toLocaleString("en-IN")}</td>
                          <td className="py-1">₹{row.principalComponent.toLocaleString("en-IN")}</td>
                          <td className="py-1">₹{row.interestComponent.toLocaleString("en-IN")}</td>
                          <td className="py-1 font-semibold">₹{row.endingBalance.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actual Deduction Ledger */}
              <div className="bg-white rounded border border-[#E2E8F0] p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Actual Payroll & Repayment Transactions
                </h4>
                {selectedLoanDetails.repayments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No repayments processed yet. Active deductions will post with monthly payroll runs.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-[11px] text-slate-700">
                      <thead>
                        <tr className="border-b border-slate-200 font-semibold text-slate-500">
                          <th className="py-1.5">#</th>
                          <th className="py-1.5">Month</th>
                          <th className="py-1.5">Deducted</th>
                          <th className="py-1.5">Principal</th>
                          <th className="py-1.5">Balance</th>
                          <th className="py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLoanDetails.repayments.map((rep: any) => (
                          <tr key={rep._id}>
                            <td className="py-1">{rep.installmentNumber}</td>
                            <td className="py-1 font-medium">{rep.repaymentMonth}</td>
                            <td className="py-1 font-bold text-emerald-700">₹{rep.totalDeducted.toLocaleString("en-IN")}</td>
                            <td className="py-1">₹{rep.principalPaid.toLocaleString("en-IN")}</td>
                            <td className="py-1 font-medium">₹{rep.outstandingBalanceAfter.toLocaleString("en-IN")}</td>
                            <td className="py-1">
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {rep.deductionStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Employee Loan */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">New Employee Loan & Advance</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Employee</label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 p-2 text-xs"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees?.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeIdNumber || "No ID"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Loan Type</label>
                    <select
                      value={loanType}
                      onChange={(e) => setLoanType(e.target.value)}
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    >
                      <option value="PERSONAL">Personal Loan</option>
                      <option value="SALARY_ADVANCE">Salary Advance</option>
                      <option value="EMERGENCY">Emergency Assistance</option>
                      <option value="EQUIPMENT">Equipment Purchase</option>
                      <option value="EDUCATION">Education Advance</option>
                      <option value="HOUSING">Housing Deposit Advance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Principal Amount (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                      required
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Annual Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={36}
                      step={0.5}
                      value={interestRatePercent}
                      onChange={(e) => setInterestRatePercent(Number(e.target.value))}
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">Set 0 for interest-free salary advance</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tenure (Months)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      required
                      className="w-full rounded border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>

                {/* Calculation Preview */}
                {schedulePreview && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-3 text-blue-900">
                    <div className="flex justify-between items-center font-bold">
                      <span>Calculated Monthly EMI:</span>
                      <span className="text-sm">₹{schedulePreview.monthlyEmiAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-blue-700 mt-1">
                      <span>Total Interest Payable:</span>
                      <span>₹{schedulePreview.totalInterestPayable.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purpose / Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Medical emergency or home renovation"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-[#3E5ECC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2E4AA3]"
                  >
                    Create Loan Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Early Repayment */}
        {isEarlyRepayOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-100">
              <h3 className="text-sm font-bold text-slate-900">Record Early Prepayment</h3>
              <p className="text-xs text-slate-500">
                Lump-sum repayment will directly reduce the outstanding principal balance.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">Repayment Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Bank transfer or cash deposit"
                  value={repaymentNotes}
                  onChange={(e) => setRepaymentNotes(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEarlyRepayOpen(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEarlyRepay}
                  className="rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Submit Prepayment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Loan */}
        {isRejectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-100">
              <h3 className="text-sm font-bold text-slate-900">Reject Loan Application</h3>
              <p className="text-xs text-slate-500">
                Please provide an audit justification for rejecting this loan request.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 text-xs mb-1">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Credit policy mismatch or probation period active"
                  className="w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="rounded bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating What's New */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-[#9333EA] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#7E22CE] transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          What&apos;s New!
        </button>
      </div>
    </div>
  );
}
