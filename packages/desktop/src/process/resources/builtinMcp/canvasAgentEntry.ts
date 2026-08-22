/**
 * @license
 * Copyright 2026 Ai8 Work
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Infinite Canvas agent — MCP entry (Ai8 Work integration).
 *
 * Bundles the canvas-agent MCP mode (from the MIT-licensed
 * basketikun/infinite-canvas project) as a self-contained CJS script executed
 * by an external `node` process. The upstream CLI entry uses top-level await,
 * so we wrap the exported startMcpServer() here instead.
 */
import { startMcpServer } from './canvasAgent/server/mcp.js';

void startMcpServer();
