# IndiaPay Reports Gallery — Calculation Reference & Mathematical Principles

**Target Environment**: `dev:basic-bobcat-92`  
**Reference Benchmark**: `https://victorchasex.greythr.com/ngapp/reports/reports/reports-gallery`  
**Scope**: 192 Catalogued Reports across 27 greytHR Categories

---

## 1. Monetary Precision and Calculation Rules

To ensure strict zero-tolerance financial integrity:
1. **Integer Paisa Storage & Arithmetic**: All monetary quantities in IndiaPay reports are stored and computed in integer paisa ($1 \text{ INR} = 100 \text{ paisa}$).
2. **Rounding Protocol**: Standard half-up integer rounding (`Math.round`) is applied strictly at the individual component level before summing into gross, deduction, or net totals.
3. **Reconciliation Invariant**:
   $$\text{Net Pay} = \text{Gross Earnings} - \text{Statutory Deductions} - \text{Loan EMI} - \text{Other Deductions} + \text{Reimbursements}$$

---

## 2. Category Calculation Specifications

### Category 1: Payroll Payout & Register Reports (12 Reports)
- **Data Source**: `payrollRuns`, `payrollItems`, `employees`, `salaries`.
- **Payment Register**:
  - Summarizes payment method breakdown (`BANK_TRANSFER`, `CHEQUE`, `CASH`).
  - Columns: `Employee Code`, `Employee Name`, `Bank Name`, `Account Number (Masked)`, `IFSC`, `Gross Pay`, `Total Deductions`, `Net Payout`.
- **Bank Transfer Statement / Advise**:
  - Filtered by disbursement bank account; formatted for automated clearing/NEFT/RTGS batch upload.
- **Reimbursement Payout JV**:
  - Aggregates non-taxable vs taxable vouchers settled within the payroll cycle.

### Category 2: Payroll Control & Reconciliation (6 Reports)
- **Data Source**: Current month `payrollItems` vs Previous month `payrollItems`.
- **Payroll Variance / Difference Report**:
  $$\Delta \text{Gross} = \text{Gross}_{\text{Current}} - \text{Gross}_{\text{Previous}}$$
  $$\Delta \text{Headcount} = \text{Active}_{\text{Current}} - \text{Active}_{\text{Previous}}$$
- **Hold-Release Salary Report**:
  - Identifies employees flagged with `isSalaryOnHold: true`.

### Category 3: Statutory Provident Fund (PF) Reports (26 Reports)
- **Data Source**: `payrollItems` (PF component), `employees` (UAN, PF number, Date of Joining, Date of Exit).
- **Statutory Wage Ceiling**: ₹15,000 / month (unless higher voluntary pension opted).
- **Contribution Splits**:
  - **Employee Share**: $12\%$ of EPF Wages.
  - **Employer EPS (Pension)**: $8.33\%$ of EPF Wages (capped at $\text{₹}1,250$).
  - **Employer EPF (Difference)**: $12\% - \text{EPS Share} = 3.67\%$.
  - **EDLI (Insurance)**: $0.50\%$ of EPF Wages (capped at $\text{₹}75$).
  - **EPF Admin Charges**: $0.50\%$ of EPF Wages.
- **EPF Form 11 / Form 2**:
  - Standard statutory declaration & nominee allocation schedules.

### Category 4: Statutory ESI Reports (9 Reports)
- **Data Source**: `payrollItems`, `employees` (ESIC IP Number).
- **Eligibility Threshold**: Gross Wages $\le \text{₹}21,000$ per month ($\text{₹}25,000$ for persons with disability).
- **Contribution Rates**:
  - **Employee Share**: $0.75\%$ of Gross Wages.
  - **Employer Share**: $3.25\%$ of Gross Wages.
  - **Total ESIC Deposit**: $4.00\%$ of Gross Wages.
- **Form 5 Monthly Contribution Statement**:
  - Columns: IP Insurance Number, Insured Person Name, No. of Days Wages Paid, Total Amount of Wages, Employee Contribution, Employer Contribution.

### Category 5: Professional Tax (PT) Reports (3 Reports)
- **Data Source**: `payrollItems`, `employees` (Work Location / State).
- **State-Specific Slabs (e.g. Karnataka)**:
  - Gross $< \text{₹}15,000$: Nil
  - Gross $\ge \text{₹}15,000$: ₹200 / month.
- **Form 5 / 5A Annual & Monthly Statements**:
  - Aggregated by establishment registration number and designated PT circle.

### Category 6: Income Tax & TDS Reports (16 Reports)
- **Data Source**: `taxDeclarations`, `tdsChallans`, `payrollItems`.
- **Monthly TDS Challan**:
  - Summarizes Section 192 deductions, surcharge, cess ($4\%$), and deposit BSR codes.
- **Consolidated Tax Worksheet**:
  - Compares Old vs New Tax Regime options under Section 115BAC.

### Category 7: Loan & Advance Reports (4 Reports)
- **Data Source**: `loans`, `loanRepayments`, `payrollItems`.
- **Loan Balance Report**:
  - Opening Principal, Disbursed Amount, Monthly EMI Deducted, Outstanding Balance, Completion ETA.

### Category 8: Reimbursement Reports (7 Reports)
- **Data Source**: `reimbursementClaims`, `reimbursementCategories`, `payrollItems`.
- **Tax Classification Tracking**:
  - Separates `NON_TAXABLE_BUSINESS`, `POTENTIALLY_EXEMPT`, and `TAXABLE` vouchers.

### Categories 9–27: Workforce, Leave, Labour & State Factory Acts (109 Reports)
- **Data Source**: `employees`, `attendance`, `leaveRequests`, `companyCompliance`.
- **Core Registers**:
  - Form A: Central Employee Register.
  - Form B: Central Wage Register.
  - Form C: Central Loan / Recovery Register.
  - Form D: Central Attendance / Overtime Register.
  - Leave Balance & Muster Roll Schedules.
