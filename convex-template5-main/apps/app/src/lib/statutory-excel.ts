import * as XLSX from "xlsx";

/**
 * Statutory Excel & Delimited Text File Generator for:
 * 1. ESI Monthly Report Upload Format (Excel)
 * 2. PF ECR Format (Excel)
 * 3. PF ECR Format (TXT)
 */

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ESI MONTHLY REPORT UPLOAD FORMAT (EXCEL)
// Matches reference: "ESI Monthly Report Upload Format.xls"
// ─────────────────────────────────────────────────────────────────────────────

export interface EsiUploadExcelRow {
  insuranceNo: string;
  name: string;
  daysWorked: number;
  totalMonthlyWages: number;
  reasonCode?: string;
  lastWorkingDay?: string;
}

export function generateEsiMonthlyUploadWorkbook(
  records: EsiUploadExcelRow[],
  isDraft = false,
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const headers = [
    "IP Number(10Digits)",
    "IP Name( Only alphabets and space )",
    "No of Days for which wages paid/payable during the month",
    "Total Monthly Wages",
    "Reason Code for Zero workings days(numeric only; provide 0 for all other reasons- Click on the link for reference)",
    "Last Working Day( Format DD/MM/YYYY  or DD-MM-YYYY)",
  ];

  const rows = records.map((r) => [
    r.insuranceNo,
    r.name.replace(/[^a-zA-Z\s]/g, "").trim(),
    r.daysWorked,
    r.totalMonthlyWages,
    r.reasonCode || (r.daysWorked === 0 ? "1" : "0"),
    r.lastWorkingDay || "",
  ]);

  const aoa = [headers, ...rows];

  if (isDraft) {
    aoa.push([
      "DRAFT PREVIEW ONLY - NOT FOR OFFICIAL STATUTORY SUBMISSION",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths matching reference
  ws["!cols"] = [
    { wch: 22 },
    { wch: 35 },
    { wch: 25 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return wb;
}

export function downloadEsiMonthlyUploadExcel(
  records: EsiUploadExcelRow[],
  periodMonth: string,
  isDraft = false,
) {
  const wb = generateEsiMonthlyUploadWorkbook(records, isDraft);
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const draftSuffix = isDraft ? "_DRAFT_PREVIEW" : "";
  triggerBlobDownload(
    blob,
    `ESI_Monthly_Report_Upload_Format_${periodMonth}${draftSuffix}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PF ECR FORMAT (EXCEL)
// Matches reference: "PF - ECR Format - VC.xls"
// ─────────────────────────────────────────────────────────────────────────────

export interface PfEcrExcelRow {
  slNo: number;
  employeeNo: string;
  name: string;
  uan: string;
  grossWages: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  eeShare: number;
  epsShare: number;
  erShare: number;
  ncpDays: number;
  refundOfAdvances: number;
}

export function generatePfEcrWorkbook(
  companyName: string,
  companyAddress: string,
  records: PfEcrExcelRow[],
  isDraft = false,
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const aoa: (string | number)[][] = [
    [companyName],
    [companyAddress],
    [`Total Number of Employees : ${records.length}`],
    ["Total Number of Excluded Employees : 0"],
    ["Gross Wages of Excluded Employees : 0"],
    [
      "Sl.No",
      "Employee No",
      "Name",
      "UAN",
      "Gross Wages",
      "EPF Wages",
      "EPS Wages",
      "EDLI Wages",
      "EPF Contribution (EE Share) being remitted",
      "EPS Contribution being remitted",
      "Diff EPF and EPS Contribution (ER Share) being remitted",
      "NCP Days",
      "Refund of Advances",
    ],
  ];

  for (const r of records) {
    aoa.push([
      r.slNo,
      r.employeeNo,
      r.name,
      r.uan || "",
      r.grossWages,
      r.epfWages,
      r.epsWages,
      r.edliWages,
      r.eeShare,
      r.epsShare,
      r.erShare,
      r.ncpDays,
      String(r.refundOfAdvances),
    ]);
  }

  if (isDraft) {
    aoa.push([
      "DRAFT PREVIEW ONLY - NOT FOR OFFICIAL STATUTORY SUBMISSION",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!cols"] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Sheet0");
  return wb;
}

export function downloadPfEcrExcel(
  companyName: string,
  companyAddress: string,
  records: PfEcrExcelRow[],
  periodMonth: string,
  isDraft = false,
) {
  const wb = generatePfEcrWorkbook(
    companyName,
    companyAddress,
    records,
    isDraft,
  );
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const draftSuffix = isDraft ? "_DRAFT_PREVIEW" : "";
  triggerBlobDownload(blob, `PF_ECR_Format_${periodMonth}${draftSuffix}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PF ECR FORMAT (TXT)
// Matches reference: "PF_ECR_Sep26.txt" (#~# delimited)
// ─────────────────────────────────────────────────────────────────────────────

export function downloadPfEcrTxt(
  txtContent: string,
  periodMonth: string,
  establishmentCode?: string,
  isDraft = false,
) {
  const cleanEst = (establishmentCode || "EST").replace(/[^A-Za-z0-9]/g, "");
  const draftSuffix = isDraft ? "_DRAFT_PREVIEW" : "";
  const fileName = `PF_ECR_${periodMonth}_${cleanEst}${draftSuffix}.txt`;

  const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
  triggerBlobDownload(blob, fileName);
}
