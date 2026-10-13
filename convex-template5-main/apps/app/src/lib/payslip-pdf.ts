export interface PayslipData {
  workspaceName: string;
  periodMonth: string;
  startDate?: string;
  endDate?: string;
  paymentDate?: number;
  employeeName: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
  employeeId?: string;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  grossSalary: number;
  lopDays: number;
  lopDeduction: number;
  customDeductions: { name: string; amount: number }[];
  totalCustomDeductions: number;
  statutoryDeductions: { name: string; amount: number; isConfigured?: boolean }[];
  totalStatutoryDeductions: number;
  employerContributions?: { name: string; amount: number; isConfigured?: boolean }[];
  totalEmployerContributions?: number;
  totalDeductions: number;
  netSalary: number;
}

/**
 * Format numbers using the Indian numbering system (e.g. 1,50,000.00)
 */
export function formatIndianCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?"); // Keep ASCII printable for Type 1 Helvetica
}

/**
 * Cross-platform byte length calculator using TextEncoder (Web standard).
 * Works in browsers, Cloudflare Workers, Node.js, and Deno.
 */
const _encoder = new TextEncoder();
function byteLength(str: string): number {
  return _encoder.encode(str).byteLength;
}

/**
 * Generates a clean, standards-compliant PDF 1.4 binary document for an employee payslip.
 * Completely zero external dependencies, 100% reliable across browsers, mobile & node.
 */
