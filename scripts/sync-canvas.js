/**
 * Sync (and patch) the Infinite Canvas sub-app into this repo.
 *
 * Usage:
 *   node scripts/sync-canvas.js [--src <infinite-canvas web dir>] [--skip-build]
 *
 * Steps:
 *   1. (optional) Build the canvas web app with VITE_BASE=/canvas/ so its asset
 *      URLs are relative to the /canvas/ mount point served by web-host.
 *   2. Copy the build output (web/dist) into packages/desktop/resources/canvas.
 *   3. Patch resources/canvas/index.html: inject a small bridge script that asks
 *      the parent window (AionUi renderer) for the AI model config and persists
 *      it into localStorage under the key infinite-canvas expects
 *      (infinite-canvas:ai_config_store, zustand persist JSON).
 *
 * The bridge keeps the canvas upstream untouched — upstream updates are merged
 * by re-running this script (upgrade isolation, see docs/).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RESOURCES_DIR = path.join(ROOT, 'packages', 'desktop', 'resources', 'canvas');
const DEFAULT_CANVAS_WEB = path.resolve(ROOT, '..', 'infinite-canvas', 'web');
const CANVAS_CONFIG_STORE_KEY = 'infinite-canvas:ai_config_store';

const args = process.argv.slice(2);
const srcArgIdx = args.indexOf('--src');
const canvasWeb = srcArgIdx !== -1 && args[srcArgIdx + 1] ? path.resolve(args[srcArgIdx + 1]) : DEFAULT_CANVAS_WEB;
const skipBuild = args.includes('--skip-build');

// --- Step 1: build the canvas web app ---------------------------------------
if (!skipBuild) {
  console.log(`[sync-canvas] building canvas web app at ${canvasWeb} (VITE_BASE=/canvas/)`);
  if (!fs.existsSync(path.join(canvasWeb, 'package.json'))) {
    console.error('[sync-canvas] cannot find canvas web app (missing package.json):', canvasWeb);
    process.exit(1);
  }
  execSync(`npm run build`, {
    cwd: canvasWeb,
    env: { ...process.env, VITE_BASE: '/canvas/' },
    stdio: 'inherit',
  });
}

const distDir = path.join(canvasWeb, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('[sync-canvas] canvas build output missing:', distDir);
  process.exit(1);
}

// --- Step 2: copy build output ----------------------------------------------
fs.rmSync(RESOURCES_DIR, { recursive: true, force: true });
fs.mkdirSync(RESOURCES_DIR, { recursive: true });
fs.cpSync(distDir, RESOURCES_DIR, { recursive: true });
console.log(`[sync-canvas] copied ${distDir} -> ${RESOURCES_DIR}`);

// --- Step 3: inject the config bridge script --------------------------------
const indexHtmlPath = path.join(RESOURCES_DIR, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('[sync-canvas] index.html not found in canvas build output:', indexHtmlPath);
  process.exit(1);
}

const bridgeScript = `<script>
// [aionui-canvas-bridge] injected by AionUi scripts/sync-canvas.js
// Asks the parent window (AionUi renderer) for the AI model config selected in
// AionUi (Settings -> Model), persists it into localStorage under the zustand
// persist key the canvas app reads on boot, then reloads once if it changed so
// the app bootstraps with the injected config.
(function () {
  try {
    var KEY = '${CANVAS_CONFIG_STORE_KEY}';
    var handler = function (e) {
      var d = e && e.data;
      if (!d || typeof d !== 'object' || d.type !== 'aionui:canvas-config') return;
      window.removeEventListener('message', handler);
      var cur = null;
      try { cur = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (err) {}
      var next = { state: { config: d.config, webdav: (cur && cur.state && cur.state.webdav) || {} }, version: 0 };
      var existing = cur && cur.state && cur.state.config;
      var changed = !existing || JSON.stringify(existing) !== JSON.stringify(d.config);
      localStorage.setItem(KEY, JSON.stringify(next));
      if (changed) {
        // Apply the config on a fresh boot of the canvas app.
        setTimeout(function () { location.reload(); }, 50);
      }
    };
    window.addEventListener('message', handler);
    try { parent.postMessage({ type: 'aionui:canvas:request-config' }, '*'); } catch (err) {}
    setTimeout(function () { window.removeEventListener('message', handler); }, 4000);
  } catch (err) {}
})();
</script>`;

let html = fs.readFileSync(indexHtmlPath, 'utf-8');
if (html.includes('[aionui-canvas-bridge]')) {
  html = html.replace(/<script>\s*\/\/ \[aionui-canvas-bridge\][\s\S]*?<\/script>/, '');
}
// Inject before the first <script> tag (head area, before app JS executes).
const firstScriptIdx = html.indexOf('<script');
const marker = firstScriptIdx === -1 ? html.length : firstScriptIdx;
html = html.slice(0, marker) + '\n' + bridgeScript + '\n' + html.slice(marker);
fs.writeFileSync(indexHtmlPath, html, 'utf-8');
console.log(`[sync-canvas] injected config bridge into ${indexHtmlPath}`);

// --- Step 4: also copy into out/renderer/canvas for immediate dev use --------
const dest = path.join(ROOT, 'out', 'renderer', 'canvas');
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(RESOURCES_DIR, dest, { recursive: true });
console.log(`[sync-canvas] copied ${RESOURCES_DIR} -> ${dest}`);

console.log('[sync-canvas] done.');
