// Minimal CDP driver. Usage: node drive.js <scenario-file.js>
// Scenario file exports async function(run) where run has helpers.
const WebSocket = require('ws');
const http = require('http');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function main() {
  const targets = await getJson('http://localhost:9223/json');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((r) => ws.on('open', r));
  let id = 0;
  const pending = new Map();
  ws.on('message', (m) => {
    const msg = JSON.parse(m);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.result && res.result.exceptionDetails) {
      throw new Error(JSON.stringify(res.result.exceptionDetails));
    }
    return res.result && res.result.result ? res.result.result.value : undefined;
  };

  const run = {
    send,
    eval: evalJs,
    goto: async (url) => {
      await send('Page.navigate', { url });
      await run.sleep(1000);
      // wait for a data-testid to appear (bundle loaded)
      for (let i = 0; i < 60; i++) {
        const ready = await evalJs(`!!document.querySelector('[data-testid]')`);
        if (ready) return;
        await run.sleep(500);
      }
      throw new Error('page did not render any [data-testid]');
    },
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    click: async (testId) => {
      const ok = await evalJs(`(() => {
        const el = document.querySelector('[data-testid="${testId}"]');
        if (!el) return false;
        el.dispatchEvent(new MouseEvent('pointerdown', {bubbles:true}));
        el.dispatchEvent(new MouseEvent('pointerup', {bubbles:true}));
        el.click();
        return true;
      })()`);
      if (!ok) throw new Error(`click: no element [data-testid="${testId}"]`);
      await run.sleep(150);
    },
    type: async (testId, text) => {
      const ok = await evalJs(`(() => {
        const el = document.querySelector('[data-testid="${testId}"]');
        if (!el) return false;
        el.focus();
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, ${JSON.stringify(text)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })()`);
      if (!ok) throw new Error(`type: no element [data-testid="${testId}"]`);
      await run.sleep(150);
    },
    text: (testId) =>
      evalJs(
        `(document.querySelector('[data-testid="${testId}"]')||{}).textContent ?? null`
      ),
    exists: (testId) => evalJs(`!!document.querySelector('[data-testid="${testId}"]')`),
    bodyText: () => evalJs(`document.body.innerText`),
    testIds: () =>
      evalJs(
        `Array.from(document.querySelectorAll('[data-testid]')).map(e=>e.getAttribute('data-testid'))`
      ),
  };

  const scenario = require(process.argv[2]);
  await scenario(run);
  ws.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('DRIVER ERROR:', e.message || e);
  process.exit(1);
});
