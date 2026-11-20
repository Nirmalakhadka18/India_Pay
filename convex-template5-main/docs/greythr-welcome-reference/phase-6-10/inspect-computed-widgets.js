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
      const getStyles = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          sel,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          styles: {
            bg: s.backgroundColor,
            bgImg: s.backgroundImage.slice(0, 100),
            padding: s.padding,
            margin: s.margin,
            borderRadius: s.borderRadius,
            border: s.border,
            boxShadow: s.boxShadow,
            display: s.display,
            flexDirection: s.flexDirection,
            justifyContent: s.justifyContent,
            alignItems: s.alignItems
          }
        };
      };

      return JSON.stringify({
        myTasksWrapper: getStyles('.my-tasks-wrapper'),
        myTasksContainer: getStyles('.my-tasks-container'),
        myTasksListWrapper: getStyles('.my-tasks-list-wrapper'),
        myTasksCountContainer: getStyles('.my-tasks-count-container'),
        countData: getStyles('.count-data'),
        myTasksListContainer: getStyles('.my-tasks-list-container'),
        myIndividualTask: getStyles('.my-individual-task'),
        legend: getStyles('.my-individual-task .legend'),
        taskInfo: getStyles('.task-info-container'),
        helpdesk: getStyles('.newgen-image-helpdesk'),
        tasksImg: getStyles('.newgen-image-tasks'),
        actionItemCard: getStyles('.newgen-action-item-card'),
        actionItemTop: getStyles('.newgen-action-item-card .top-container'),
        actionItemBottom: getStyles('.newgen-action-item-card .bottom-container'),
        chip: getStyles('.newgen-chip-container'),
        latestUpdatesCard: getStyles('.latest-updates-card')
      });
    })()`
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
