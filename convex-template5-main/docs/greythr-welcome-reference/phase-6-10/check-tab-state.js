const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/D4375D5F586C394D1A869853CFC737FC');

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: '({ url: window.location.href, inputs: document.querySelectorAll("input").length, text: document.body.innerText })',
      returnByValue: true
    }
  }));
});

ws.on('message', m => {
  console.log(JSON.stringify(JSON.parse(m).result.result.value, null, 2));
  process.exit(0);
});
