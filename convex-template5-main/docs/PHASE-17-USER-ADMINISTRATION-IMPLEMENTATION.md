# PHASE 17 — USER ADMINISTRATION REPLICATION IMPLEMENTATION REPORT

**Executive Summary:**
Phase 17 delivers a complete, production-grade replication of the authenticated Victor Chasex greytHR User Administration module within IndiaPay HRMS. The implementation establishes dedicated sub-navigation architecture, canonical routes, granular permission management across all HRMS modules, linked employee account management with CSV export, user listing with search, filtering, and role/status modification, and complete Convex backend persistence.

---

## 1. Architectural Overview & Navigation

### 1.1 Header Integration
- **Trigger**: Settings dropdown item 3 ("User Administration") in `apps/app/src/app/[locale]/(admin)/admin/admin-topbar.tsx`.
- **Default Landing**: `/admin/user-administration/roles`.

### 1.2 Dedicated Sub-Navigation Shell (`layout.tsx`)
A dedicated sub-navigation bar sits below the global topbar matching greytHR layout conventions:
1. **User Dropdown**:
   - `User Roles` (`/admin/user-administration/roles`)
   - `User Listing` (`/admin/user-administration/users`)
2. **Linked Employee Account Dropdown**:
   - `Linked Employee Account` (`/admin/user-administration/linked-employees`)

---

## 2. Page Implementations

### 2.1 User Roles (`/admin/user-administration/roles`)
- **Breadcrumb**: `Home > User Roles`
- **Help Banner**: Collapsible informational banner ("User Roles & Permissions", "Hide Help" toggle).
- **Default Seed**: 14 greytHR standard roles (`aspro_user`, `attend_admin_view`, `attend_admin_write`, `cadmin`, `claim_admin_view`, `claim_admin_write`, `employee_view`, `employee_write`, `employee`, `leave_admin_view`, `lop_reversal_api`, `manager`, `payroll_admin_view`, `payroll_admin_write`).
- **Protected System Roles**: System roles (`cadmin`, `employee`, `manager`, `lop_reversal_api`) display a system badge and cannot be deleted via UI or backend mutations.
- **Role Creation & Editing Modal**: Modal supporting custom role name, description, and granular permission switches across 7 HRMS modules:
  - *Payroll* (View, Write, Approve)
  - *Attendance* (View, Write, Approve)
  - *Employees* (View, Write, Approve)
  - *Leaves* (View, Write, Approve)
  - *Claims* (View, Write, Approve)
  - *Reports* (View, Export)
  - *Settings* (View, Write)

### 2.2 Linked Employee Account (`/admin/user-administration/linked-employees`)
- **Breadcrumb**: `Home > Linked Employee`
- **Employee Filter**: Select dropdown allowing filtering by individual employee or "All".
- **Actions**:
  - `Add` button opening modal with Employee select, active user mapping, From Date, and optional To Date.
  - `Export Excel` exporting the table data directly as formatted CSV.
- **7-Column Table**:
  1. `#`
  2. `Employee No`
  3. `Employee Name`
  4. `User Name`
  5. `From Date`
  6. `To Date`
  7. `Actions` (Unlink action with confirmation dialog)
- **Empty State**: Renders exact greytHR fallback text `"No Rows To Show"`.
- **Duplicate Prevention**: Backend rejects mapping if employee is already linked to an active user.

### 2.3 User Listing (`/admin/user-administration/users`)
- **Breadcrumb**: `Home > User Administration > User Listing`
- **Search & Filter Controls**:
  - Full-text search by user name or email.
  - Role filter dropdown (All Roles or specific role).
  - Status filter dropdown (All, Active, Inactive).
- **User Table Columns**:
  - User Details (Avatar, Name, Email)
  - Assigned Role (Badge with icon)
  - Status (`active` / `inactive` badge)
  - Last Login Timestamp
  - Actions (`Change Role`, `Activate`/`Deactivate` toggle)
- **Interactive Modals**:
  - "Assign User Role" dialog allowing instant role re-assignment backed by Convex mutation.
  - Account status toggle with real-time feedback banner.

---

## 3. Convex Backend Architecture

### 3.1 Schema (`packages/backend/convex/schema.ts`)
```typescript
// 1. User Administration Roles
userAdminRoles: defineTable({
  workspaceId: v.id("workspaces"),
  roleKey: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  isSystem: v.boolean(),
  lastUpdatedOn: v.string(),
  permissions: v.object({
    payroll: v.object({ view: v.boolean(), write: v.boolean(), approve: v.boolean() }),
    attendance: v.object({ view: v.boolean(), write: v.boolean(), approve: v.boolean() }),
    employees: v.object({ view: v.boolean(), write: v.boolean(), approve: v.boolean() }),
    leaves: v.object({ view: v.boolean(), write: v.boolean(), approve: v.boolean() }),
    claims: v.object({ view: v.boolean(), write: v.boolean(), approve: v.boolean() }),
    reports: v.object({ view: v.boolean(), export: v.boolean() }),
    settings: v.object({ view: v.boolean(), write: v.boolean() }),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_roleKey", ["workspaceId", "roleKey"]),

// 2. Linked Employee Account Mappings
linkedEmployeeAccounts: defineTable({
  workspaceId: v.id("workspaces"),
  employeeId: v.id("employees"),
  employeeNo: v.string(),
  employeeName: v.string(),
  userId: v.id("users"),
  userName: v.string(),
  userEmail: v.string(),
  fromDate: v.string(),
  toDate: v.optional(v.string()),
  status: v.union(v.literal("active"), v.literal("inactive")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_employee", ["workspaceId", "employeeId"])
  .index("by_workspace_user", ["workspaceId", "userId"]),
```

### 3.2 Service Functions (`packages/backend/convex/userAdministration.ts`)
- `getRoles`: Workspace-scoped query auto-seeding the 14 greytHR default roles if empty.
- `addRole`: Mutation creating a custom role with permissions matrix.
- `editRole`: Mutation updating role permissions and metadata.
- `deleteRole`: Mutation enforcing protection (`role.isSystem` check).
- `getLinkedEmployees`: Workspace-scoped query with employee filtering.
- `addLinkedEmployee`: Mutation verifying no duplicate active mapping exists before inserting.
- `removeLinkedEmployee`: Mutation deleting mapping.
- `listUsersWithRoles`: Query joining `users` and `userAdminRoles` with search and filters.
- `updateUserRole`: Mutation updating a user's role assignment.
- `toggleUserStatus`: Mutation toggling user active/inactive status.

---

## 4. Visual Verification & Artifacts
The following screenshots were captured via CDP at both 1920×1080 and 1366×768:
- `docs/indiapay-useradmin-roles-1920x1080.png` & `1366x768.png`
- `docs/indiapay-useradmin-linkedemployee-1920x1080.png` & `1366x768.png`
- `docs/indiapay-useradmin-users-1920x1080.png` & `1366x768.png`
- Reference: `docs/greythr-useradmin-roles-1920x1080.png` & `greythr-useradmin-linkedemployee-1920x1080.png`

---

## 5. Verification & Regression Testing
- **Phase 17 Test Suite**: `tests/user-administration.test.js` (15/15 passing, 100%).
- **Cumulative Platform Test Suites**: 10 test suites, 77/77 tests passing (100%), 0 regressions.
