// Minimal CDP driver: connects to headless Chrome, navigates, and evaluates JS.
// Usage: node drive.js <script-file.js>  (script file exports async fn(evaluate))
const http = require('http');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const targets = await getJson('http://127.0.0.1:9222/json');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  await new Promise((res) => (ws.onopen = res));
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = ++id;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.result.exceptionDetails) {
      throw new Error(JSON.stringify(r.result.exceptionDetails));
    }
    return r.result.result.value;
  };

  const navigate = async (url) => {
    await send('Page.enable');
    await send('Page.navigate', { url });
    // wait for load
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const ready = await evaluate('document.readyState').catch(() => null);
      const hasRoot = await evaluate(
        'document.body && document.body.innerText.length > 10'
      ).catch(() => false);
      if (ready === 'complete' && hasRoot) return;
    }
    throw new Error('page did not load');
  };

  const scriptFn = require(process.argv[2]);
  await scriptFn({ evaluate, navigate, send });
  ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('DRIVER ERROR:', e.message);
  process.exit(1);
});