export function generatePayslipPdfString(data: PayslipData): string {
  const pageWidth = 595.28; // A4 width in pt
  const pageHeight = 841.89; // A4 height in pt
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28 pt

  const streamLines: string[] = [];

  // Helper for drawing rectangles
  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth: number = 1
  ) => {
    streamLines.push("q");
    streamLines.push(`${lineWidth} w`);
    if (strokeRgb) {
      streamLines.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
    }
    if (fillRgb) {
      streamLines.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg`);
    }
    streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fillRgb && strokeRgb) {
      streamLines.push("B");
    } else if (fillRgb) {
      streamLines.push("f");
    } else if (strokeRgb) {
      streamLines.push("S");
    }
    streamLines.push("Q");
  };

  // Helper for drawing lines
  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeRgb: [number, number, number] = [0.8, 0.8, 0.8],
    lineWidth: number = 0.75
  ) => {
    streamLines.push("q");
    streamLines.push(`${lineWidth} w`);
    streamLines.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
    streamLines.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    streamLines.push("Q");
  };

  // Helper for text rendering
  const drawText = (
    text: string,
    x: number,
    y: number,
    fontSize: number = 10,
    isBold: boolean = false,
    colorRgb: [number, number, number] = [0.1, 0.1, 0.1],
    align: "left" | "right" | "center" = "left"
  ) => {
    const escaped = escapePdfText(text);
    const font = isBold ? "/F2" : "/F1";
    
    // Approximate text width calculation for Helvetica (avg char width ~ 0.55 * fontSize)
    let renderX = x;
    if (align === "right") {
      const approxWidth = text.length * (fontSize * 0.52);
      renderX = Math.max(margin, x - approxWidth);
    } else if (align === "center") {
      const approxWidth = text.length * (fontSize * 0.52);
      renderX = Math.max(margin, x - approxWidth / 2);
    }

    streamLines.push("BT");
    streamLines.push(`${font} ${fontSize} Tf`);
    streamLines.push(`${colorRgb[0]} ${colorRgb[1]} ${colorRgb[2]} rg`);
    streamLines.push(`1 0 0 1 ${renderX.toFixed(2)} ${y.toFixed(2)} Tm`);
    streamLines.push(`(${escaped}) Tj`);
    streamLines.push("ET");
  };

  // 1. Header Banner
  const headerY = pageHeight - margin - 55;
  drawRect(margin, headerY, contentWidth, 55, [0.09, 0.18, 0.32], undefined);
  drawText(data.workspaceName.toUpperCase(), margin + 20, headerY + 32, 16, true, [1, 1, 1]);
  drawText(`PAYSLIP FOR ${data.periodMonth}`, margin + 20, headerY + 14, 11, false, [0.85, 0.9, 0.98]);

  // Payment date badge on header right
  const payDateStr = data.paymentDate
    ? new Date(data.paymentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Draft / Pending";
  drawText(`Date: ${payDateStr}`, margin + contentWidth - 20, headerY + 22, 9, false, [0.8, 0.88, 0.98], "right");

  // 2. Employee Details Card
  const empCardY = headerY - 75;
  drawRect(margin, empCardY, contentWidth, 68, [0.97, 0.98, 0.99], [0.85, 0.88, 0.92], 0.75);

  const col1X = margin + 15;
  const col2X = margin + 150;
  const col3X = margin + 280;
  const col4X = margin + 400;

  // Row 1
  drawText("Employee Name:", col1X, empCardY + 48, 8, false, [0.45, 0.5, 0.55]);
  drawText(data.employeeName || "N/A", col1X, empCardY + 35, 10, true, [0.1, 0.15, 0.2]);

  drawText("Department:", col2X, empCardY + 48, 8, false, [0.45, 0.5, 0.55]);
  drawText(data.department || "General", col2X, empCardY + 35, 9.5, true, [0.1, 0.15, 0.2]);

  drawText("Designation:", col3X, empCardY + 48, 8, false, [0.45, 0.5, 0.55]);
  drawText(data.designation || "Staff", col3X, empCardY + 35, 9.5, true, [0.1, 0.15, 0.2]);

  drawText("Loss of Pay Days:", col4X, empCardY + 48, 8, false, [0.45, 0.5, 0.55]);
  drawText(String(data.lopDays || 0), col4X, empCardY + 35, 10, true, [0.8, 0.2, 0.2]);

  // Row 2
  drawText("Email Address:", col1X, empCardY + 18, 8, false, [0.45, 0.5, 0.55]);
  drawText(data.email || "-", col1X, empCardY + 7, 8.5, false, [0.2, 0.25, 0.3]);

  drawText("Pay Period:", col2X, empCardY + 18, 8, false, [0.45, 0.5, 0.55]);
  const periodRange = data.startDate && data.endDate ? `${data.startDate} to ${data.endDate}` : data.periodMonth;
  drawText(periodRange, col2X, empCardY + 7, 8.5, false, [0.2, 0.25, 0.3]);

  drawText("Payment Status:", col3X, empCardY + 18, 8, false, [0.45, 0.5, 0.55]);
  drawText("Finalized", col3X, empCardY + 7, 8.5, true, [0.1, 0.6, 0.25]);

  drawText("Currency:", col4X, empCardY + 18, 8, false, [0.45, 0.5, 0.55]);
  drawText("INR (Rs.)", col4X, empCardY + 7, 8.5, true, [0.2, 0.25, 0.3]);

  // 3. Two-Column Table: Earnings vs Deductions
  const tableY = empCardY - 215;
  const tableHeight = 205;
  const halfWidth = (contentWidth - 10) / 2; // 252.64 pt

  // Left Column: Earnings Box
  drawRect(margin, tableY, halfWidth, tableHeight, [1, 1, 1], [0.82, 0.85, 0.88], 0.75);
  // Earnings Header Bar
  drawRect(margin, tableY + tableHeight - 24, halfWidth, 24, [0.93, 0.95, 0.98], [0.82, 0.85, 0.88], 0.75);
  drawText("EARNINGS", margin + 12, tableY + tableHeight - 16, 9.5, true, [0.12, 0.2, 0.35]);
  drawText("AMOUNT (INR)", margin + halfWidth - 12, tableY + tableHeight - 16, 8.5, true, [0.12, 0.2, 0.35], "right");

  // Right Column: Deductions Box
  const deductionsX = margin + halfWidth + 10;
  drawRect(deductionsX, tableY, halfWidth, tableHeight, [1, 1, 1], [0.82, 0.85, 0.88], 0.75);
  // Deductions Header Bar
  drawRect(deductionsX, tableY + tableHeight - 24, halfWidth, 24, [0.93, 0.95, 0.98], [0.82, 0.85, 0.88], 0.75);
  drawText("DEDUCTIONS", deductionsX + 12, tableY + tableHeight - 16, 9.5, true, [0.12, 0.2, 0.35]);
  drawText("AMOUNT (INR)", deductionsX + halfWidth - 12, tableY + tableHeight - 16, 8.5, true, [0.12, 0.2, 0.35], "right");

  // Earnings Rows
  let curEarningY = tableY + tableHeight - 42;
  const rowStep = 18;

  // Basic Salary
  drawText("Basic Salary", margin + 12, curEarningY, 9, false, [0.2, 0.2, 0.2]);
  drawText(formatIndianCurrency(data.basicSalary), margin + halfWidth - 12, curEarningY, 9, false, [0.1, 0.1, 0.1], "right");
  drawLine(margin + 10, curEarningY - 5, margin + halfWidth - 10, curEarningY - 5, [0.92, 0.93, 0.95], 0.5);
  curEarningY -= rowStep;

  // Allowances
  const safeAllowances = Array.isArray(data.allowances) ? data.allowances : [];
  for (const allow of safeAllowances.slice(0, 7)) {
    drawText(allow.name || "Allowance", margin + 12, curEarningY, 9, false, [0.25, 0.25, 0.25]);
    drawText(formatIndianCurrency(allow.amount), margin + halfWidth - 12, curEarningY, 9, false, [0.1, 0.1, 0.1], "right");
    drawLine(margin + 10, curEarningY - 5, margin + halfWidth - 10, curEarningY - 5, [0.92, 0.93, 0.95], 0.5);
    curEarningY -= rowStep;
  }

  // Deductions Rows
  let curDeductY = tableY + tableHeight - 42;

  // Loss of Pay
  if (data.lopDeduction > 0) {
    drawText("Loss of Pay (LOP)", deductionsX + 12, curDeductY, 9, false, [0.75, 0.2, 0.2]);
    drawText(formatIndianCurrency(data.lopDeduction), deductionsX + halfWidth - 12, curDeductY, 9, false, [0.75, 0.2, 0.2], "right");
    drawLine(deductionsX + 10, curDeductY - 5, deductionsX + halfWidth - 10, curDeductY - 5, [0.92, 0.93, 0.95], 0.5);
    curDeductY -= rowStep;
  }

  // Statutory Deductions (PF, ESI, PT, TDS)
  const safeStatutory = Array.isArray(data.statutoryDeductions) ? data.statutoryDeductions : [];
  for (const stat of safeStatutory) {
    if (stat.amount > 0) {
      drawText(stat.name, deductionsX + 12, curDeductY, 8.5, false, [0.2, 0.2, 0.2]);
      drawText(formatIndianCurrency(stat.amount), deductionsX + halfWidth - 12, curDeductY, 9, false, [0.1, 0.1, 0.1], "right");
      drawLine(deductionsX + 10, curDeductY - 5, deductionsX + halfWidth - 10, curDeductY - 5, [0.92, 0.93, 0.95], 0.5);
      curDeductY -= rowStep;
    }
  }

  // Custom Deductions
  const safeCustom = Array.isArray(data.customDeductions) ? data.customDeductions : [];
  for (const cust of safeCustom) {
    if (cust.amount > 0) {
      drawText(cust.name, deductionsX + 12, curDeductY, 8.5, false, [0.25, 0.25, 0.25]);
      drawText(formatIndianCurrency(cust.amount), deductionsX + halfWidth - 12, curDeductY, 9, false, [0.1, 0.1, 0.1], "right");
      drawLine(deductionsX + 10, curDeductY - 5, deductionsX + halfWidth - 10, curDeductY - 5, [0.92, 0.93, 0.95], 0.5);
      curDeductY -= rowStep;
    }
  }

  // Earnings Total Footer
  const totalBarHeight = 24;
  drawRect(margin, tableY, halfWidth, totalBarHeight, [0.96, 0.97, 0.99], [0.82, 0.85, 0.88], 0.75);
  drawText("TOTAL GROSS EARNINGS", margin + 12, tableY + 8, 9, true, [0.1, 0.15, 0.25]);
  drawText(`INR ${formatIndianCurrency(data.grossSalary)}`, margin + halfWidth - 12, tableY + 8, 9.5, true, [0.1, 0.15, 0.25], "right");

  // Deductions Total Footer
  drawRect(deductionsX, tableY, halfWidth, totalBarHeight, [0.96, 0.97, 0.99], [0.82, 0.85, 0.88], 0.75);
  drawText("TOTAL DEDUCTIONS", deductionsX + 12, tableY + 8, 9, true, [0.7, 0.15, 0.15]);
  drawText(`INR ${formatIndianCurrency(data.totalDeductions)}`, deductionsX + halfWidth - 12, tableY + 8, 9.5, true, [0.7, 0.15, 0.15], "right");

  // 4. Net Salary Payable Box (Prominent highlight)
  const netPayY = tableY - 48;
  drawRect(margin, netPayY, contentWidth, 38, [0.94, 0.99, 0.95], [0.22, 0.65, 0.35], 1.2);
  drawText("NET SALARY PAYABLE (TAKE-HOME)", margin + 16, netPayY + 14, 11, true, [0.1, 0.45, 0.2]);
  drawText(`INR ${formatIndianCurrency(data.netSalary)}`, margin + contentWidth - 16, netPayY + 13, 14, true, [0.08, 0.5, 0.22], "right");

  // 5. Informational Employer Statutory Contributions
  const empContrY = netPayY - 80;
  drawRect(margin, empContrY, contentWidth, 70, [0.98, 0.98, 0.99], [0.88, 0.9, 0.92], 0.75);
  drawText("INFORMATIONAL: EMPLOYER STATUTORY CONTRIBUTIONS", margin + 12, empContrY + 54, 8.5, true, [0.35, 0.4, 0.5]);
  drawText("(Contributed by employer directly to government authorities; not deducted from employee gross salary)", margin + 12, empContrY + 43, 7.5, false, [0.5, 0.55, 0.6]);

  const safeEmpContr = Array.isArray(data.employerContributions) ? data.employerContributions : [];
  let contrX = margin + 15;
  for (const c of safeEmpContr.slice(0, 4)) {
    if (c.amount > 0) {
      drawText(c.name, contrX, empContrY + 24, 7.5, false, [0.4, 0.45, 0.5]);
      drawText(`INR ${formatIndianCurrency(c.amount)}`, contrX, empContrY + 12, 8.5, true, [0.15, 0.2, 0.3]);
      contrX += 120;
    }
  }

  const totalEmployerContr = data.totalEmployerContributions ?? 0;
  drawText("Total Employer Contribution:", margin + contentWidth - 180, empContrY + 24, 8, false, [0.4, 0.45, 0.5]);
  drawText(`INR ${formatIndianCurrency(totalEmployerContr)}`, margin + contentWidth - 15, empContrY + 12, 9, true, [0.1, 0.15, 0.25], "right");

  // 6. Footer & Certification
  const footerY = margin + 15;
  drawLine(margin, footerY + 22, margin + contentWidth, footerY + 22, [0.85, 0.88, 0.9], 0.5);
  drawText("This is an electronically generated document. It does not require a physical signature.", margin, footerY + 10, 8, false, [0.55, 0.6, 0.65]);
  drawText("Powered by IndiaPay - Indian Payroll Management SaaS", margin + contentWidth, footerY + 10, 8, false, [0.55, 0.6, 0.65], "right");

  // Assemble Complete PDF Structure
  const streamContent = streamLines.join("\n");
  const streamLength = byteLength(streamContent);

  const objects: string[] = [];

  // Object 1: Catalog
  objects.push(`1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj`);

  // Object 2: Pages
  objects.push(`2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj`);

  // Object 3: Page
  objects.push(`3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}]
  /Resources <<
    /Font <<
      /F1 4 0 R
      /F2 5 0 R
    >>
  >>
  /Contents 6 0 R
