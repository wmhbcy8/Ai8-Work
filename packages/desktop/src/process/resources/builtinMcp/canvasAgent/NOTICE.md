# Vendored source notice

The files under this directory (`canvasAgent/`) are vendored from
[**basketikun/infinite-canvas**](https://github.com/basketikun/infinite-canvas)
(`canvas-agent/src`), commit-based snapshot at v0.6.0.

- **License**: MIT — see upstream LICENSE (https://github.com/basketikun/infinite-canvas/blob/main/LICENSE)
- **Modified** (Ai8 Work):
  - `config.ts`: `AGENT_PROMPT` load falls back to `__dirname`-relative path for
    the CJS MCP bundle (where `import.meta.url` is unavailable).
- The canvas-agent MCP server requires the local Canvas Agent HTTP service
  (started from the canvas web app's Agent panel) to operate on a connected
  canvas page. See https://github.com/basketikun/infinite-canvas/tree/main/canvas-agent
