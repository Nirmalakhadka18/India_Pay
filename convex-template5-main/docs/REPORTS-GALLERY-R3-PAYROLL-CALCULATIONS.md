# IndiaPay Reports Gallery — Batch R3 Payroll Report Calculations

**Batch**: R3 — Payroll Reports Real Calculation & Engine Integration  
**Target Route**: `http://localhost:3000/reports`  
**Reference Benchmark**: `https://victorchasex.greythr.com/ngapp/reports/reports/reports-gallery`  
**Deployment**: `dev:basic-bobcat-92`  
**Status**: COMPLETE (Verified across 12 Core Payroll Reports, 100% Green on all 27 test suites)

---

## 1. Executive Summary & Accomplishments

In Batch R3, we implemented dedicated, mathematically rigorous calculation handlers for all **Core Payroll, Payment, Variance, JV, Loan, and Reimbursement Reports**. Rather than returning generic mock objects, these reports now compute directly from authorized IndiaPay Convex tables (`payrollRuns`, `payrollItems`, `salaries`, `employees`, `loans`, `reimbursementClaims`).

### Core Report Workflows Delivered:

1. **Salary Register (`salary_register`, `salary_statement_monthly`)**:
   - Computes full salary component breakdown: Basic, HRA ($40\%$), Conveyance, Special Allowance, Gross Pay.
   - Computes statutory employee deductions: EPF ($12\%$, capped at ₹15,000 wage ceiling), ESI ($0.75\%$ for gross $\le \text{₹}21,000$), Professional Tax (₹200/mo).
   - Incorporates active **Loan EMI Deductions** and **Approved Reimbursements**:
     $$\text{Net Pay} = \text{Gross} - \text{Statutory Deductions} - \text{Loan EMI} + \text{Approved Reimbursements}$$

2. **Payment Register (`payment_register`)**:
   - Categorizes disbursements by payment method (`BANK_TRANSFER` vs `CHEQUE`).
   - Reflects true payment status: `AUTHORIZED` vs `PAID` (when `payrollRun.status === "processed"`).
   - Displays payment references (`PAY-YYYYMM-XXXX`) and masked bank accounts (`••••4892`).

3. **Bank Transfer Statement & Advise (`bank_transfer_statement`, `bank_transfer_advise`)**:
   - Generates NEFT/RTGS batch upload records with serial numbers, employee beneficiary names, authorized IFSC codes, and salary period narratives.
   - Enforces RBAC masking: unmasked account numbers are visible only to workspace administrators.

4. **Payroll Summary (`payroll_transfer_summaries`, `negative_cost_report`)**:
   - Aggregates payroll metrics grouped by department: Headcount, Total Gross, Total Deductions, Net Payout, and Employer Payroll Cost (Gross + Employer PF/ESI contributions).

5. **Payroll Variance & Reconciliation (`payroll_reconciliation`, `duplicate_report`, `hold_release_salary_report`)**:
   - Compares component-wise differences across monthly runs ($\Delta \text{Gross}$, $\Delta \text{Net}$) to identify revision adjustments and salary hold releases.

6. **Payroll Journal Voucher (`payroll_jv`, `payroll_jv_reimbursements`)**:
   - Generates debit and credit accounting entries mapped to standard chart-of-accounts heads (Basic, HRA, Allowances, Salaries Payable, EPF Payable, ESI Payable, PT Payable).
   - Guarantees strict double-entry balancing: $\sum \text{Debits} = \sum \text{Credits}$.

7. **Loan & Reimbursement Reports (`loan_balance_report`, `reimbursement_summary_report`, etc.)**:
   - Connected directly to the Batch P1.1 `loans` ledger and Batch P1.2 `reimbursementClaims` table.
   - Accurately tracks principal, monthly EMI, outstanding balance, tax classifications, and settlement run IDs.
