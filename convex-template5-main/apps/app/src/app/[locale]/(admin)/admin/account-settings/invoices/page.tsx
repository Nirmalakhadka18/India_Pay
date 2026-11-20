"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type InvoiceItem = {
  _id: string;
  invoiceNo: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceDate: string;
  invoiceAmount: number;
  status: "paid" | "unpaid" | "due";
  currency: string;
  lineItems: Array<{
    slNo: number;
    service: string;
    headCount: number;
    amount: number;
    totalAmount: number;
    taxPercent: number;
    invoiceAmount: number;
  }>;
};

export default function InvoicesSettingsPage() {
  const invoices = useQuery(api.accountSettings.getInvoices);
  const [showHelp, setShowHelp] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>("seed_inv_1");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDownload = (inv: InvoiceItem) => {
    setDownloadingId(inv.invoiceNo);
    setTimeout(() => {
      const csvContent = `data:text/csv;charset=utf-8,Invoice No,${inv.invoiceNo}\nBilling Period,${inv.billingPeriodStart} - ${inv.billingPeriodEnd}\nInvoice Date,${inv.invoiceDate}\nTotal Amount,${inv.invoiceAmount}\n\nService,Headcount,Amount,Tax,Total\n${inv.lineItems?.map((li) => `${li.service},${li.headCount},${li.amount},${li.taxPercent}%,${li.invoiceAmount}`).join("\n")}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Invoice_${inv.invoiceNo.replace(/\//g, "_")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingId(null);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-700">
          Home
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-800">Invoices</span>
      </div>

      {/* Help Banner */}
      {showHelp && (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              The Invoices page displays the invoices raised for your account,
              if applicable. Explore greytHR by{" "}
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

      {/* Invoices Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">Invoices</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-700 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold w-12" />
                <th className="py-3 px-4 font-bold">Invoice No</th>
                <th className="py-3 px-4 font-bold">Billing Period</th>
                <th className="py-3 px-4 font-bold">Invoice Amount</th>
                <th className="py-3 px-4 font-bold text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices === undefined ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No invoice records found.
                  </td>
                </tr>
              ) : (
                (invoices as unknown as InvoiceItem[]).map((inv) => {
                  const isExpanded = expandedId === inv._id;
                  return (
                    <tbody key={inv._id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-400">
                          <button
                            type="button"
                            onClick={() => toggleExpand(inv._id)}
                            className="p-1 text-slate-500 hover:text-slate-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-bold font-mono text-blue-600">
                          <button
                            type="button"
                            onClick={() => toggleExpand(inv._id)}
                            className="hover:underline font-bold text-left"
                          >
                            {inv.invoiceNo}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {inv.billingPeriodStart} - {inv.billingPeriodEnd}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          ₹
                          {inv.invoiceAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownload(inv)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {downloadingId === inv.invoiceNo
                                ? "Preparing..."
                                : "Download"}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Line Items Accordion */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td
                            colSpan={5}
                            className="p-4 border-y border-slate-100"
                          >
                            <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 font-semibold text-slate-700">
                                <span>Invoice Date: {inv.invoiceDate}</span>
                                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                                  Status: {inv.status.toUpperCase()}
                                </span>
                              </div>

                              <table className="w-full text-left text-[11.5px]">
                                <thead className="text-slate-500 border-b border-slate-100 font-bold">
                                  <tr>
                                    <th className="py-1.5">Sl No</th>
                                    <th className="py-1.5">Service</th>
                                    <th className="py-1.5">Head Count</th>
                                    <th className="py-1.5">Amount</th>
                                    <th className="py-1.5">Total Amount</th>
                                    <th className="py-1.5">Tax (%)</th>
                                    <th className="py-1.5 text-right">
                                      Invoice Amount
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.lineItems?.map((li) => (
                                    <tr
                                      key={li.slNo}
                                      className="border-b border-slate-50"
                                    >
                                      <td className="py-2 text-slate-400">
                                        {li.slNo}
                                      </td>
                                      <td className="py-2 font-semibold text-slate-800">
                                        {li.service}
                                      </td>
                                      <td className="py-2">{li.headCount}</td>
                                      <td className="py-2 font-mono">
                                        ₹{li.amount.toFixed(2)}
                                      </td>
                                      <td className="py-2 font-mono">
                                        ₹{li.totalAmount.toFixed(2)}
                                      </td>
                                      <td className="py-2">{li.taxPercent}%</td>
                                      <td className="py-2 font-bold font-mono text-right text-slate-900">
                                        ₹{li.invoiceAmount.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-[#FAFBFD] text-xs text-slate-500">
          <span>Total Invoices: {invoices?.length || 0}</span>
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
