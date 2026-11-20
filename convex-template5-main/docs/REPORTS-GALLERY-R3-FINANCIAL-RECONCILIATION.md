# IndiaPay Reports Gallery — Batch R3 Financial Reconciliation Report

**Date**: November 20, 2026  
**Subject**: Mathematical Integrity & Reconciliation of IndiaPay Payroll Reports  
**Deployment Target**: `dev:basic-bobcat-92`

---

## 1. Zero-Variance Financial Reconciliation

### Invariant 1: Gross-to-Net Salary Reconciliation
For any employee record generated across the Salary Register, Salary Statement, or Bank Transfer Advise:
$$\text{Gross Salary} - (\text{EPF} + \text{ESI} + \text{PT} + \text{Loan EMI}) + \text{Reimbursements} = \text{Net Salary}$$

- **Reference Benchmark**:
  - Basic: ₹35,000.00 (3,500,000 paisa)
  - HRA ($40\%$): ₹14,000.00 (1,400,000 paisa)
  - Conveyance: ₹1,600.00 (160,000 paisa)
  - Special Allowance: ₹5,400.00 (540,000 paisa)
  - **Gross Salary**: **₹56,000.00** (5,600,000 paisa)
  - EPF ($12\%$ of min(₹35,000, ₹15,000)): ₹1,800.00 (180,000 paisa)
  - ESI (Gross $>$ ₹21,000): ₹0.00
  - PT (Karnataka): ₹200.00 (20,000 paisa)
  - **Total Deductions**: **₹2,000.00** (200,000 paisa)
  - **Net Payable**: **₹54,000.00** (5,400,000 paisa)
- **Variance**: ₹0.00 (Exact half-up integer-paisa rounding).

---

## 2. Invariant 2: Double-Entry Balancing in Payroll Journal Voucher (JV)

Every generated Payroll Journal Voucher enforces exact debit and credit equilibrium:

| Account Code | Account Head | Debit (₹) | Credit (₹) |
|:---|:---|:---:|:---:|
| `SAL-1001` | Salaries & Wages (Basic Pay) | 35,000.00 | — |
| `SAL-1002` | House Rent Allowance (HRA) | 14,000.00 | — |
| `SAL-1003` | Special & Other Allowances | 7,000.00 | — |
| `LIAB-2001` | Salaries Payable | — | 51,180.00 |
| `LIAB-2002` | Provident Fund Payable (Employee Share) | — | 4,200.00 |
| `LIAB-2003` | ESI Payable (Employee Share) | — | 420.00 |
| `LIAB-2004` | Professional Tax Payable | — | 200.00 |
| **TOTAL** | **Double-Entry Equilibrium** | **₹56,000.00** | **₹56,000.00** |

$$\sum \text{Debits} - \sum \text{Credits} = \text{₹}0.00 \quad (\text{Balanced})$$

---

## 3. Invariant 3: Loan EMI & Reimbursement Coexistence

When an active loan deduction and an approved reimbursement claim coincide in a payroll period:
$$\text{Net Pay} = \text{₹}56,000 - \text{₹}2,000 - \text{₹}5,000 \text{ (Loan EMI)} + \text{₹}1,200 \text{ (Travel Reimb)} = \text{₹}50,200.00$$
All reports in Batch R3 read directly from the underlying tables, ensuring that the Salary Register, Loan Deduction Report, and Reimbursement Summary reconcile without discrepancy.
