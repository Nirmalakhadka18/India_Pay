const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const http = require('http');
const fs = require('fs');

async function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (msg) => {
      const res = JSON.parse(msg);
      if (res.id === id) {
        ws.off('message', handler);
        if (res.error) reject(res.error);
        else resolve(res.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const greyTab = tabs.find(t => t.id === '9BE78206571C4B838AA7D7999D0E6AE9');
  console.log('Connecting to:', greyTab.webSocketDebuggerUrl);

  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const pageData = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Find all text and classes in the upper navbar / module header
      const headerEls = Array.from(document.querySelectorAll('header, nav, .navbar, .gt-header, [class*="header"], [class*="navbar"], [class*="topbar"], .cougar-header')).map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.innerText ? el.innerText.trim() : ''
      }));

      // Find all dropdowns or menus
      const navLinks = Array.from(document.querySelectorAll('a, button, li')).map(el => ({
        tag: el.tagName,
        text: el.innerText ? el.innerText.trim() : '',
        href: el.getAttribute('href') || '',
        className: el.className
      })).filter(x => x.text && x.text.length < 40);

      // What does the body look like?
      const mainContainer = document.querySelector('.main-container, .cougar-container, #content, main, [class*="container"]');

      return {
        headerEls: headerEls.slice(0, 10),
        navLinks: navLinks.slice(0, 40),
        containerHTMLSnippet: mainContainer ? mainContainer.innerHTML.substring(0, 1500) : ''
      };
    })()`,
    returnByValue: true
  });

  console.log('Page Data:', JSON.stringify(pageData.result.value, null, 2));

  ws.close();
}

run().catch(console.error);
