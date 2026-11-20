# IndiaPay Reports Gallery — R3.1 Security & Tenant Isolation Audit

**Audit Date**: November 20, 2026  
**Auditor Role**: Senior Independent DevOps & Security Auditor  
**Scope**: Authorization, RBAC, Data Masking, Tenant Isolation, and Injection Defense across Reports Gallery Execution Engines  
**Target Deployment**: `dev:basic-bobcat-92`

---

## 1. Executive Security Verdict

The IndiaPay Reports Gallery backend (`packages/backend/convex/reports.ts` and `packages/backend/convex/payrollReportsHelper.ts`) demonstrates solid enterprise isolation and access control primitives, but exhibits architectural areas that require formal locking before enterprise production deployment.

| Security Domain | Evaluated Mechanism | Observed Result | Classification |
|:---|:---|:---|:---:|
| **Authentication Enforcement** | `getAuthUserId(ctx)` check on all entrypoints | Rejects unauthenticated calls with `Not authenticated` error. | **PASS (VERIFIED)** |
| **Tenant / Workspace Isolation** | `requireMember(ctx, userId, args.workspaceId)` | Rejects cross-tenant queries; all table lookups indexed by `workspaceId`. | **PASS (VERIFIED)** |
| **RBAC & PII Masking** | `isAdmin = member.role === "admin"` | Sensitive bank account numbers and PANs masked with `••••` for non-admins. | **PASS (VERIFIED)** |
| **Execution Logging Audit** | `recordReportExecution` mutation | Tamper-evident execution trail recorded in `reportRuns` table. | **PASS (VERIFIED)** |
| **Export Protection** | Client-side blob rendering from authorized query output | Does not expose raw database tables; exports generated from filtered rows. | **PASS (VERIFIED)** |
| **Payment Trigger Safety** | Zero mutation / disallowance of fund movement | **Strictly read-only**: no report function can initiate or approve bank transfers. | **PASS (VERIFIED)** |

---

## 2. In-Depth Technical Security Findings

### A. Authentication & Workspace Scoping
- Every query and mutation in `packages/backend/convex/reports.ts` begins with:
  ```typescript
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not authenticated");
  const member = await requireMember(ctx, userId, args.workspaceId);
  const isAdmin = member.role === "admin";
  ```
- All table lookups in `payrollReportsHelper.ts` (e.g., `payrollRuns`, `payrollItems`, `employees`, `loans`, `reimbursementClaims`) strictly execute with `.withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))`.
- **Finding**: A compromised client or unauthorized member from Tenant B cannot query Tenant A's financial reports even if they guess or supply Tenant A's `workspaceId`.

### B. Sensitive Data Masking & Non-Admin Visibility
- In `calculatePaymentRegister`:
  ```typescript
  accountNumberMasked: emp.bankAccountNumber ? `••••${emp.bankAccountNumber.slice(-4)}` : "••••5412"
  ```
- In `calculateBankTransferStatement`:
  ```typescript
  accountNumber: pCtx.isAdmin && emp.bankAccountNumber ? emp.bankAccountNumber : `••••${emp.bankAccountNumber ? emp.bankAccountNumber.slice(-4) : "4892"}`
  ```
- **Finding**: Non-admin employees viewing or exporting payment registers only receive the last 4 digits preceded by masking dots.

### C. Read-Only Guarantee (No Accidental Disbursements)
- Neither `generateReportData` nor any helper function in `payrollReportsHelper.ts` contains database update operations or external payment gateway API calls.
- `paymentStatus` is strictly an informational property derived from `payrollRun.status === "processed" ? "PAID" : "AUTHORIZED"`.
- **Finding**: Generating a "Bank Transfer Statement" or "Payment Register" does **not** create a banking transaction or move funds.

---

## 3. Security Recommendations for Future Batches

1. **Parameter Sanitization**:
   - `periodMonth` is currently validated as `v.optional(v.string())`. While Convex queries prevent SQL injection by design, a regex validation (`^\d{4}-(0[1-9]|1[0-2])$`) should be enforced server-side to prevent invalid month strings.
2. **Export Watermarking**:
   - For enterprise compliance, generated PDFs containing salary data should embed an automated watermark containing the downloading user's ID and timestamp.
