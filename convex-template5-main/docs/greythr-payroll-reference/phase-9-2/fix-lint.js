const fs = require('fs');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Add type="button" to button tags lacking type=
  code = code.replace(/<button(?![^>]*\btype=)([\s\S]*?)>/g, (match, p1) => {
    return `<button type="button"${p1}>`;
  });

  // 2. Fix noArrayIndexKey in ai-payroll-assistant.tsx
  code = code.replace(/messages\.map\(\(msg,\s*i\)\s*=>\s*\(\s*<div\s+key=\{i\}/g,
    'messages.map((msg, i) => (<div key={msg.id || `${msg.role}-${i}`}'
  );

  // 3. Fix useKeyWithClickEvents on div in payroll/page.tsx
  code = code.replace(
    /onClick=\{\(\)\s*=>\s*\{\s*setActiveMonth\(m\.label\);[\s\S]*?\}\}/g,
    (m) => `${m}\n                  role="button"\n                  tabIndex={0}\n                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveMonth(m.label); }}`
  );

  fs.writeFileSync(filePath, code);
  console.log('Processed:', filePath);
}

const files = [
  'apps/app/src/components/ai-payroll-assistant.tsx',
  'apps/app/src/app/[locale]/(dashboard)/_components/topbar.tsx',
  'apps/app/src/app/[locale]/(admin)/admin/admin-topbar.tsx',
  'apps/app/src/app/[locale]/(admin)/admin/admin-dashboard-view.tsx',
  'apps/app/src/app/[locale]/(dashboard)/_components/greyt-admin-dashboard.tsx',
  'apps/app/src/app/[locale]/(admin)/admin/employee/information/profile/page.tsx',
  'apps/app/src/app/[locale]/(admin)/admin/payroll/page.tsx'
];

files.forEach(fixFile);
