"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { CheckCircle2, ChevronDown, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PaymentItem = {
  _id: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  chequeOrRefNo: string;
  bankName: string;
  chequeDate?: string;
  acknowledgementSent: boolean;
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  paidAmount: number;
  status: "successful" | "pending" | "failed";
};

export default function PaymentsSettingsPage() {
  const payments = useQuery(api.accountSettings.getPayments);
  const [showHelp, setShowHelp] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>("seed_pmt_1");

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-700">
          Home
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-800">Payments</span>
      </div>

      {/* Help Banner matching greytHR */}
      {showHelp && (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              The Payments page stores and displays all the invoice payments.
              Explore greytHR by{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                Help-Doc
              </span>
              , watching{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                How-to Videos
              </span>{" "}
              and{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                FAQ
              </span>
              .
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="font-semibold text-slate-500 hover:text-slate-800"
          >
            Hide Help
          </button>
        </div>
      )}

      {/* Payments Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Payment Update History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-700 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold w-12" />
                <th className="py-3 px-4 font-bold">Payment Date</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold">Payment Mode</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments === undefined ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                (payments as unknown as PaymentItem[]).map((pmt) => {
                  const isExpanded = expandedId === pmt._id;
                  return (
                    <tbody key={pmt._id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-400">
                          <button
                            type="button"
                            onClick={() => toggleExpand(pmt._id)}
                            className="p-1 text-slate-500 hover:text-slate-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <button
                            type="button"
                            onClick={() => toggleExpand(pmt._id)}
                            className="hover:underline font-semibold text-left"
                          >
                            {pmt.paymentDate}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">
                          ₹
                          {pmt.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {pmt.paymentMode}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Successful</span>
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Payment Details & Invoices Applied */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td
                            colSpan={5}
                            className="p-4 border-y border-slate-100"
                          >
                            <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-3 border-b border-slate-100 text-slate-600">
                                <div>
                                  <span className="block font-semibold text-slate-400 text-[11px]">
                                    Payment Mode
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {pmt.paymentMode}
                                  </span>
                                </div>
                                <div>
                                  <span className="block font-semibold text-slate-400 text-[11px]">
                                    Cheque/DD/Ref No
                                  </span>
                                  <span className="font-mono font-bold text-slate-800">
                                    {pmt.chequeOrRefNo}
                                  </span>
                                </div>
                                <div>
                                  <span className="block font-semibold text-slate-400 text-[11px]">
                                    Bank
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {pmt.bankName}
                                  </span>
                                </div>
                                <div>
                                  <span className="block font-semibold text-slate-400 text-[11px]">
                                    Acknowledgement Sent
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {pmt.acknowledgementSent ? "Yes" : "No"}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-800 mb-2">
                                  Invoices Settled:
                                </h4>
                                <table className="w-full text-left text-[11.5px]">
                                  <thead className="text-slate-500 border-b border-slate-100 font-bold">
                                    <tr>
                                      <th className="py-1">Invoice No</th>
                                      <th className="py-1">Invoice Date</th>
                                      <th className="py-1">Invoice Amount</th>
                                      <th className="py-1 text-right">
                                        Paid Amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-50">
                                      <td className="py-2 font-mono font-semibold text-blue-600">
                                        {pmt.invoiceNo}
                                      </td>
                                      <td className="py-2 text-slate-700">
                                        {pmt.invoiceDate}
                                      </td>
                                      <td className="py-2 font-mono">
                                        ₹{pmt.invoiceAmount.toFixed(2)}
                                      </td>
                                      <td className="py-2 font-mono font-bold text-right text-emerald-700">
                                        ₹{pmt.paidAmount.toFixed(2)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching greytHR */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-[#FAFBFD] text-xs text-slate-500">
          <span>Total Transactions: {payments?.length || 0}</span>
          <div className="flex items-center gap-1 font-semibold">
            <span className="px-2 py-1 text-slate-400">First</span>
            <span className="px-2 py-1 text-slate-400">&laquo;</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
              1
            </span>
            <span className="px-2 py-1 text-slate-400">&raquo;</span>
            <span className="px-2 py-1 text-slate-400">Last</span>
          </div>
        </div>
      </div>
    </div>
  );
}
