const fs = require("fs");
const path = require("path");

const files = [
  "apps/app/src/app/[locale]/(dashboard)/_components/sidebar.tsx",
  "apps/app/src/app/[locale]/(dashboard)/my-portal/page.tsx",
  "apps/app/src/app/[locale]/(dashboard)/page.tsx",
  "apps/app/src/app/[locale]/(dashboard)/payroll/page.tsx",
  "apps/app/src/components/epfo-ecr-dialog.tsx",
  "packages/backend/convex/dashboard.ts",
  "packages/backend/convex/dashboardOwner.test.ts",
  "packages/backend/convex/payroll.ts",
  "packages/backend/convex/payrollLifecycle.test.ts",
  "packages/backend/convex/security.test.ts",
  "packages/backend/convex/twoOrganizationUat.test.ts",
  "FINAL_VERIFICATION_REPORT.md"
];

const srcBase = "e:/convex-template5-main/convex-template5-main";
const destBase = "d:/Indiapay";

files.forEach(f => {
  const src = path.join(srcBase, f);
  const dest = path.join(destBase, f);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log("SUCCESS Copied:", f, "Size:", fs.statSync(dest).size);
  } else {
    console.error("Source missing:", src);
  }
});
