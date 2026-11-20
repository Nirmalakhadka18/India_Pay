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

  const info = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const inspect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          class: el.className,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          styles: {
            bg: s.backgroundColor,
            bgImg: s.backgroundImage.slice(0, 100),
            padding: s.padding,
            margin: s.margin,
            borderRadius: s.borderRadius,
            border: s.border,
            color: s.color,
            fontSize: s.fontSize,
            gap: s.gap,
            display: s.display
          }
        };
      };

      return JSON.stringify({
        header: inspect(document.querySelector('.new-header, header, .navbar')),
        switcher: inspect(document.querySelector('.new-gen-nav-pills')),
        switcherActiveLi: inspect(document.querySelector('.new-gen-nav-pills li.active')),
        switcherActiveA: inspect(document.querySelector('.new-gen-nav-pills li.active a')),
        switcherInactiveA: inspect(document.querySelector('.new-gen-nav-pills li:not(.active) a')),
        favouriteBoxes: Array.from(document.querySelectorAll('.favourite-box, .box-container, [ng-repeat*="fav"]')).map(inspect),
        taskWidget: inspect(document.querySelector('.tasks-container, [gt-tasks], [dynamic-component-loader*="task"]')),
        tasksLeft: inspect(document.querySelector('.tasks-left-container, [class*="task-count"], [class*="sidebar"]')),
        tasksRight: inspect(document.querySelector('.tasks-right-container, [class*="task-detail"], [class*="task-content"]')),
        helpdesk: inspect(document.querySelector('.newgen-image-helpdesk')),
        latestUpdates: inspect(document.querySelector('.latest-updates-wrapper, [class*="latest-update"]')),
        updateCards: Array.from(document.querySelectorAll('.latest-updates-wrapper .card, [class*="update-item"], [class*="update-card"]')).map(inspect),
        helpLinks: inspect(document.querySelector('.help-links-wrapper, [class*="help-link"]'))
      });
    })()`
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
