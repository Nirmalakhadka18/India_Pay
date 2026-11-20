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

  // Click Welcome tab if on Dashboard
  const clickRes = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const all = Array.from(document.querySelectorAll('button, a, span, li, div'));
      const btn = all.find(el => el.innerText && el.innerText.trim() === 'Welcome');
      if (btn) {
        btn.click();
        return 'Clicked Welcome button';
      }
      return 'Not found';
    })()`
  });
  console.log('Click Welcome status:', clickRes.result ? clickRes.result.value : null);

  await new Promise(r => setTimeout(r, 2500));

  const pageMetrics = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      function getMetrics(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
          bg: s.backgroundColor,
          bgImage: s.backgroundImage.slice(0, 100),
          padding: s.padding,
          margin: s.margin,
          borderRadius: s.borderRadius
        };
      }

      // Find topbar/header
      const header = document.querySelector('header, .gt-header, nav, #single-spa-application\\\\:@greytip\\\\/navbar');
      
      // Segmented switcher
      const switcher = Array.from(document.querySelectorAll('ul, div, nav')).find(el => {
        return el.innerText && el.innerText.includes('Welcome') && el.innerText.includes('Dashboard') && el.clientWidth < 400;
      });

      // Greeting container
      const greetingHeading = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(el => {
        return el.innerText && /good evening|good morning|good afternoon/i.test(el.innerText);
      });
      const greetingContainer = greetingHeading ? greetingHeading.parentElement : null;

      // Skyline element (background or img or svg)
      const skylineImg = document.querySelector('img[src*="city"], img[src*="skyline"], img[src*="home"], svg[class*="skyline"]');

      // Favourites container & cards
      const favH = Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el => el.innerText && el.innerText.trim() === 'My Favourites');
      const favSection = favH ? favH.parentElement : null;

      // My Tasks section
      const tasksH = Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el => el.innerText && el.innerText.trim() === 'My Tasks');
      const tasksSection = tasksH ? tasksH.parentElement : null;

      // Latest Updates
      const updatesH = Array.from(document.querySelectorAll('h2, h3, h4, div')).find(el => el.innerText && el.innerText.trim() === 'Latest Updates');
      const updatesSection = updatesH ? updatesH.closest('div[class*="card"], div[class*="panel"], div') : null;

      return {
        header: getMetrics(header),
        switcher: getMetrics(switcher),
        greetingHeading: getMetrics(greetingHeading),
        greetingContainer: getMetrics(greetingContainer),
        skylineImg: getMetrics(skylineImg),
        favSection: getMetrics(favSection),
        tasksSection: getMetrics(tasksSection),
        updatesSection: getMetrics(updatesSection),
        bodyBg: window.getComputedStyle(document.body).background
      };
    })()`,
    returnByValue: true
  });

  console.log('Metrics:');
  console.log(JSON.stringify(pageMetrics.result ? pageMetrics.result.value : null, null, 2));

  // Also take fresh screenshot of greytHR Welcome
  const shot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(
    'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-10/reference-greythr-welcome-fresh-1920x1080.png',
    Buffer.from(shot.data, 'base64')
  );
  console.log('Fresh greytHR Welcome screenshot saved');

  ws.close();
}

run().catch(console.error);
