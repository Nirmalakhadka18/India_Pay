"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { EmployeeHeader } from "../../employee-header";

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "validating" | "success" | "error"
  >("idle");

  const handleSimulatedImport = () => {
    setImportStatus("validating");
    setTimeout(() => {
      setImportStatus("success");
    }, 1200);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader currentCategory="admin" currentPageTitle="Excel Import" />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Bulk Excel Import
            </h2>
            <p className="text-xs text-slate-500">
              Import multiple employee records, statutory mappings, and master
              data via Excel/CSV
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Download Sample Excel Template
          </button>
        </div>

        {/* Upload Zone */}
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:border-sky-500 transition">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600 mb-3">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Upload Excel Spreadsheet
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Drag and drop your .xlsx or .csv master file here
          </p>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleSimulatedImport}
              className="inline-flex items-center gap-2 rounded-md bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] transition shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Select File &amp; Validate Records
            </button>
          </div>
        </div>

        {/* Status / Feedback */}
        {importStatus === "validating" && (
          <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800 flex items-center gap-2">
            <span>
              Validating spreadsheet rows, duplicate PAN/UAN entries, and
              department keys...
            </span>
          </div>
        )}

        {importStatus === "success" && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Pre-validation passed: 33 rows checked with 0 schema violations.
              Ready to import.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
