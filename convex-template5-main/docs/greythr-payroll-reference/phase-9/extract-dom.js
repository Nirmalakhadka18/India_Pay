const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  const greythrPage = pages.find(p => p.url().includes('victorchasex.greythr.com'));
  if (!greythrPage) {
    console.error('Could not find greytHR page!');
    process.exit(1);
  }

  console.log('Found greytHR page:', greythrPage.url());
  await greythrPage.setViewport({ width: 1920, height: 1080 });

  // Extract navigation tabs and all headers
  const navData = await greythrPage.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('a, button, span, li'))
      .map(el => ({
        tag: el.tagName,
        text: el.innerText ? el.innerText.trim() : '',
        href: el.getAttribute('href') || '',
        className: el.className || ''
      }))
      .filter(x => x.text.length > 0 && x.text.length < 50);

    // Look for more dropdown or secondary nav bar
    const secondaryNav = document.querySelector('.sub-navbar, .secondary-nav, .module-nav, .nav-tabs, .gt-secondary-nav, cougar-header, cougar-sub-navbar');

    return {
      title: document.title,
      url: window.location.href,
      secondaryNavFound: !!secondaryNav,
      secondaryNavHTML: secondaryNav ? secondaryNav.innerHTML.substring(0, 1000) : '',
      navSample: navItems.slice(0, 50)
    };
  });

  console.log('Nav data extracted:', JSON.stringify(navData, null, 2));

  // Let's also inspect DOM elements inside the main content of greytHR payroll overview
  const contentStructure = await greythrPage.evaluate(() => {
    function getDetails(el) {
      if (!el) return null;
      return {
        tag: el.tagName,
        class: el.className,
        id: el.id,
        text: el.innerText ? el.innerText.substring(0, 200).trim() : '',
        rect: el.getBoundingClientRect()
      };
    }

    const allCards = Array.from(document.querySelectorAll('.card, .cougar-card, .dashboard-card, .widget, .panel, .row-fluid, .overview-card, [class*="card"]'))
      .map(getDetails);

    return {
      allCards: allCards.filter(c => c && c.text)
    };
  });

  fs.writeFileSync(
    path.join(__dirname, 'detailed-dom.json'),
    JSON.stringify({ navData, contentStructure }, null, 2)
  );

  console.log('Saved detailed-dom.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
