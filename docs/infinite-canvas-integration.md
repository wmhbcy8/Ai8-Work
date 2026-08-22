# Infinite Canvas Integration (AionUi)

Embed the [Infinite Canvas](https://github.com/basketikun/infinite-canvas) web app
into AionUi as a local workspace page. The canvas reuses the OpenAI-compatible
model channel configured in **AionUi Settings → Model** — no separate API key
setup inside the canvas.

## Architecture

```
┌─────────────────────────── AionUi (Electron) ───────────────────────────────┐
│  renderer (React, Arco)                                                     │
│   └─ /canvas page (CanvasPage)                                              │
│        └─ <iframe src="http://127.0.0.1:25808/canvas/index.html">           │
│              ▲ postMessage config bridge (aionui:canvas:*)                  │
│   web-host static server (port 25808, serves out/renderer)                  │
│   └─ /canvas/*  ← Infinite Canvas sub-app (built with VITE_BASE=/canvas/)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Sub-app**: the canvas is a plain static site under `out/renderer/canvas`,
  served by the existing web-host server. Upstream updates are merged by
  re-running `sync-canvas.js` (upgrade isolation — the canvas source is not
  modified, only `index.html` gets a small injected bridge script).
- **Config injection**: AionUi Settings → Model stores OpenAI-compatible
  providers. `CanvasPage` translates the first usable provider into the canvas'
  config shape (`infinite-canvas:ai_config_store`, zustand persist) and sends it
  via `postMessage`. The injected bridge script (in the canvas `index.html`)
  persists it to localStorage and reloads once so the canvas boots with it.

## Build & sync

```bash
# 1. Build the canvas sub-app and copy it into this repo (+ inject bridge script)
node scripts/sync-canvas.js --src <path/to/infinite-canvas/web>
# (default --src points at ../../infinite-canvas/web next to this repo)

# 2. Normal AionUi build — electron.vite.config.ts already re-copies the canvas
#    into out/renderer/canvas after every renderer build (copyCanvasPlugin).
bun run make          # or: bun run package / dist
```

The bridge script is **idempotent**: `sync-canvas.js` detects an existing
`[aionui-canvas-bridge]` marker and replaces it before re-injecting.

## Verify (headless)

```bash
node scripts/verify-canvas-e2e.js   # starts a static server + Playwright,
                                    # asserts config injection + canvas boot
```

## Files

| File | Purpose |
|---|---|
| `scripts/sync-canvas.js` | build canvas → `resources/canvas` + inject bridge |
| `scripts/copy-canvas.js` | `resources/canvas` → `out/renderer/canvas` (build hook) |
| `scripts/verify-canvas-e2e.js` | headless E2E check |
| `packages/desktop/resources/canvas/` | canvas sub-app source (generated) |
| `packages/desktop/src/renderer/pages/canvas/index.tsx` | iframe page + config bridge |
| `packages/desktop/src/renderer/utils/canvas/aiConfig.ts` | provider → canvas config |
| `packages/desktop/src/renderer/components/layout/Sider/SiderNav/SiderCanvasEntry.tsx` | sider entry |
| `packages/desktop/electron.vite.config.ts` | `copyCanvasPlugin` (renderer closeBundle) |
