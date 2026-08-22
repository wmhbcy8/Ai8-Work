/**
 * Copy the Infinite Canvas sub-app into the renderer output directory.
 *
 * The canvas is built as a static site with `base: '/canvas/'` (see sync-canvas.js)
 * and lives in `packages/desktop/resources/canvas`. electron-vite wipes out/renderer
 * on every build, so this script re-copies the canvas right after the renderer
 * bundle is emitted. The web-host static server (which serves out/renderer at
 * http://127.0.0.1:25808) then exposes it at /canvas/index.html automatically.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'packages', 'desktop', 'resources', 'canvas');
const DEST = path.join(ROOT, 'out', 'renderer', 'canvas');

function main() {
  if (!fs.existsSync(SRC)) {
    console.warn('[copy-canvas] source directory not found, skipping:', SRC);
    return;
  }
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  fs.cpSync(SRC, DEST, { recursive: true });
  console.log(`[copy-canvas] ${SRC} -> ${DEST}`);
}

main();
