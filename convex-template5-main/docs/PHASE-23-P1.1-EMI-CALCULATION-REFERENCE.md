# IndiaPay — Phase 23: P1.1 EMI Calculation Methodology & Reference

---

## 1. Mathematical Methodology

### 1.1 Standard Reducing Balance Methodology (Equated Monthly Installment - EMI)

For loans bearing an annual interest rate $R > 0$:

$$E = \frac{P \cdot r \cdot (1 + r)^n}{(1 + r)^n - 1}$$

Where:
- $P$ = Principal loan amount in paisa (integer: $₹ \times 100$)
- $R$ = Annual interest rate in percent (e.g. 10.0%)
- $r$ = Monthly interest rate = $\frac{R}{12 \times 100}$
- $n$ = Loan tenure in months
- $E$ = Equated Monthly Installment in paisa

### 1.2 Decimal-Safe Financial Arithmetic Strategy

To avoid IEEE-754 floating-point cumulative rounding errors:
1. Calculations are converted into integer paisa / cents (`Math.round(amount * 100)`).
2. Monthly interest component for period $m$ is computed on the beginning balance of month $m$:
   $$I_m = \text{round}(B_{m-1} \times r)$$
3. The principal component is:
   $$P_m = E - I_m$$
4. Ending balance is:
   $$B_m = B_{m-1} - P_m$$
5. In the final installment ($m = n$), the principal component absorbs the exact remaining balance:
   $$P_n = B_{n-1}$$
   $$E_n = P_n + I_n$$
   This ensures that $B_n \equiv 0$ strictly without fractional remainder leakage.

---

## 2. Zero-Interest Methodology (Salary Advances)

For interest-free loans ($R = 0\%$):
- Monthly Base Installment:
  $$E_{\text{base}} = \left\lfloor \frac{P}{n} \right\rfloor$$
- Final Installment:
  $$E_{\text{last}} = P - (E_{\text{base}} \times (n - 1))$$
This automatically absorbs any odd-paisa divisions into the terminal payment.

---

## 3. Reference Test Benchmarks

| Case | Principal (₹) | Annual Rate (%) | Tenure (Mo) | Expected Monthly EMI (₹) | Total Interest (₹) | Total Payable (₹) |
|---|---|---|---|---|---|---|
| Benchmark 1 | 100,000 | 10.0% | 12 | 8,792 | 5,499.05 | 105,499 |
| Zero-Interest | 60,000 | 0.0% | 6 | 10,000 | 0.00 | 60,000 |
| Zero-Interest Odd | 50,000 | 0.0% | 3 | 16,667 | 0.00 | 50,000 |
| Multi-Year 1 | 300,000 | 12.0% | 36 | 9,964 | 58,714.44 | 358,714 |
| Multi-Year 2 | 500,000 | 8.5% | 60 | 10,258 | 115,499.20 | 615,499 |

---

## 4. Prepayment / Early Settlement Math

When an employee makes a lump-sum early payment $L$:
1. $B_{\text{new}} = \max(0, B_{\text{current}} - L)$
2. If $B_{\text{new}} == 0$, loan status immediately transitions to `CLOSED`.
3. If $B_{\text{new}} > 0$, remaining tenure or recalculated installment is generated starting from the next active billing cycle.
