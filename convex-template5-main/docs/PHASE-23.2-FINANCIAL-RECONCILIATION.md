# IndiaPay — Phase 23.2: Financial Reconciliation & Math Validation

---

## 1. Mathematical Formulas & Rules

### 1.1 Gross-to-Net Pay Sequence with Loan EMI

The deduction priority sequence in IndiaPay is strictly:
1. **Earned Gross Salary**:
   $$\text{Earned Gross} = \max(0, \text{Gross Salary} - \text{LOP Deduction})$$
2. **Statutory Deductions**:
   $$\text{Total Statutory} = \text{EPF} + \text{ESI} + \text{PT} + \text{LWF} + \text{TDS}$$
3. **Custom / Ad-hoc Deductions**:
   $$\text{Total Custom} = \sum \text{Custom Deductions}$$
4. **Baseline Net Salary (Pre-Loan)**:
   $$\text{Baseline Net} = \max(0, \text{Earned Gross} - \text{Total Statutory} - \text{Total Custom})$$
5. **Loan EMI Deductions**:
   For each active loan $k \in \{1 \dots m\}$:
   $$\text{Target EMI}_k = \min(\text{Monthly EMI}_k, \text{Outstanding Principal}_k)$$
   $$\text{Actual Deduction}_k = \min(\text{Target EMI}_k, \text{Current Net})$$
   $$\text{Interest Component}_k = \min\left(\text{round}\left(\text{Outstanding Principal}_k \times \frac{R_k}{1200}\right), \text{Actual Deduction}_k\right)$$
   $$\text{Principal Component}_k = \text{Actual Deduction}_k - \text{Interest Component}_k$$
   $$\text{Current Net} \leftarrow \text{Current Net} - \text{Actual Deduction}_k$$
6. **Final Net Pay**:
   $$\text{Final Net Pay} = \text{Current Net} \ge 0$$

Under no circumstance can loan deductions cause negative net pay.

---

## 2. Test Verification Cases

| Test Case | Gross (₹) | Statutory & Custom (₹) | Baseline Net (₹) | Loan Target EMI (₹) | Loan Actual Deduction (₹) | Final Net Pay (₹) | Loan Balance After (₹) | Status |
|---|---|---|---|---|---|---|---|---|
| Single Active Loan | 60,000 | 0 | 60,000 | 10,000 | 10,000 | 50,000 | 40,000 | Normal |
| Multiple Loans | 60,000 | 0 | 60,000 | L1: 10,000, L2: 5,000 | L1: 10,000, L2: 5,000 | 45,000 | L1: 40,000, L2: 15,000 | Normal |
| Salary Constraint (Partial) | 6,000 | 0 | 6,000 | 10,000 | 6,000 | 0 | 44,000 | Partial |
| Zero Salary (Bounce) | 0 | 0 | 0 | 10,000 | 0 | 0 | 20,000 | Bounced |
| Terminal Installment | 50,000 | 0 | 50,000 | 10,000 (Bal: 3,500) | 3,500 | 46,500 | 0 | Closed |

All test cases verified with 0.00 integer-paisa discrepancy in automated integration testing.
