# IndiaPay — Indian Payroll & Compliance SaaS Platform
## Executive Run Guide for Review & Verification

Welcome to **IndiaPay**, an enterprise-grade Indian Payroll & Statutory Compliance SaaS platform.

This package includes the complete source code, statutory reporting engines, multi-state tax algorithms, automated test suites, and official reference documents.

---

### 1. Prerequisites
- **Node.js**: v20 or higher (v20, v22, or v24 supported)
- **Bun**: v1.1+ (Recommended for ultra-fast builds and tests) — [https://bun.sh](https://bun.sh)  
  *(Alternative: Node.js with `npm` or `pnpm`)*

---

### 2. Quick Start (Run Locally in 2 Minutes)

#### Step 1: Install Dependencies
Open your terminal in this directory and run:
```bash
bun install
```
*(Or with npm: `npm install`)*

#### Step 2: Start the Web Application
```bash
bun run dev:app
```
*(Or with npm: `npm run dev:app`)*

The application will start on:
👉 **http://localhost:3000**

---

### 3. Login Credentials

Pre-configured credentials with live payroll and statutory records:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@indiapaypayroll.com` | `AdminTest@2026!` | Full payroll management, runs, and statutory reporting |
| **Owner** | `owner@indiapaypayroll.com` | `OwnerTest@2026!` | Executive approval, audit oversight, and company financials |

---

### 4. Viewing Statutory Reports & Compliance Filing
Once logged in as Admin:
1. Navigate to **Reports** (`http://localhost:3000/reports`) in the left navigation sidebar.
2. Review the preserved **Payroll History** table at the top.
3. Scroll to the **Statutory Compliance Reports** section below:
   - **ESI (Employees' State Insurance)**:
     - *ESI Monthly Statement* (Vector PDF 1.4)
     - *ESI Challan Report* (SBI ESIC Pay-in-Slip PDF)
     - *ESI Monthly Report Upload Format* (Official 6-column Excel `.xlsx`)
   - **PF (Provident Fund — EPFO & EPS)**:
     - *PF Monthly Statement* (Multi-page PDF register)
     - *PF Combined Challan Report V1* (TRRN Combined Challan A/C 1, 2, 10, 21, 22 PDF)
     - *PF ECR Format* (Official 11-field `#~#` delimited TXT and 13-column Excel)
   - **PT (Professional Tax)**:
     - *Profession Tax Monthly Statement — Any State* (Multi-state slab summary PDF)
     - *Karnataka Form 5A Monthly Statement* (Rule 11A statutory return PDF)
4. Click **"Generate Preview"** on any report to inspect the interactive modal with tabular records, printable view, and reconciliation badge.
5. Click **"Download"** to generate the authentic PDF/Excel/TXT file on your machine.

---

### 5. Running Automated Test Suites
Run the verified unit and compliance test suites:

```bash
# Run statutory audit suite (15/15 tests PASS)
bun test packages/backend/convex/statutoryReports.test.ts

# Run core statutory payroll calculation engine (24/24 tests PASS)
bun test packages/backend/convex/statutory.test.ts

# Run EPFO ECR format validation suite (15/15 tests PASS)
bun test packages/backend/convex/epfoEcr.test.ts

# Run Multi-state Professional Tax suite (14/14 tests PASS)
bun test packages/backend/convex/professionalTax.test.ts

# Run static TypeScript typecheck (0 errors)
bun run --cwd apps/app typecheck

# Run Biome linter (0 errors / 0 warnings across 74 files)
bun run --cwd apps/app lint
```

---

### 6. Reference Reports
The official layout and format references provided for this audit are archived in the `reference_reports/` directory for direct comparison.

---

### 7. Documentation
For the complete technical architecture, mathematical formulas, legal statutes, and compliance verification report, refer to:
- **`FULL_DAY_REPORT.txt`**
