/**
 * Headless verification for the built-in Infinite Canvas MCP server.
 *
 * Simulates what an AionUi agent session does: spawn the MCP server configured
 * in runBackendMigrations.ts (npx -y @basketikun/canvas-agent mcp) over stdio,
 * perform the MCP handshake and list the exposed canvas tools.
 *
 * Run:  node scripts/verify-canvas-mcp.js
 */
const path = require('path');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

const BUNDLE = path.resolve(__dirname, '..', 'out', 'main', 'builtin-mcp-canvas-agent.js');

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [BUNDLE, 'mcp'],
  });
  const client = new Client({ name: 'ai8-work-verify', version: '1.0.0' });
  console.log(`[mcp] spawning: node ${BUNDLE} mcp`);
  await client.connect(transport);

  const serverInfo = client.getServerVersion();
  console.log('[mcp] handshake OK — server:', JSON.stringify(serverInfo));

  const toolsResult = await client.listTools();
  const tools = toolsResult.tools || [];
  console.log(`[mcp] discovered ${tools.length} tools:`);
  for (const tool of tools) {
    console.log('  -', tool.name);
  }
  if (tools.length === 0) {
    throw new Error('no tools exposed by the canvas-agent MCP server');
  }

  await client.close();
  console.log('[mcp] ✅ CANVAS-AGENT MCP VERIFICATION PASSED');
}

main().catch((err) => {
  console.error('[mcp] ❌ FAILED:', err.message);
  process.exit(1);
});
