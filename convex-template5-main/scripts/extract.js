const { execSync } = require("child_process");
const content = execSync('git show 44d1406:convex-template5-main/apps/app/src/app/[locale]/(dashboard)/page.tsx', { encoding: "utf8" });
const lines = content.split("\n");
const adminIdx = lines.findIndex(l => l.includes("Admin Operations Dashboard"));
console.log(lines.slice(adminIdx + 120, adminIdx + 260).join("\n"));
