// A resilient stdio<->HTTP MCP bridge for MCP Router Desktop variants.
// - Probes multiple endpoint paths and auth header styles
// - Exposes a stdio MCP server for Codex to connect to

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListResourceTemplatesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, InitializeRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

const HOST = process.env.MCP_HOST || process.env.MCPR_HOST || "";
const PORT = process.env.MCP_PORT || process.env.MCPR_PORT || "3282";
// Optional: direct base URL to avoid probing (e.g. http://127.0.0.1:6333/mcp)
const BASE_URL = process.env.MCP_BASE_URL || process.env.SERENA_MCP_URL || "";
// Silence noisy probe errors when no server is available
const SILENT = ["1", "true", "yes"].includes(String(process.env.MCP_SILENT || "").toLowerCase());
// Ensure local connections ignore any corporate proxy settings
process.env.NO_PROXY = process.env.NO_PROXY || "localhost,127.0.0.1,::1";
const TOKEN = process.env.MCPR_TOKEN || process.env.MCP_TOKEN || "";

const CANDIDATE_PATHS = [
  "/mcp",
  "/api/mcp",
  "/mcp/v1",
  "/v1/mcp",
  "/api/v1/mcp",
  "/",
];

const HEADER_VARIANTS = (token) => [
  { Authorization: token ? `Bearer ${token}` : undefined },
  token ? { "X-MCP-Token": token } : {},
];

function buildUrl(scheme, host, port, path) {
  const h = host.includes(":") ? `[${host}]` : host; // bracket IPv6
  return new URL(`${scheme}://${h}:${port}${path}`);
}

async function probeTransport() {
  const errors = [];
  const hosts = HOST ? [HOST] : ["127.0.0.1", "::1", "localhost"];
  const schemes = ["http", "https"];
  
  // If a direct base URL is provided, try only that
  if (BASE_URL) {
    for (const hdrs of HEADER_VARIANTS(TOKEN)) {
      const headers = Object.fromEntries(
        Object.entries({ ...hdrs }).filter(([_, v]) => !!v)
      );
      try {
        const url = new URL(BASE_URL);
        if (url.protocol === "https:") {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";
        }
        const transport = new StreamableHTTPClientTransport(url, { requestInit: { headers } });
        const client = new Client({ name: "mcpr-bridge", version: "0.1.0" });
        await client.connect(transport, { timeoutMs: 8000 });
        return { client, transport, url, headers };
      } catch (err) {
        errors.push(`${BASE_URL} ${JSON.stringify(headers)} -> ${err?.message || err}`);
      }
    }
    if (SILENT) return null;
    throw new Error(`Failed to connect to MCP at ${BASE_URL}`);
  }
  for (const host of hosts) {
    for (const scheme of schemes) {
      for (const path of CANDIDATE_PATHS) {
        for (const hdrs of HEADER_VARIANTS(TOKEN)) {
          const headers = Object.fromEntries(
            Object.entries({ ...hdrs }).filter(([_, v]) => !!v)
          );
          const url = buildUrl(scheme, host, PORT, path);
          if (scheme === "https") {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";
          }
          const transport = new StreamableHTTPClientTransport(url, {
            requestInit: { headers },
          });
          const client = new Client({ name: "mcpr-bridge", version: "0.1.0" });
          try {
            await client.connect(transport, { timeoutMs: 8000 });
            return { client, transport, url, headers };
          } catch (err) {
            errors.push(`${url.href} ${JSON.stringify(headers)} -> ${err?.message || err}`);
          }
        }
      }
    }
  }
  if (SILENT) return null;
  throw new Error("No MCP server reachable on common endpoints");
}

async function main() {
  const server = new Server({ name: "mcpr-bridge", version: "0.1.0" }, {
    capabilities: { resources: {}, tools: {}, prompts: {} },
  });

  let httpClient = null;
  let connectedInfo = null;

  server.onerror = (e) => {
    console.error("[bridge] server error:", e?.message || e);
  };

  // Lazily connect to HTTP server on initialize, to attach Codex client info
  server.setRequestHandler(InitializeRequestSchema, async (request) => {
    if (!httpClient) {
      const result = await probeTransport();
      if (result) {
        const { client, url, headers } = result;
        httpClient = client;
        connectedInfo = { url: url.href, headers };
        console.error(`[bridge] connected: ${url.href}`);
      } else if (!SILENT) {
        console.error("[bridge] MCP not reachable; running with empty capabilities (MCP_SILENT=1 to hide this)");
      }
    }
    return {
      protocolVersion: request.params.protocolVersion,
      capabilities: { resources: {}, tools: {}, prompts: {} },
      serverInfo: { name: "mcpr-bridge", version: "0.1.0" },
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    if (!httpClient) return { tools: [] };
    try { const r = await httpClient.listTools(); return { tools: r.tools ?? [] }; }
    catch (e) { throw new McpError(ErrorCode.InternalError, `listTools failed: ${e?.message || e}`); }
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (!httpClient) {
      throw new McpError(ErrorCode.NotFound, `tool '${req.params.name}' not available (not connected to MCP)`);
    }
    try { return await httpClient.callTool({ name: req.params.name, arguments: req.params.arguments ?? {} }); }
    catch (e) { throw new McpError(ErrorCode.InternalError, `callTool ${req.params.name} failed: ${e?.message || e}`); }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    if (!httpClient) return { resources: [] };
    try { const r = await httpClient.listResources(); return { resources: r.resources ?? [] }; }
    catch (e) { throw new McpError(ErrorCode.InternalError, `listResources failed: ${e?.message || e}`); }
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({ resourceTemplates: [] }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    if (!httpClient) throw new McpError(ErrorCode.NotFound, `resource '${req.params.uri}' not available (not connected to MCP)`);
    try { return await httpClient.readResource({ uri: req.params.uri }); }
    catch (e) { throw new McpError(ErrorCode.InternalError, `readResource failed: ${e?.message || e}`); }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    if (!httpClient) return { prompts: [] };
    try { const r = await httpClient.listPrompts(); return { prompts: r.prompts ?? [] }; }
    catch (e) { throw new McpError(ErrorCode.InternalError, `listPrompts failed: ${e?.message || e}`); }
  });

  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    if (!httpClient) throw new McpError(ErrorCode.NotFound, `prompt '${req.params.name}' not available (not connected to MCP)`);
    try { return await httpClient.getPrompt({ name: req.params.name, arguments: req.params.arguments ?? {} }); }
    catch (e) { throw new McpError(ErrorCode.InternalError, `getPrompt failed: ${e?.message || e}`); }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("[bridge] fatal:", e?.message || e);
  process.exit(1);
});
