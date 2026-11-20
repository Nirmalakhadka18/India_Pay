const http = require('http');
const fs = require('fs');

const submenus = JSON.parse(
  fs.readFileSync('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9/payroll-submenus-all.json', 'utf8')
);

function checkRoute(path) {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:3000' + path, res => {
      resolve({
        path,
        statusCode: res.statusCode,
        location: res.headers.location || null
      });
    });
    req.on('error', err => {
      resolve({
        path,
        statusCode: null,
        error: err.message
      });
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        path,
        statusCode: null,
        error: 'timeout'
      });
    });
  });
}

async function auditNavigation() {
  const results = {};
  for (const [category, items] of Object.entries(submenus)) {
    results[category] = [];
    for (const item of items) {
      const res = await checkRoute(item.href);
      // If 200 or 307 (auth redirect), it indicates the route is handled in Next.js router
      let status = 'Not implemented';
      if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 308) {
        status = 'Verified';
      } else if (res.statusCode === 404) {
        status = 'Not implemented';
      } else if (res.statusCode >= 500) {
        status = 'Inaccessible';
      }
      results[category].push({
        title: item.title,
        href: item.href,
        httpStatus: res.statusCode,
        redirect: res.location,
        status
      });
    }
  }

  const outPath = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9-1/navigation-audit-results.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log('Navigation audit completed.');
  console.log(JSON.stringify(results, null, 2));
}

auditNavigation();