>>
endobj`);

  // Object 4: Font Regular (Helvetica)
  objects.push(`4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj`);

  // Object 5: Font Bold (Helvetica-Bold)
  objects.push(`5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj`);

  // Object 6: Content Stream
  objects.push(`6 0 obj
<<
  /Length ${streamLength}
>>
stream
${streamContent}
endstream
endobj`);

  let header = "%PDF-1.4\n%âãÏÓ\n";
  let body = "";
  const xrefOffsets: number[] = [0];

  let currentOffset = byteLength(header);

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(currentOffset);
    const objStr = objects[i] + "\n";
    body += objStr;
    currentOffset += byteLength(objStr);
  }

  const startXref = currentOffset;

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, "0");
    xref += `${offsetStr} 00000 n \n`;
  }

  const trailer = `trailer
<<
  /Size ${objects.length + 1}
  /Root 1 0 R
>>
startxref
${startXref}
%%EOF\n`;

  return header + body + xref + trailer;
}

/**
 * Creates a downloadable binary Blob for the Payslip PDF
 */
export function generatePayslipPdfBlob(data: PayslipData): Blob {
  const pdfString = generatePayslipPdfString(data);
  return new Blob([pdfString], { type: "application/pdf" });
}

/**
 * Client-side triggers direct download of the generated PDF file
 */
export function downloadPayslipPdf(data: PayslipData): void {
  const blob = generatePayslipPdfBlob(data);
  const cleanName = (data.employeeName || "Employee").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanPeriod = (data.periodMonth || "Period").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Payslip_${cleanName}_${cleanPeriod}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Triggers clean print view for native browser printer / PDF print
 */
export function printPayslip(): void {
  window.print();
}
