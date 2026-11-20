const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const http = require('http');

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
  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const styles = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const getBox = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          selector,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          bg: s.backgroundColor,
          bgImage: s.backgroundImage.slice(0, 120),
          color: s.color,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          padding: s.padding,
          margin: s.margin,
          borderRadius: s.borderRadius,
          border: s.border
        };
      };

      return {
        header: getBox('header, .gt-header, nav.navbar, #single-spa-application\\\\:@greytip\\\\/navbar'),
        switcherNav: getBox('.new-gen-nav-pills'),
        greetingHeader: getBox('.welcome-header, h1, .header-text'),
        imageContainer: getBox('.image-container'),
        mainContainer: getBox('.main-container'),
        favContainer: getBox('.favourites-container, .favourite-container'),
        favCardAdd: getBox('.add-favourite, .newgen-add-favourite, .favourite-box-add'),
        favCardFirst: getBox('.favourite-card, .favourite-box, .box-container'),
        tasksContainer: getBox('.tasks-container, .task-container'),
        tasksSidebar: getBox('.tasks-left-container, .task-count-container'),
        tasksHelpdeskImg: getBox('.newgen-image-helpdesk'),
        updatesPanel: getBox('.latest-updates-container, .update-container, .updates-panel'),
        helpLinks: getBox('.help-links-container, .links-container')
      };
    })()`,
    returnByValue: true
  });

  console.log('Detailed Structure:');
  console.log(JSON.stringify(styles.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
