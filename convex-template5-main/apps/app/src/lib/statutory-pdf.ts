/**
 * Zero-dependency PDF 1.4 Generation Engine for Indian Statutory Reports:
 * 1. ESI Monthly Statement (PDF)
 * 2. ESI Challan Report (PDF)
 * 3. PF Monthly Statement (PDF)
 * 4. PF Combined Challan Report V1 (PDF)
 * 5. Professional Tax Monthly Statement (Any State) (PDF)
 * 6. Karnataka Form 5A Monthly Statement (PDF)
 */

function escapePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

const encoder = new TextEncoder();
function byteLength(str: string): number {
  return encoder.encode(str).byteLength;
}

export function formatINR(val?: number | null): string {
  const safe = typeof val === "number" && Number.isFinite(val) ? val : 0;
  return safe.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PageStream {
  streamLines: string[];
}

class PdfDocBuilder {
  width: number;
  height: number;
  pages: PageStream[] = [];
  currentPageIndex = -1;

  constructor(isLandscape = false) {
    this.width = isLandscape ? 841.89 : 595.28;
    this.height = isLandscape ? 595.28 : 841.89;
  }

  addPage(): number {
    this.pages.push({ streamLines: [] });
    this.currentPageIndex = this.pages.length - 1;
    return this.currentPageIndex;
  }

  get lines(): string[] {
    if (this.currentPageIndex < 0) {
      this.addPage();
    }
    return this.pages[this.currentPageIndex]!.streamLines;
  }

  drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth = 0.5,
  ) {
    const l = this.lines;
    l.push("q");
    l.push(`${lineWidth} w`);
    if (strokeRgb) {
      l.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
    }
    if (fillRgb) {
      l.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg`);
    }
    l.push(
      `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`,
    );
    if (fillRgb && strokeRgb) {
      l.push("B");
    } else if (fillRgb) {
      l.push("f");
    } else if (strokeRgb) {
      l.push("S");
    }
    l.push("Q");
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.8, 0.8, 0.8],
    lineWidth = 0.5,
  ) {
    const l = this.lines;
    l.push("q");
    l.push(`${lineWidth} w`);
    l.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
    l.push(
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    );
    l.push("Q");
  }

  drawText(
    text: string,
    x: number,
    y: number,
    fontSize = 9,
    isBold = false,
    colorRgb: [number, number, number] = [0.1, 0.1, 0.1],
    align: "left" | "right" | "center" = "left",
  ) {
    const escaped = escapePdfText(text);
    const font = isBold ? "/F2" : "/F1";
    let renderX = x;
    const charWidth = fontSize * 0.52;
    if (align === "right") {
      renderX = x - text.length * charWidth;
    } else if (align === "center") {
      renderX = x - (text.length * charWidth) / 2;
    }

    const l = this.lines;
    l.push("BT");
    l.push(`${font} ${fontSize} Tf`);
    l.push(`${colorRgb[0]} ${colorRgb[1]} ${colorRgb[2]} rg`);
    l.push(`1 0 0 1 ${renderX.toFixed(2)} ${y.toFixed(2)} Tm`);
    l.push(`(${escaped}) Tj`);
    l.push("ET");
  }

  drawDraftWatermark() {
    // Subtle watermark banner across top or diagonal
    this.drawRect(
      30,
      this.height - 25,
      this.width - 60,
      18,
      [0.99, 0.95, 0.9],
      [0.9, 0.6, 0.2],
      0.5,
    );
    this.drawText(
      "DRAFT PREVIEW ONLY — NOT AN OFFICIAL STATUTORY FILING",
      this.width / 2,
      this.height - 18,
      8,
      true,
      [0.75, 0.35, 0.05],
      "center",
    );
  }

  build(): string {
    const totalPages = this.pages.length;
    const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

    // Standard objects:
    // 1: Catalog
    // 2: Pages root
    // 3: Font Helvetica
    // 4: Font Helvetica-Bold
    // 5..4+N: Page objects
    // 5+N..4+2N: Content stream objects
    const objects: string[] = [];
    const xrefOffsets: number[] = [0];

    // Catalog
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    // Pages root
    const pageRefs = Array.from(
      { length: totalPages },
      (_, i) => `${5 + i} 0 R`,
    ).join(" ");
    objects.push(
      `2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${totalPages} >>\nendobj\n`,
    );

    // Font 1 (Regular)
    objects.push(
      "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
    );

    // Font 2 (Bold)
    objects.push(
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
    );

    // Page objects
    for (let i = 0; i < totalPages; i++) {
      const contentRef = 5 + totalPages + i;
      objects.push(
        `${5 + i} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width.toFixed(2)} ${this.height.toFixed(2)}] /Contents ${contentRef} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj\n`,
      );
    }

    // Content streams
    for (let i = 0; i < totalPages; i++) {
      const streamBody = `${this.pages[i]!.streamLines.join("\n")}\n`;
      const streamLen = byteLength(streamBody);
      objects.push(
        `${5 + totalPages + i} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}endstream\nendobj\n`,
      );
    }

    let body = "";
    let currentOffset = byteLength(header);
    for (let i = 0; i < objects.length; i++) {
      xrefOffsets.push(currentOffset);
      const objStr = objects[i]!;
      body += objStr;
      currentOffset += byteLength(objStr);
    }

    const startXref = currentOffset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      xref += `${String(xrefOffsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return header + body + xref + trailer;
  }
}

