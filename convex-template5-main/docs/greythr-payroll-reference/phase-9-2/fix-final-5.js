const fs = require('fs');

// 1. apps/app/src/app/[locale]/(admin)/admin/page.tsx
let p = 'apps/app/src/app/[locale]/(admin)/admin/page.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/<button\s+title="Add Favourite"/, '<button type="button" title="Add Favourite"');
fs.writeFileSync(p, c);

// 2. apps/app/src/app/[locale]/(admin)/admin/payroll/payroll-header.tsx
p = 'apps/app/src/app/[locale]/(admin)/admin/payroll/payroll-header.tsx';
c = fs.readFileSync(p, 'utf8');
c = c.replace('key={idx}', 'key={sub.title}');
fs.writeFileSync(p, c);

// 3. apps/app/src/app/[locale]/(admin)/admin/admin-dashboard-view.tsx
p = 'apps/app/src/app/[locale]/(admin)/admin/admin-dashboard-view.tsx';
c = fs.readFileSync(p, 'utf8');
c = c.replace('<circle key={i} cx={cx}', '<circle key={cx} cx={cx}');
c = c.replace('<g key={i}>', '<g key={pt.cx}>');
c = c.replace('<tr key={idx} className="hover:bg-slate-50">', '<tr key={row.empNo} className="hover:bg-slate-50">');
fs.writeFileSync(p, c);

console.log('Fixed final 5 errors');
