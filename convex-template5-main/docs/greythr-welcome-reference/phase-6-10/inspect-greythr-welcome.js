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
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const greyTab = tabs.find(t => t.url && t.url.includes('victorchasex.greythr.com'));
  if (!greyTab) {
    console.error('greytHR tab not found!');
    return;
  }

  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to Welcome tab
  await sendCDP(ws, 'Page.navigate', { url: 'https://victorchasex.greythr.com/home#/' });
  await new Promise(r => setTimeout(r, 4000));

  const welcomeMetrics = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const getBox = el => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          className: el.className,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          background: style.backgroundColor,
          color: style.color,
          fontSize: style.fontSize,
          padding: style.padding,
          margin: style.margin
        };
      };

      // Header
      const header = document.querySelector('header, .gt-header, nav, #single-spa-application\\\\:@greytip\\\\/navbar');
      
      // Segmented switcher (Welcome / Dashboard)
      const switcher = Array.from(document.querySelectorAll('ul, div, nav')).find(el => {
        return el.innerText && el.innerText.includes('Welcome') && el.innerText.includes('Dashboard');
      });

      // Hero / Greeting text
      const greeting = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(el => {
        return el.innerText && /good evening|good morning|good afternoon/i.test(el.innerText);
      });

      // Skyline image or SVG
      const skyline = document.querySelector('img[src*="city"], img[src*="skyline"], img[src*="home"], svg[class*="skyline"], .hero-image');

      // My Favourites container & cards
      const favH = Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el => el.innerText && el.innerText.trim() === 'My Favourites');
      const favContainer = favH ? favH.parentElement : null;
      const favCards = favContainer ? Array.from(favContainer.querySelectorAll('[class*="card"], [class*="fav"], a, button')).map(getBox) : [];

      // Latest Updates
      const updatesH = Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el => el.innerText && el.innerText.trim() === 'Latest Updates');
      const updatesContainer = updatesH ? updatesH.closest('.card, [class*="update"], [class*="panel"], div') : null;

      // My Tasks
      const tasksH = Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el => el.innerText && el.innerText.trim() === 'My Tasks');
      const tasksContainer = tasksH ? tasksH.closest('.card, [class*="task"], div') : null;

      return {
        header: getBox(header),
        switcher: getBox(switcher),
        greeting: getBox(greeting),
        skyline: getBox(skyline),
        favContainer: getBox(favContainer),
        favCardCount: favCards.length,
        updatesContainer: getBox(updatesContainer),
        tasksContainer: getBox(tasksContainer)
      };
    })()`,
    returnByValue: true
  });

  console.log('greytHR Welcome Layout Metrics:');
  console.log(JSON.stringify(welcomeMetrics.result.value, null, 2));

  fs.writeFileSync(
    'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-10/greythr-welcome-dom.json',
    JSON.stringify(welcomeMetrics.result.value, null, 2)
  );

  ws.close();
}

run().catch(console.error);
