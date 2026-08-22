/**
 * Headless E2E verification for the Infinite Canvas sub-app integration.
 *
 * Simulates what AionUi's CanvasPage does:
 *  1. Serve out/renderer over http (as the web-host static server does).
 *  2. Open a host page that embeds /canvas/index.html in an iframe and answers
 *     the canvas bridge's postMessage config request (like CanvasPage does).
 *  3. Assert the canvas boots, receives the injected config, persists it into
 *     localStorage and renders its UI.
 *
 * Run:  node scripts/verify-canvas-e2e.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const RENDERER_DIR = path.join(ROOT, 'out', 'renderer');
const PORT = 25808;
const STORE_KEY = 'infinite-canvas:ai_config_store';

const MOCK_CONFIG = {
  channelMode: 'local',
  channels: [
    {
      id: 'e2e-test',
      name: 'E2E Test',
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-e2e-test',
      apiFormat: 'openai',
      models: [{ name: 'e2e-model', capability: 'text' }],
    },
  ],
  textModel: 'e2e-test:e2e-model',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(RENDERER_DIR, url);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(RENDERER_DIR, 'index.html');
    }
    const ext = path.extname(file);
    const types = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
      '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

const HOST_HTML = `<!DOCTYPE html>
<html><body>
<script>
window.addEventListener('message', (e) => {
  const d = e && e.data;
  if (!d || typeof d !== 'object' || d.type !== 'aionui:canvas:request-config') return;
  try {
    e.source.postMessage({ type: 'aionui:canvas-config', config: ${JSON.stringify(MOCK_CONFIG)}, reload: true }, '*');
    console.log('[host] answered config request');
  } catch (err) { console.error('[host] failed to answer:', err); }
});
</script>
<iframe id="canvas" src="http://127.0.0.1:${PORT}/canvas/index.html" style="width:100%;height:100%;border:0" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"></iframe>
</body></html>`;

async function main() {
  const server = await startServer();
  console.log(`[e2e] serving ${RENDERER_DIR} at http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.setContent(HOST_HTML, { waitUntil: 'domcontentloaded' });

    // The iframe is loaded asynchronously — wait for it to appear.
    await page.waitForSelector('#canvas', { timeout: 10000 });
    let frame = null;
    const deadline = Date.now() + 30000;
    while (!frame && Date.now() < deadline) {
      frame = page.frames().find((f) => f.url().includes('/canvas/index.html'));
      if (!frame) await page.waitForTimeout(500);
    }
    if (!frame) throw new Error('canvas iframe not found');

    console.log('[e2e] waiting for canvas app to boot…');
    await frame.waitForTimeout(15000);

    // The bridge should have written the injected config into localStorage.
    const stored = await frame.evaluate((key) => localStorage.getItem(key), STORE_KEY);
    if (!stored) throw new Error('canvas config was NOT written into localStorage');
    const parsed = JSON.parse(stored);
    const cfg = parsed.state && parsed.state.config;
    if (!cfg || !cfg.channels || cfg.channels.length === 0) {
      throw new Error('injected config has unexpected shape: ' + stored.slice(0, 200));
    }
    const channel = cfg.channels.find((c) => c.id === 'e2e-test');
    if (!channel || channel.apiKey !== 'sk-e2e-test' || channel.baseUrl !== 'https://api.example.com/v1') {
      throw new Error('injected channel mismatch: ' + JSON.stringify(channel));
    }
    console.log('[e2e] PASS: injected config persisted:', JSON.stringify({ channels: cfg.channels.map((c) => c.id), textModel: cfg.textModel }));

    // Canvas UI should have rendered its root.
    const canvasRoot = await frame.evaluate(() => {
      const el = document.getElementById('root') || document.querySelector('#root');
      return el ? el.childElementCount : -1;
    });
    console.log('[e2e] canvas root child count:', canvasRoot);
    if (canvasRoot <= 0) throw new Error('canvas root did not render UI');

    // Config tab should now show the injected channel (canvas settings).
    const seriousErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('ResizeObserver'));
    console.log('[e2e] console errors:', seriousErrors.length ? seriousErrors.slice(0, 5) : 'none');
    if (seriousErrors.length) throw new Error('canvas console errors: ' + seriousErrors.slice(0, 3).join(' | '));

    console.log('[e2e] ✅ ALL CHECKS PASSED');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('[e2e] ❌ FAILED:', err.message);
  process.exit(1);
});