function triggerDownload(content: string, fileName: string) {
  const blob = new Blob([content], { type: "application/pdf" });
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
// 1. ESI MONTHLY STATEMENT (PDF)
// ─────────────────────────────────────────────────────────────────────────────

export interface EsiMonthlyStatementData {
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  location?: string;
  isDraft?: boolean;
  totalWages: number;
  totalEmployeeContribution: number;
  totalEmployerContribution: number;
  totalContribution: number;
  portalEmployerContribution: number;
  portalTotalContribution: number;
  records: Array<{
    slNo: number;
    employeeNo: string;
    insuranceNo: string;
    name: string;
    joiningDate: string;
    leavingDate: string;
    daysWorked: number;
    esiGross: number;
    employeeContribution: number;
    employerContribution: number;
    totalContribution: number;
  }>;
}

export function generateEsiMonthlyStatementPdf(
  data: EsiMonthlyStatementData,
): string {
  const doc = new PdfDocBuilder(true); // Landscape A4 for wide table (841 x 595)
  doc.addPage();

  const margin = 28;
  const contentWidth = doc.width - margin * 2; // ~785 pt
  let curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 14;
  }

  // Header
  doc.drawText(
    "Page 1 of 1",
    doc.width - margin,
    curY,
    8,
    false,
    [0.4, 0.4, 0.4],
    "right",
  );
  doc.drawText(
    data.workspaceName,
    doc.width / 2,
    curY,
    13,
    true,
    [0.05, 0.15, 0.3],
    "center",
  );
  curY -= 14;
  doc.drawText(
    data.companyAddress,
    doc.width / 2,
    curY,
    7.5,
    false,
    [0.35, 0.35, 0.35],
    "center",
  );
  curY -= 16;

  doc.drawText(
    `ESI Report For ${data.periodMonth}`,
    doc.width / 2,
    curY,
    10.5,
    true,
    [0.1, 0.1, 0.1],
    "center",
  );
  curY -= 14;
  doc.drawText(
    `LOCATION : ${data.location || "Bangalore"}`,
    margin,
    curY,
    8,
    true,
    [0.2, 0.2, 0.2],
  );
  curY -= 10;

  // Table setup
  const cols = [
    { label: "SI No", width: 35, align: "center" as const },
    { label: "Employee No", width: 75, align: "left" as const },
    { label: "Insurance No", width: 85, align: "left" as const },
    { label: "Name Of Insured Person", width: 140, align: "left" as const },
    { label: "Joining Date", width: 65, align: "center" as const },
    { label: "Leaving Date", width: 65, align: "center" as const },
    { label: "Days Worked", width: 55, align: "right" as const },
    { label: "ESI Gross", width: 70, align: "right" as const },
    { label: "Employee's Cont.", width: 70, align: "right" as const },
    { label: "Employer's Cont.", width: 70, align: "right" as const },
    { label: "Total", width: 55, align: "right" as const },
  ];

  // Table Header
  const headerHeight = 20;
  doc.drawRect(
    margin,
    curY - headerHeight,
    contentWidth,
    headerHeight,
    [0.93, 0.95, 0.98],
    [0.75, 0.8, 0.85],
  );
  let colX = margin;
  for (const c of cols) {
    const textX =
      c.align === "right"
        ? colX + c.width - 4
        : c.align === "center"
          ? colX + c.width / 2
          : colX + 4;
    doc.drawText(
      c.label,
      textX,
      curY - 14,
      7.5,
      true,
      [0.1, 0.1, 0.1],
      c.align,
    );
    colX += c.width;
  }
  curY -= headerHeight;

  // Rows
  const rowHeight = 16;
  data.records.forEach((r, idx) => {
    const bg: [number, number, number] | undefined =
      idx % 2 === 1 ? [0.98, 0.98, 0.99] : undefined;
    doc.drawRect(
      margin,
      curY - rowHeight,
      contentWidth,
      rowHeight,
      bg,
      [0.85, 0.85, 0.88],
      0.3,
    );

    let rx = margin;
    doc.drawText(
      String(r.slNo),
      rx + cols[0]!.width / 2,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "center",
    );
    rx += cols[0]!.width;
    doc.drawText(r.employeeNo, rx + 4, curY - 11, 7.5, false, [0.2, 0.2, 0.2]);
    rx += cols[1]!.width;
    doc.drawText(r.insuranceNo, rx + 4, curY - 11, 7.5, false, [0.2, 0.2, 0.2]);
    rx += cols[2]!.width;
    doc.drawText(r.name, rx + 4, curY - 11, 7.5, true, [0.1, 0.1, 0.1]);
    rx += cols[3]!.width;
    doc.drawText(
      r.joiningDate,
      rx + cols[4]!.width / 2,
      curY - 11,
      7.5,
      false,
      [0.3, 0.3, 0.3],
      "center",
    );
    rx += cols[4]!.width;
    doc.drawText(
      r.leavingDate || "-",
      rx + cols[5]!.width / 2,
      curY - 11,
      7.5,
      false,
      [0.4, 0.4, 0.4],
      "center",
    );
    rx += cols[5]!.width;
    doc.drawText(
      formatINR(r.daysWorked),
      rx + cols[6]!.width - 4,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[6]!.width;
    doc.drawText(
      formatINR(r.esiGross),
      rx + cols[7]!.width - 4,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[7]!.width;
    doc.drawText(
      formatINR(r.employeeContribution),
      rx + cols[8]!.width - 4,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[8]!.width;
    doc.drawText(
      formatINR(r.employerContribution),
      rx + cols[9]!.width - 4,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[9]!.width;
    doc.drawText(
      formatINR(r.totalContribution),
      rx + cols[10]!.width - 4,
      curY - 11,
      7.5,
      true,
      [0.1, 0.1, 0.1],
      "right",
    );

    curY -= rowHeight;
  });

  // Table Total
  doc.drawRect(
    margin,
    curY - rowHeight,
    contentWidth,
    rowHeight,
    [0.94, 0.94, 0.96],
    [0.6, 0.6, 0.65],
    0.5,
  );
  doc.drawText(
    "Total",
    margin +
      cols[0]!.width +
      cols[1]!.width +
      cols[2]!.width +
      cols[3]!.width +
      cols[4]!.width +
      cols[5]!.width +
      cols[6]!.width -
      8,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  let tx =
    margin +
    cols[0]!.width +
    cols[1]!.width +
    cols[2]!.width +
    cols[3]!.width +
    cols[4]!.width +
    cols[5]!.width +
    cols[6]!.width;
  doc.drawText(
    formatINR(data.totalWages),
    tx + cols[7]!.width - 4,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[7]!.width;
  doc.drawText(
    formatINR(data.totalEmployeeContribution),
    tx + cols[8]!.width - 4,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[8]!.width;
  doc.drawText(
    formatINR(data.totalEmployerContribution),
    tx + cols[9]!.width - 4,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[9]!.width;
  doc.drawText(
    formatINR(data.totalContribution),
    tx + cols[10]!.width - 4,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  curY -= rowHeight + 4;

  // Grand Total & ESI Portal rounding row
  doc.drawText("Grand Total", margin + 150, curY - 10, 8, true);
  doc.drawText(
    formatINR(data.totalWages),
    margin + 465,
    curY - 10,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  doc.drawText(
    formatINR(data.totalEmployeeContribution),
    margin + 535,
    curY - 10,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  doc.drawText(
    formatINR(data.totalEmployerContribution),
    margin + 605,
    curY - 10,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  doc.drawText(
    formatINR(data.totalContribution),
    margin + 660,
    curY - 10,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  curY -= 14;

  doc.drawText(
    "As per the ESI Portal",
    margin + 150,
    curY - 10,
    8,
    true,
    [0.2, 0.4, 0.7],
  );
  doc.drawText(
    formatINR(data.totalWages),
    margin + 465,
    curY - 10,
    8,
    false,
    [0.2, 0.2, 0.2],
    "right",
  );
  doc.drawText(
    formatINR(data.totalEmployeeContribution),
    margin + 535,
    curY - 10,
    8,
    false,
    [0.2, 0.2, 0.2],
    "right",
  );
  doc.drawText(
    formatINR(data.portalEmployerContribution),
    margin + 605,
    curY - 10,
    8,
    false,
    [0.2, 0.2, 0.2],
    "right",
  );
  doc.drawText(
    formatINR(data.portalTotalContribution),
    margin + 660,
    curY - 10,
    8,
    true,
    [0.2, 0.4, 0.7],
    "right",
  );

  return doc.build();
}

export function downloadEsiMonthlyStatementPdf(data: EsiMonthlyStatementData) {
  const pdf = generateEsiMonthlyStatementPdf(data);
  triggerDownload(pdf, `ESI_Monthly_Statement_${data.periodMonth}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ESI CHALLAN REPORT (PDF)
// ─────────────────────────────────────────────────────────────────────────────

export interface EsiChallanData {
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  isDraft?: boolean;
  totalEmployees: number;
  totalWages: number;
  employeeContribution: number;
  employerContribution: number;
  totalAmount: number;
  amountInWords: string;
  challanDate?: string;
}

export function generateEsiChallanReportPdf(data: EsiChallanData): string {
  const doc = new PdfDocBuilder(false); // Portrait A4 (595 x 841)
  doc.addPage();

  const margin = 32;
  const contentWidth = doc.width - margin * 2; // ~531 pt
  let curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 16;
  }

  const renderChallanBlock = (titleCopy: string, yTop: number): number => {
    let y = yTop;
    doc.drawRect(
      margin,
      y - 340,
      contentWidth,
      340,
      [1, 1, 1],
      [0.4, 0.5, 0.6],
      1,
    );

    // Header banner inside box
    doc.drawRect(
      margin,
      y - 38,
      contentWidth,
      38,
      [0.93, 0.96, 0.99],
      [0.7, 0.8, 0.9],
      0.5,
    );
    doc.drawText(titleCopy, margin + 10, y - 16, 9.5, true, [0.1, 0.25, 0.45]);
    doc.drawText(
      "Challan No: ",
      margin + 280,
      y - 16,
      8.5,
      false,
      [0.3, 0.3, 0.3],
    );
    doc.drawText(
      "EMPLOYEES' STATE INSURANCE FUND, ACCOUNT NO. 1",
      doc.width / 2,
      y - 28,
      9,
      true,
      [0.1, 0.1, 0.1],
      "center",
    );

    y -= 45;
    doc.drawText(
      "Pay-in-Slip for Contribution",
      doc.width / 2,
      y,
      9,
      true,
      [0.2, 0.2, 0.2],
      "center",
    );
    y -= 12;
    doc.drawText(
      "STATE BANK OF INDIA",
      doc.width / 2,
      y,
      9.5,
      true,
      [0.1, 0.25, 0.5],
      "center",
    );
    y -= 14;

    doc.drawText(
      `Dated: ${data.challanDate || "13 Oct 2026"}`,
      margin + 12,
      y,
      8,
      false,
      [0.3, 0.3, 0.3],
    );
    doc.drawText(
      "Station: Bangalore",
      doc.width - margin - 12,
      y,
      8,
      false,
      [0.3, 0.3, 0.3],
      "right",
    );
    y -= 16;

    // Payment narrative & Amount box
    doc.drawRect(
      margin + 10,
      y - 55,
      contentWidth - 20,
      55,
      [0.99, 0.99, 1],
      [0.8, 0.85, 0.9],
      0.5,
    );
    doc.drawText(
      `Paid into the credit of the Employees State Insurance Fund Account No.1 - Rs. ${data.totalAmount} /-`,
      margin + 16,
      y - 14,
      8,
      true,
      [0.1, 0.1, 0.1],
    );
    doc.drawText(
      `(${data.amountInWords}) in Cash / by Cheque (on realisation)`,
      margin + 16,
      y - 26,
      7.5,
      false,
      [0.25, 0.25, 0.25],
    );
    doc.drawText(
      `under the Employees' State Insurance Act, 1948 for the month of ${data.periodMonth}.`,
      margin + 16,
      y - 38,
      7.5,
      false,
      [0.25, 0.25, 0.25],
    );

    doc.drawText(
      `Bank Amount: Rs. ${formatINR(data.totalAmount)}`,
      doc.width - margin - 20,
      y - 20,
      8.5,
      true,
      [0.1, 0.3, 0.5],
      "right",
    );
    doc.drawText(
      `TOTAL: Rs. ${formatINR(data.totalAmount)}`,
      doc.width - margin - 20,
      y - 34,
      8.5,
      true,
      [0.1, 0.5, 0.2],
      "right",
    );

    y -= 65;

    // Establishment box & Contribution summary
    doc.drawText(
      "Deposited by / Name and Address of Factory / Establishment:",
      margin + 12,
      y,
      7.5,
      true,
      [0.3, 0.3, 0.3],
    );
    y -= 12;
    doc.drawText(data.workspaceName, margin + 12, y, 9, true, [0.1, 0.1, 0.1]);
    y -= 11;
    doc.drawText(
      data.companyAddress,
      margin + 12,
      y,
      7.5,
      false,
      [0.35, 0.35, 0.35],
    );
    y -= 18;

    // 2-column details grid
    doc.drawRect(
      margin + 10,
      y - 72,
      contentWidth - 20,
      72,
      [0.97, 0.98, 0.99],
      [0.8, 0.85, 0.9],
      0.5,
    );
    doc.drawText(
      `No of Employees :  ${data.totalEmployees}`,
      margin + 20,
      y - 18,
      8.5,
      true,
    );
    doc.drawText(
      `Total Wages Rs. :  ${formatINR(data.totalWages)}`,
      margin + 20,
      y - 34,
      8.5,
      true,
    );
    doc.drawText(
      `Employees' Contribution Rs. :  ${formatINR(data.employeeContribution)}`,
      margin + 280,
      y - 18,
      8.5,
      false,
    );
    doc.drawText(
      `Employers' Contribution Rs. :  ${formatINR(data.employerContribution)}`,
      margin + 280,
      y - 34,
      8.5,
      false,
    );
    doc.drawText(
      `Total Contribution Rs. :  ${formatINR(data.totalAmount)}`,
      margin + 280,
      y - 52,
      9.5,
      true,
      [0.1, 0.45, 0.15],
    );

    y -= 88;
    doc.drawText(
      `Dated: ${data.challanDate || "13 Oct 2026"}`,
      margin + 20,
      y,
      8,
      false,
      [0.4, 0.4, 0.4],
    );
    doc.drawText(
      "Authorised Signatory of the receiving Bank",
      doc.width - margin - 20,
      y,
      8,
      true,
      [0.3, 0.3, 0.3],
      "right",
    );

    return yTop - 365;
  };

  curY = renderChallanBlock("ORIGINAL E.S.I.C. (For Bank)", curY);
  renderChallanBlock("DUPLICATE E.S.I.C. (For ESIC Through)", curY);

  return doc.build();
}

export function downloadEsiChallanReportPdf(data: EsiChallanData) {
  const pdf = generateEsiChallanReportPdf(data);
  triggerDownload(pdf, `ESI_Challan_Report_${data.periodMonth}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PF MONTHLY STATEMENT (PDF)
// ─────────────────────────────────────────────────────────────────────────────

export interface PfMonthlyStatementData {
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  location?: string;
  isDraft?: boolean;
  totalEpfWages: number;
  totalEeShare: number;
  totalErPf: number;
  totalErEps: number;
  accountBreakdown: {
    ac1_ee: number;
    ac1_er: number;
    ac1_total: number;
    ac2_admin: number;
    ac10_eps: number;
    ac21_edli: number;
    ac22_admin: number;
    totalRemittance: number;
  };
  records: Array<{
    slNo: number;
    employeeNo: string;
    name: string;
    pfNo: string;
    epfWages: number;
    eePf: number;
    eeVpf: number;
    erPf: number;
    erEps: number;
    erTotal: number;
  }>;
}

export function generatePfMonthlyStatementPdf(
  data: PfMonthlyStatementData,
): string {
  const doc = new PdfDocBuilder(true); // Landscape A4 for wide statutory statement
  doc.addPage();

  const margin = 28;
  const contentWidth = doc.width - margin * 2;
  let curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 14;
  }

  doc.drawText(
    "Page 1 of 1",
    doc.width - margin,
    curY,
    8,
    false,
    [0.4, 0.4, 0.4],
    "right",
  );
  doc.drawText(
    data.workspaceName,
    doc.width / 2,
    curY,
    13,
    true,
    [0.05, 0.15, 0.3],
    "center",
  );
  curY -= 14;
  doc.drawText(
    data.companyAddress,
    doc.width / 2,
    curY,
    7.5,
    false,
    [0.35, 0.35, 0.35],
    "center",
  );
  curY -= 16;

  doc.drawText(
    `Provident Fund Statement For ${data.periodMonth}`,
    doc.width / 2,
    curY,
    10.5,
    true,
    [0.1, 0.1, 0.1],
    "center",
  );
  curY -= 14;
  doc.drawText(
    `For Location   ${data.location || "Bangalore"}`,
    margin,
    curY,
    8,
    true,
    [0.2, 0.2, 0.2],
  );
  curY -= 10;

  // Header 2-row
  const cols = [
    { label: "Sl No", width: 35, align: "center" as const },
    { label: "Employee No", width: 85, align: "left" as const },
    { label: "Name", width: 155, align: "left" as const },
    { label: "PF No", width: 80, align: "left" as const },
    { label: "Basic + DA", width: 80, align: "right" as const },
    { label: "EE PF (12%)", width: 70, align: "right" as const },
    { label: "EE VPF", width: 55, align: "right" as const },
    { label: "ER PF (3.67%)", width: 75, align: "right" as const },
    { label: "ER EPS (8.33%)", width: 75, align: "right" as const },
    { label: "ER Total", width: 75, align: "right" as const },
  ];

  doc.drawRect(
    margin,
    curY - 20,
    contentWidth,
    20,
    [0.93, 0.95, 0.98],
    [0.75, 0.8, 0.85],
  );
  let cx = margin;
  for (const c of cols) {
    const tx =
      c.align === "right"
        ? cx + c.width - 4
        : c.align === "center"
          ? cx + c.width / 2
          : cx + 4;
    doc.drawText(c.label, tx, curY - 14, 7.5, true, [0.1, 0.1, 0.1], c.align);
    cx += c.width;
  }
  curY -= 20;

  const rowHeight = 14;
  data.records.forEach((r, idx) => {
    const bg: [number, number, number] | undefined =
      idx % 2 === 1 ? [0.98, 0.98, 0.99] : undefined;
    doc.drawRect(
      margin,
      curY - rowHeight,
      contentWidth,
      rowHeight,
      bg,
      [0.85, 0.85, 0.88],
      0.3,
    );

    let rx = margin;
    doc.drawText(
      String(r.slNo),
      rx + cols[0]!.width / 2,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "center",
    );
    rx += cols[0]!.width;
    doc.drawText(r.employeeNo, rx + 4, curY - 10, 7, false, [0.2, 0.2, 0.2]);
    rx += cols[1]!.width;
    doc.drawText(r.name, rx + 4, curY - 10, 7, true, [0.1, 0.1, 0.1]);
    rx += cols[2]!.width;
    doc.drawText(
      r.pfNo || "-",
      rx + 4,
      curY - 10,
      7,
      false,
      [0.35, 0.35, 0.35],
    );
    rx += cols[3]!.width;
    doc.drawText(
      formatINR(r.epfWages),
      rx + cols[4]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[4]!.width;
    doc.drawText(
      formatINR(r.eePf),
      rx + cols[5]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[5]!.width;
    doc.drawText(
      formatINR(r.eeVpf),
      rx + cols[6]!.width - 4,
      curY - 10,
      7,
      false,
      [0.35, 0.35, 0.35],
      "right",
    );
    rx += cols[6]!.width;
    doc.drawText(
      formatINR(r.erPf),
      rx + cols[7]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[7]!.width;
    doc.drawText(
      formatINR(r.erEps),
      rx + cols[8]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[8]!.width;
    doc.drawText(
      formatINR(r.erTotal),
      rx + cols[9]!.width - 4,
      curY - 10,
      7,
      true,
      [0.1, 0.1, 0.1],
      "right",
    );

    curY -= rowHeight;
  });

  // Table Totals
  doc.drawRect(
    margin,
    curY - rowHeight,
    contentWidth,
    rowHeight,
    [0.94, 0.94, 0.96],
    [0.6, 0.6, 0.65],
    0.5,
  );
  doc.drawText(
    "Total",
    margin +
      cols[0]!.width +
      cols[1]!.width +
      cols[2]!.width +
      cols[3]!.width -
      8,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  let tx =
    margin + cols[0]!.width + cols[1]!.width + cols[2]!.width + cols[3]!.width;
  doc.drawText(
    formatINR(data.totalEpfWages),
    tx + cols[4]!.width - 4,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[4]!.width;
  doc.drawText(
    formatINR(data.totalEeShare),
    tx + cols[5]!.width - 4,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[5]!.width;
  doc.drawText(
    "0.00",
    tx + cols[6]!.width - 4,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[6]!.width;
  doc.drawText(
    formatINR(data.totalErPf),
    tx + cols[7]!.width - 4,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[7]!.width;
  doc.drawText(
    formatINR(data.totalErEps),
    tx + cols[8]!.width - 4,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  tx += cols[8]!.width;
  doc.drawText(
    formatINR(data.totalErPf + data.totalErEps),
    tx + cols[9]!.width - 4,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  curY -= rowHeight + 10;

  // Challan Accounts Breakdown Grid
  doc.drawRect(
    margin + 100,
    curY - 80,
    contentWidth - 200,
    80,
    [0.99, 0.99, 1],
    [0.75, 0.8, 0.85],
    0.5,
  );
  doc.drawText("Account No 1 EPF", margin + 115, curY - 15, 7.5, false);
  doc.drawText(
    `EE: ${formatINR(data.accountBreakdown.ac1_ee)}   ER: ${formatINR(data.accountBreakdown.ac1_er)}   Total: ${formatINR(data.accountBreakdown.ac1_total)}`,
    margin + 350,
    curY - 15,
    7.5,
    true,
  );

  doc.drawText("Account No 10 EPS", margin + 115, curY - 28, 7.5, false);
  doc.drawText(
    formatINR(data.accountBreakdown.ac10_eps),
    margin + 350,
    curY - 28,
    7.5,
    true,
  );

  doc.drawText(
    "Account No 2 PF Admin (0.50%)",
    margin + 115,
    curY - 41,
    7.5,
    false,
  );
  doc.drawText(
    formatINR(data.accountBreakdown.ac2_admin),
    margin + 350,
    curY - 41,
    7.5,
    true,
  );

  doc.drawText(
    "Account No. 21 E D L I (0.50%)",
    margin + 115,
    curY - 54,
    7.5,
    false,
  );
  doc.drawText(
    formatINR(data.accountBreakdown.ac21_edli),
    margin + 350,
    curY - 54,
    7.5,
    true,
  );

  doc.drawText(
    "Account No. 22 EDLI Admin",
    margin + 115,
    curY - 67,
    7.5,
    false,
  );
  doc.drawText("0.00 (Waived)", margin + 350, curY - 67, 7.5, false);

  doc.drawText(
    "Grand Total Remittance",
    margin + 490,
    curY - 41,
    8,
    true,
    [0.1, 0.4, 0.15],
  );
  doc.drawText(
    `Rs. ${formatINR(data.accountBreakdown.totalRemittance)}`,
    margin + 490,
    curY - 56,
    10,
    true,
    [0.1, 0.4, 0.15],
  );

  return doc.build();
}

export function downloadPfMonthlyStatementPdf(data: PfMonthlyStatementData) {
  const pdf = generatePfMonthlyStatementPdf(data);
  triggerDownload(pdf, `PF_Monthly_Statement_${data.periodMonth}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PF COMBINED CHALLAN REPORT V1 (PDF)
// ─────────────────────────────────────────────────────────────────────────────

export interface PfCombinedChallanData {
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  establishmentCode: string;
  isDraft?: boolean;
  totalSubscribers: number;
  totalWagesDue: number;
  ac1_ee: number;
  ac1_er: number;
  ac2_admin: number;
  ac10_eps: number;
  ac21_edli: number;
  totalRemittance: number;
  amountInWords: string;
}

export function generatePfCombinedChallanReportPdf(
  data: PfCombinedChallanData,
): string {
  const doc = new PdfDocBuilder(false); // Portrait A4
  doc.addPage();

  const margin = 32;
  const contentWidth = doc.width - margin * 2;
  let curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 14;
  }

  doc.drawText(
    "Page 1 of 1",
    doc.width - margin,
    curY,
    8,
    false,
    [0.4, 0.4, 0.4],
    "right",
  );
  curY -= 8;

  doc.drawText(
    "COMBINED CHALLAN OF A/C.NO.1, 2, 10, 21 & 22",
    doc.width / 2,
    curY,
    11,
    true,
    [0.1, 0.2, 0.4],
    "center",
  );
  curY -= 14;
  doc.drawText(
    "STATE BANK OF INDIA   ORIGINAL/DUPLICATE/TRIPLICATE/QUADRUPLICATE",
    doc.width / 2,
    curY,
    8.5,
    true,
    [0.2, 0.2, 0.2],
    "center",
  );
  curY -= 12;
  doc.drawText(
    "EMPLOYEES' PROVIDENT FUND ORGANISATION (USE SEPARATE CHALLAN FOR EACH MONTH)",
    doc.width / 2,
    curY,
    8,
    false,
    [0.3, 0.3, 0.3],
    "center",
  );
  curY -= 16;

  // Metadata Box
  doc.drawRect(
    margin,
    curY - 38,
    contentWidth,
    38,
    [0.97, 0.98, 0.99],
    [0.8, 0.85, 0.9],
    0.5,
  );
  doc.drawText(
    `Establishment Code No. : ${data.establishmentCode}`,
    margin + 10,
    curY - 14,
    8,
    true,
  );
  doc.drawText("Account Group No. : 01", margin + 260, curY - 14, 8, false);
  doc.drawText("Pay Type : Cheque/Cash", margin + 400, curY - 14, 8, false);

  doc.drawText(
    `Dues for the Month of: Employee's Share ${data.periodMonth}   Employer's Share ${data.periodMonth}`,
    margin + 10,
    curY - 28,
    8,
    false,
  );
  curY -= 48;

  // Subscriber Grid
  doc.drawRect(
    margin,
    curY - 32,
    contentWidth,
    32,
    undefined,
    [0.75, 0.8, 0.85],
    0.5,
  );
  doc.drawText("Total No. of Subscriber", margin + 10, curY - 14, 7.5, true);
  doc.drawText(
    `A/c 1 : ${data.totalSubscribers}`,
    margin + 140,
    curY - 14,
    8,
    false,
  );
  doc.drawText(
    `A/c 10 : ${data.totalSubscribers}`,
    margin + 240,
    curY - 14,
    8,
    false,
  );
  doc.drawText(
    `A/c 21 : ${data.totalSubscribers}`,
    margin + 340,
    curY - 14,
    8,
    false,
  );

  doc.drawText("Total Wages Due", margin + 10, curY - 26, 7.5, true);
  doc.drawText(
    `Rs. ${formatINR(data.totalWagesDue)}`,
    margin + 140,
    curY - 26,
    8,
    true,
  );
  doc.drawText(
    `Rs. ${formatINR(data.ac10_eps > 0 ? data.totalWagesDue : 0)}`,
    margin + 240,
    curY - 26,
    8,
    false,
  );
  doc.drawText(
    `Rs. ${formatINR(data.totalWagesDue)}`,
    margin + 340,
    curY - 26,
    8,
    false,
  );
  curY -= 42;

  // Main Particulars Table
  const pCols = [
    { label: "Sl", width: 25 },
    { label: "Particular", width: 140 },
    { label: "A/c No.1", width: 60 },
    { label: "A/c No.2", width: 60 },
    { label: "A/c No.10", width: 60 },
    { label: "A/c No.21", width: 60 },
    { label: "A/c No.22", width: 55 },
    { label: "TOTAL", width: 71 },
  ];

  doc.drawRect(
    margin,
    curY - 18,
    contentWidth,
    18,
    [0.92, 0.94, 0.97],
    [0.7, 0.75, 0.8],
    0.5,
  );
  let px = margin;
  for (const c of pCols) {
    const tx =
      c.label === "Sl"
        ? px + c.width / 2
        : c.label === "Particular"
          ? px + 4
          : px + c.width - 4;
    doc.drawText(
      c.label,
      tx,
      curY - 13,
      7.5,
      true,
      [0.1, 0.1, 0.1],
      c.label === "Particular" ? "left" : c.label === "Sl" ? "center" : "right",
    );
    px += c.width;
  }
  curY -= 18;

  const rows = [
    {
      sl: "1",
      name: "Employer's Share of Cont.",
      a1: data.ac1_er,
      a2: 0,
      a10: data.ac10_eps,
      a21: data.ac21_edli,
      a22: 0,
      tot: data.ac1_er + data.ac10_eps + data.ac21_edli,
    },
    {
      sl: "2",
      name: "Employee's Share of Cont.",
      a1: data.ac1_ee,
      a2: 0,
      a10: 0,
      a21: 0,
      a22: 0,
      tot: data.ac1_ee,
    },
    {
      sl: "3",
      name: "Administrative Charges",
      a1: 0,
      a2: data.ac2_admin,
      a10: 0,
      a21: 0,
      a22: 0,
      tot: data.ac2_admin,
    },
    {
      sl: "4",
      name: "Inspection Charges",
      a1: 0,
      a2: 0,
      a10: 0,
      a21: 0,
      a22: 0,
      tot: 0,
    },
    {
      sl: "5",
      name: "Penal Damages",
      a1: 0,
      a2: 0,
      a10: 0,
      a21: 0,
      a22: 0,
      tot: 0,
    },
    {
      sl: "6",
      name: "Miscellaneous Payments",
      a1: 0,
      a2: 0,
      a10: 0,
      a21: 0,
      a22: 0,
      tot: 0,
    },
    {
      sl: "7",
      name: "Past Accumulations",
      a1: 0,
      a2: 0,
      a10: 0,
      a21: 0,
      a22: 0,
      tot: 0,
    },
  ];

  rows.forEach((r, idx) => {
    const bg: [number, number, number] | undefined =
      idx % 2 === 1 ? [0.98, 0.98, 0.99] : undefined;
    doc.drawRect(
      margin,
      curY - 14,
      contentWidth,
      14,
      bg,
      [0.85, 0.85, 0.9],
      0.3,
    );

    let x = margin;
    doc.drawText(
      r.sl,
      x + pCols[0]!.width / 2,
      curY - 10,
      7,
      false,
      [0.3, 0.3, 0.3],
      "center",
    );
    x += pCols[0]!.width;
    doc.drawText(r.name, x + 4, curY - 10, 7, true, [0.15, 0.15, 0.15]);
    x += pCols[1]!.width;
    doc.drawText(
      r.a1 ? formatINR(r.a1) : "-",
      x + pCols[2]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += pCols[2]!.width;
    doc.drawText(
      r.a2 ? formatINR(r.a2) : "-",
      x + pCols[3]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += pCols[3]!.width;
    doc.drawText(
      r.a10 ? formatINR(r.a10) : "-",
      x + pCols[4]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += pCols[4]!.width;
    doc.drawText(
      r.a21 ? formatINR(r.a21) : "-",
      x + pCols[5]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += pCols[5]!.width;
    doc.drawText(
      r.a22 ? formatINR(r.a22) : "-",
      x + pCols[6]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += pCols[6]!.width;
    doc.drawText(
      r.tot ? formatINR(r.tot) : "-",
      x + pCols[7]!.width - 4,
      curY - 10,
      7,
      true,
      [0.1, 0.1, 0.1],
      "right",
    );

    curY -= 14;
  });

  // TOTAL Row
  doc.drawRect(
    margin,
    curY - 16,
    contentWidth,
    16,
    [0.93, 0.95, 0.98],
    [0.5, 0.55, 0.6],
    0.75,
  );
  doc.drawText("TOTAL", margin + pCols[0]!.width + 4, curY - 11, 7.5, true);
  let totX = margin + pCols[0]!.width + pCols[1]!.width;
  doc.drawText(
    formatINR(data.ac1_ee + data.ac1_er),
    totX + pCols[2]!.width - 4,
    curY - 11,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  totX += pCols[2]!.width;
  doc.drawText(
    formatINR(data.ac2_admin),
    totX + pCols[3]!.width - 4,
    curY - 11,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  totX += pCols[3]!.width;
  doc.drawText(
    formatINR(data.ac10_eps),
    totX + pCols[4]!.width - 4,
    curY - 11,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  totX += pCols[4]!.width;
  doc.drawText(
    formatINR(data.ac21_edli),
    totX + pCols[5]!.width - 4,
    curY - 11,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  totX += pCols[5]!.width;
  doc.drawText(
    "0.00",
    totX + pCols[6]!.width - 4,
    curY - 11,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  totX += pCols[6]!.width;
  doc.drawText(
    formatINR(data.totalRemittance),
    totX + pCols[7]!.width - 4,
    curY - 11,
    8.5,
    true,
    [0.1, 0.4, 0.15],
    "right",
  );
  curY -= 24;

  // Words
  doc.drawText(
    `Amount In Words -- ${data.amountInWords}`,
    margin + 10,
    curY,
    8,
    true,
    [0.15, 0.15, 0.15],
  );
  curY -= 20;

  // Establishment and Bank Section
  doc.drawRect(
    margin,
    curY - 90,
    contentWidth,
    90,
    [0.99, 0.99, 1],
    [0.8, 0.85, 0.9],
    0.5,
  );
  doc.drawText("Name of Establishment :", margin + 12, curY - 18, 8, true);
  doc.drawText(
    data.workspaceName,
    margin + 120,
    curY - 18,
    8.5,
    true,
    [0.05, 0.2, 0.4],
  );
  doc.drawText("Address :", margin + 12, curY - 32, 8, true);
  doc.drawText(
    data.companyAddress,
    margin + 120,
    curY - 32,
    7.5,
    false,
    [0.3, 0.3, 0.3],
  );

  doc.drawText("Amount Received Rs. :", margin + 12, curY - 50, 8.5, true);
  doc.drawText(
    `Rs. ${formatINR(data.totalRemittance)}`,
    margin + 120,
    curY - 50,
    10,
    true,
    [0.1, 0.45, 0.15],
  );

  doc.drawText(
    "(TO BE FILLED IN BY EMPLOYER)",
    margin + 12,
    curY - 74,
    7,
    false,
    [0.5, 0.5, 0.5],
  );
  doc.drawText(
    "Name of the Bank : ________________   Cheque No. : ____________   Date : ____________",
    margin + 12,
    curY - 84,
    7.5,
    false,
    [0.35, 0.35, 0.35],
  );

  return doc.build();
}

export function downloadPfCombinedChallanReportPdf(
  data: PfCombinedChallanData,
) {
  const pdf = generatePfCombinedChallanReportPdf(data);
  triggerDownload(pdf, `PF_Combined_Challan_Report_V1_${data.periodMonth}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROFESSION TAX MONTHLY STATEMENT (ANY STATE) (PDF)
// ─────────────────────────────────────────────────────────────────────────────

export interface PtMonthlyStatementData {
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  state: string;
  isDraft?: boolean;
  createdOn?: string;
  records: Array<{
    slNo: number;
    employeeNo: string;
    name: string;
    grossSalary: number;
    ptAmount: number;
  }>;
  slabsSummary: Array<{
    rate: number;
    employeeCount: number;
    amount: number;
  }>;
}

export function generatePtMonthlyStatementPdf(
  data: PtMonthlyStatementData,
): string {
  const doc = new PdfDocBuilder(false); // Portrait A4
  doc.addPage();

  const margin = 36;
  const contentWidth = doc.width - margin * 2;
  let curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 14;
  }

  doc.drawText(
    `Created on: ${data.createdOn || "13 Oct 2026, 10:51 +0530"}`,
    margin,
    curY,
    7.5,
    false,
    [0.45, 0.45, 0.45],
  );
  doc.drawText(
    "Page 1 of 1",
    doc.width - margin,
    curY,
    8,
    false,
    [0.45, 0.45, 0.45],
    "right",
  );
  curY -= 12;

  doc.drawText(
    data.workspaceName,
    doc.width / 2,
    curY,
    13,
    true,
    [0.05, 0.15, 0.3],
    "center",
  );
  curY -= 16;
  doc.drawText(
    `STATEMENT OF PROFESSION TAX FOR ${data.periodMonth.toUpperCase()} (${data.state.toUpperCase()})`,
    doc.width / 2,
    curY,
    10,
    true,
    [0.1, 0.1, 0.1],
    "center",
  );
  curY -= 18;

  // Employee Table
  const cols = [
    { label: "Sr. No.", width: 45, align: "center" as const },
    { label: "Employee No", width: 110, align: "left" as const },
    { label: "Name", width: 180, align: "left" as const },
    { label: "Prof Tax Basic", width: 95, align: "right" as const },
    { label: "Amount", width: 93, align: "right" as const },
  ];

  doc.drawRect(
    margin,
    curY - 18,
    contentWidth,
    18,
    [0.93, 0.95, 0.98],
    [0.75, 0.8, 0.85],
  );
  let cx = margin;
  for (const c of cols) {
    const tx =
      c.align === "right"
        ? cx + c.width - 4
        : c.align === "center"
          ? cx + c.width / 2
          : cx + 4;
    doc.drawText(c.label, tx, curY - 13, 8, true, [0.1, 0.1, 0.1], c.align);
    cx += c.width;
  }
  curY -= 18;

  const rowHeight = 14;
  data.records.forEach((r, idx) => {
    const bg: [number, number, number] | undefined =
      idx % 2 === 1 ? [0.98, 0.98, 0.99] : undefined;
    doc.drawRect(
      margin,
      curY - rowHeight,
      contentWidth,
      rowHeight,
      bg,
      [0.85, 0.85, 0.88],
      0.3,
    );

    let rx = margin;
    doc.drawText(
      String(r.slNo),
      rx + cols[0]!.width / 2,
      curY - 10,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "center",
    );
    rx += cols[0]!.width;
    doc.drawText(r.employeeNo, rx + 4, curY - 10, 7.5, false, [0.2, 0.2, 0.2]);
    rx += cols[1]!.width;
    doc.drawText(r.name, rx + 4, curY - 10, 7.5, true, [0.1, 0.1, 0.1]);
    rx += cols[2]!.width;
    doc.drawText(
      formatINR(r.grossSalary),
      rx + cols[3]!.width - 4,
      curY - 10,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += cols[3]!.width;
    doc.drawText(
      formatINR(r.ptAmount),
      rx + cols[4]!.width - 4,
      curY - 10,
      7.5,
      true,
      [0.1, 0.1, 0.1],
      "right",
    );

    curY -= rowHeight;
  });

  curY -= 16;

  // Summary Table
  doc.drawText("Summary", margin, curY, 8.5, true);
  curY -= 12;

  const sCols = [
    { label: "Rate", width: 70 },
    { label: "No of employees", width: 100 },
    { label: "Amount", width: 80 },
  ];
  doc.drawRect(
    margin,
    curY - 14,
    250,
    14,
    [0.93, 0.95, 0.98],
    [0.75, 0.8, 0.85],
    0.5,
  );
  doc.drawText("Rate", margin + 8, curY - 10, 7.5, true);
  doc.drawText("No of employees", margin + 80, curY - 10, 7.5, true);
  doc.drawText(
    "Amount",
    margin + 240,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  curY -= 14;

  let totCount = 0;
  let totAmt = 0;

  for (const s of data.slabsSummary) {
    totCount += s.employeeCount;
    totAmt += s.amount;
    doc.drawRect(
      margin,
      curY - 13,
      250,
      13,
      undefined,
      [0.85, 0.85, 0.88],
      0.3,
    );
    doc.drawText(
      s.rate === 0 ? "0 Exempted" : String(s.rate),
      margin + 8,
      curY - 9,
      7.5,
      false,
    );
    doc.drawText(String(s.employeeCount), margin + 110, curY - 9, 7.5, false);
    doc.drawText(
      formatINR(s.amount),
      margin + 240,
      curY - 9,
      7.5,
      false,
      [0.1, 0.1, 0.1],
      "right",
    );
    curY -= 13;
  }

  // Summary Total Row
  doc.drawRect(
    margin,
    curY - 14,
    250,
    14,
    [0.94, 0.94, 0.96],
    [0.6, 0.6, 0.65],
    0.5,
  );
  doc.drawText("Total", margin + 8, curY - 10, 7.5, true);
  doc.drawText(String(totCount), margin + 110, curY - 10, 7.5, true);
  doc.drawText(
    formatINR(totAmt),
    margin + 240,
    curY - 10,
    7.5,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  curY -= 36;

  // Signatures
  doc.drawText("PREPARED BY", margin + 40, curY, 8, true, [0.35, 0.35, 0.35]);
  doc.drawText(
    "CHECKED BY",
    doc.width - margin - 120,
    curY,
    8,
    true,
    [0.35, 0.35, 0.35],
  );

  return doc.build();
}

export function downloadPtMonthlyStatementPdf(data: PtMonthlyStatementData) {
  const pdf = generatePtMonthlyStatementPdf(data);
  triggerDownload(
    pdf,
    `Profession_Tax_Monthly_Statement_${data.periodMonth}_${data.state}.pdf`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. KARNATAKA FORM 5A MONTHLY STATEMENT (PDF)
// ─────────────────────────────────────────────────────────────────────────────

export interface KarnatakaForm5AData {
  workspaceName: string;
  companyAddress: string;
  periodMonth: string;
  isDraft?: boolean;
  ptoCircleNo?: string;
  registrationCertificateNo?: string;
  totalTax: number;
  amountInWords: string;
  returnDate?: string;
  records: Array<{
    slNo: number;
    employeeNo: string;
    name: string;
    joinDate: string;
    grossSalary: number;
    ptAmount: number;
  }>;
  slabs: Array<{
    slabLabel: string;
    rate: number;
    employeeCount: number;
    amount: number;
  }>;
}

export function generateKarnatakaForm5APdf(data: KarnatakaForm5AData): string {
  const doc = new PdfDocBuilder(false); // 2-page document matching reference!

  // PAGE 1: Formal Return Form
  doc.addPage();
  const margin = 36;
  const contentWidth = doc.width - margin * 2;
  let curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 14;
  }

  doc.drawText(
    "Page 1 of 2",
    doc.width - margin,
    curY,
    8,
    false,
    [0.45, 0.45, 0.45],
    "right",
  );
  doc.drawText(
    "Form - 5A (See Rule 11A)",
    doc.width / 2,
    curY,
    11,
    true,
    [0.1, 0.2, 0.4],
    "center",
  );
  curY -= 16;

  doc.drawText(
    "RETURN OF TAX PAYABLE BY EMPLOYER UNDER SUB-SECTION(1) OF SECTION 6-A OF THE",
    doc.width / 2,
    curY,
    8,
    true,
    [0.1, 0.1, 0.1],
    "center",
  );
  curY -= 12;
  doc.drawText(
    "KARNATAKA ON PROFESSION, TRADE, CALLINGS AND EMPLOYMENT ACT 1976.",
    doc.width / 2,
    curY,
    8,
    true,
    [0.1, 0.1, 0.1],
    "center",
  );
  curY -= 16;

  doc.drawText(
    `Return on Tax Payable for the month ending on ${data.returnDate || "30/09/2026"}`,
    doc.width / 2,
    curY,
    8.5,
    false,
    [0.2, 0.2, 0.2],
    "center",
  );
  curY -= 20;

  // Employer Info Box
  doc.drawRect(
    margin,
    curY - 50,
    contentWidth,
    50,
    [0.98, 0.99, 1],
    [0.8, 0.85, 0.9],
    0.5,
  );
  doc.drawText(
    "Name and Address of the Employer :",
    margin + 10,
    curY - 14,
    8,
    true,
  );
  doc.drawText(
    data.workspaceName,
    margin + 175,
    curY - 14,
    8.5,
    true,
    [0.05, 0.2, 0.45],
  );
  doc.drawText(
    data.companyAddress,
    margin + 175,
    curY - 26,
    7.5,
    false,
    [0.35, 0.35, 0.35],
  );
  doc.drawText(
    `Registration Certificate No : ${data.registrationCertificateNo || "KTP-BLR-009876"}`,
    margin + 10,
    curY - 40,
    7.5,
    false,
  );
  doc.drawText(
    `PTO Circle No. : ${data.ptoCircleNo || "PTO Circle-04"}`,
    margin + 300,
    curY - 40,
    7.5,
    false,
  );
  curY -= 62;

  doc.drawText(
    "Number of employees during the month in respect of whom the tax payable is as under :-",
    margin,
    curY,
    8,
    true,
  );
  curY -= 12;

  // Slab table
  const stCols = [
    { label: "Sl No.", width: 45 },
    { label: "Employees whose monthly salaries or wages or both", width: 230 },
    { label: "No. of Employees", width: 85 },
    { label: "Rate of Tax", width: 75 },
    { label: "Amount of Tax Deducted", width: 88 },
  ];

  doc.drawRect(
    margin,
    curY - 18,
    contentWidth,
    18,
    [0.93, 0.95, 0.98],
    [0.75, 0.8, 0.85],
    0.5,
  );
  let stx = margin;
  for (const c of stCols) {
    const tx =
      c.label === "Sl No."
        ? stx + c.width / 2
        : c.label.includes("Salaries")
          ? stx + 4
          : stx + c.width - 4;
    doc.drawText(
      c.label,
      tx,
      curY - 13,
      7.5,
      true,
      [0.1, 0.1, 0.1],
      c.label === "Sl No."
        ? "center"
        : c.label.includes("Salaries")
          ? "left"
          : "right",
    );
    stx += c.width;
  }
  curY -= 18;

  let totalEmp = 0;
  data.slabs.forEach((s, idx) => {
    totalEmp += s.employeeCount;
    doc.drawRect(
      margin,
      curY - 15,
      contentWidth,
      15,
      undefined,
      [0.85, 0.85, 0.88],
      0.3,
    );
    let x = margin;
    doc.drawText(
      String(idx + 1),
      x + stCols[0]!.width / 2,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "center",
    );
    x += stCols[0]!.width;
    doc.drawText(s.slabLabel, x + 6, curY - 11, 7.5, false, [0.2, 0.2, 0.2]);
    x += stCols[1]!.width;
    doc.drawText(
      String(s.employeeCount),
      x + stCols[2]!.width - 6,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += stCols[2]!.width;
    doc.drawText(
      formatINR(s.rate),
      x + stCols[3]!.width - 6,
      curY - 11,
      7.5,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    x += stCols[3]!.width;
    doc.drawText(
      formatINR(s.amount),
      x + stCols[4]!.width - 6,
      curY - 11,
      7.5,
      true,
      [0.1, 0.1, 0.1],
      "right",
    );
    curY -= 15;
  });

  // Total
  doc.drawRect(
    margin,
    curY - 15,
    contentWidth,
    15,
    [0.94, 0.94, 0.96],
    [0.6, 0.6, 0.65],
    0.5,
  );
  doc.drawText("Total", margin + stCols[0]!.width + 6, curY - 11, 8, true);
  doc.drawText(
    String(totalEmp),
    margin + stCols[0]!.width + stCols[1]!.width + stCols[2]!.width - 6,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  doc.drawText(
    formatINR(data.totalTax),
    doc.width - margin - 6,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  curY -= 20;

  doc.drawText(
    "Add : Simple interest payable (if any) on the above amount at two percent per month : Rs. 0.00",
    margin,
    curY,
    7.5,
    false,
    [0.35, 0.35, 0.35],
  );
  curY -= 14;
  doc.drawText(
    `Grand Total : Rs. ${formatINR(data.totalTax)}`,
    margin,
    curY,
    8.5,
    true,
    [0.1, 0.45, 0.15],
  );
  curY -= 16;

  doc.drawText(
    `Amount paid by cheque no. _______  Dated _______ for Rs. ${formatINR(data.totalTax)}`,
    margin,
    curY,
    7.5,
    false,
  );
  curY -= 12;
  doc.drawText(
    "Name of the Bank: ________________________________________________",
    margin,
    curY,
    7.5,
    false,
  );
  curY -= 20;

  // Statutory declaration text
  const decl1 =
    "I certify that all the employees who are liable to pay tax in my employment during the period of return have been covered";
  const decl2 =
    "by the foregoing particulars. I also certify that the necessary revision in the amount of tax deductible from the salary or";
  const decl3 =
    "wages of the employees on account of variation in the salary or wages earned by them has been made wherever necessary.";
  doc.drawText(decl1, margin, curY, 7, false, [0.35, 0.35, 0.35]);
  curY -= 10;
  doc.drawText(decl2, margin, curY, 7, false, [0.35, 0.35, 0.35]);
  curY -= 10;
  doc.drawText(decl3, margin, curY, 7, false, [0.35, 0.35, 0.35]);
  curY -= 16;
  doc.drawText(
    "I solemnly declare that the above statements are true to the best of my knowledge and belief.",
    margin,
    curY,
    7.5,
    true,
  );
  curY -= 32;

  doc.drawText("Place: Bangalore", margin, curY, 8, false);
  doc.drawText(
    "Signature of the employer: _____________________",
    doc.width - margin - 220,
    curY,
    8,
    true,
  );
  curY -= 14;
  doc.drawText(
    `Date: ${data.returnDate || "13 Oct 2026"}`,
    margin,
    curY,
    8,
    false,
  );
  doc.drawText(
    "Status: Authorised Signatory",
    doc.width - margin - 220,
    curY,
    8,
    false,
  );

  // PAGE 2: Employee Annexure
  doc.addPage();
  curY = doc.height - margin;

  if (data.isDraft) {
    doc.drawDraftWatermark();
    curY -= 14;
  }

  doc.drawText(
    "Page 2 of 2",
    doc.width - margin,
    curY,
    8,
    false,
    [0.45, 0.45, 0.45],
    "right",
  );
  doc.drawText(
    data.workspaceName,
    doc.width / 2,
    curY,
    11,
    true,
    [0.05, 0.15, 0.3],
    "center",
  );
  curY -= 14;
  doc.drawText(
    data.companyAddress,
    doc.width / 2,
    curY,
    7.5,
    false,
    [0.35, 0.35, 0.35],
    "center",
  );
  curY -= 14;
  doc.drawText("LOCATION : Bangalore", margin, curY, 8, true);
  curY -= 10;

  const aCols = [
    { label: "Sl No", width: 40, align: "center" as const },
    { label: "Employee No", width: 105, align: "left" as const },
    { label: "Name", width: 170, align: "left" as const },
    { label: "Join Date", width: 85, align: "center" as const },
    { label: "Prof Tax Calculation", width: 110, align: "right" as const },
    { label: "Profession Tax", width: 85, align: "right" as const },
  ];

  doc.drawRect(
    margin,
    curY - 18,
    contentWidth,
    18,
    [0.93, 0.95, 0.98],
    [0.75, 0.8, 0.85],
  );
  let ax = margin;
  for (const c of aCols) {
    const tx =
      c.align === "right"
        ? ax + c.width - 4
        : c.align === "center"
          ? ax + c.width / 2
          : ax + 4;
    doc.drawText(c.label, tx, curY - 13, 7.5, true, [0.1, 0.1, 0.1], c.align);
    ax += c.width;
  }
  curY -= 18;

  let totGross = 0;
  const aRowHeight = 13.5;
  data.records.forEach((r, idx) => {
    totGross += r.grossSalary;
    const bg: [number, number, number] | undefined =
      idx % 2 === 1 ? [0.98, 0.98, 0.99] : undefined;
    doc.drawRect(
      margin,
      curY - aRowHeight,
      contentWidth,
      aRowHeight,
      bg,
      [0.85, 0.85, 0.88],
      0.3,
    );

    let rx = margin;
    doc.drawText(
      String(r.slNo),
      rx + aCols[0]!.width / 2,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "center",
    );
    rx += aCols[0]!.width;
    doc.drawText(r.employeeNo, rx + 4, curY - 10, 7, false, [0.2, 0.2, 0.2]);
    rx += aCols[1]!.width;
    doc.drawText(r.name, rx + 4, curY - 10, 7, true, [0.1, 0.1, 0.1]);
    rx += aCols[2]!.width;
    doc.drawText(
      r.joinDate,
      rx + aCols[3]!.width / 2,
      curY - 10,
      7,
      false,
      [0.3, 0.3, 0.3],
      "center",
    );
    rx += aCols[3]!.width;
    doc.drawText(
      formatINR(r.grossSalary),
      rx + aCols[4]!.width - 4,
      curY - 10,
      7,
      false,
      [0.2, 0.2, 0.2],
      "right",
    );
    rx += aCols[4]!.width;
    doc.drawText(
      formatINR(r.ptAmount),
      rx + aCols[5]!.width - 4,
      curY - 10,
      7,
      true,
      [0.1, 0.1, 0.1],
      "right",
    );

    curY -= aRowHeight;
  });

  // Sub Total
  doc.drawRect(
    margin,
    curY - 16,
    contentWidth,
    16,
    [0.94, 0.94, 0.96],
    [0.6, 0.6, 0.65],
    0.5,
  );
  doc.drawText(
    "Sub Total",
    margin +
      aCols[0]!.width +
      aCols[1]!.width +
      aCols[2]!.width +
      aCols[3]!.width -
      8,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  doc.drawText(
    formatINR(totGross),
    margin +
      aCols[0]!.width +
      aCols[1]!.width +
      aCols[2]!.width +
      aCols[3]!.width +
      aCols[4]!.width -
      4,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );
  doc.drawText(
    formatINR(data.totalTax),
    doc.width - margin - 4,
    curY - 11,
    8,
    true,
    [0.1, 0.1, 0.1],
    "right",
  );

  return doc.build();
}

export function downloadKarnatakaForm5APdf(data: KarnatakaForm5AData) {
  const pdf = generateKarnatakaForm5APdf(data);
  triggerDownload(
    pdf,
    `FORM_5A_Profession_Tax_Karnataka_${data.periodMonth}.pdf`,
  );
}
