import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { ensureRouterRunning } from "./router-launcher.js";

async function main() {
  const routerInfo = await ensureRouterRunning();
  const host = process.env.MCP_HOST || "127.0.0.1";
  const port =
    (routerInfo?.port && String(routerInfo.port)) ||
    process.env.MCP_PORT ||
    process.env.MCPR_PORT ||
    "3282";
  const configPath = path.resolve(process.cwd(), "router.config.json");
  const isWin = process.platform === "win32";
  const routerCmdEnv = process.env.ROUTER_CMD?.trim();
  const binDir = path.resolve(process.cwd(), "node_modules", ".bin");
  let cmd = isWin
    ? path.join(binDir, "mcpr-cli.cmd")
    : path.join(binDir, "mcpr-cli");
  // default to mcpr-cli bridge to the desktop router
  let args = ["connect", "--host", host, "--port", port];

  if (routerCmdEnv) {
    const parts = routerCmdEnv.split(" ").filter(Boolean);
    cmd = parts.shift();
    args = [...parts, "--config", configPath, "--stdio", "--log-level", "debug"];
  }

  const transport = new StdioClientTransport({
    command: cmd,
    args,
    cwd: process.cwd(),
    env: { ...process.env, NO_COLOR: "1", MCPR_TOKEN: process.env.MCPR_TOKEN || "" },
    stderr: "pipe",
  });

  const err = transport.stderr;
  if (err) {
    err.on("data", (d) => process.stderr.write(`[router] ${d}`));
  }
  const client = new Client({ name: "codexcli", version: "0.1.0" });

  try {
    await client.connect(transport, { timeoutMs: 20000 });
    console.log("Connected to router.");
    console.log("Server:", client.getServerVersion());
    console.log("Capabilities:", client.getServerCapabilities());

    try {
      const tools = await client.listTools();
      console.log("Tools:", tools);
    } catch (e) {
      console.log("Tools: (error)", e?.message || e);
    }
  } catch (err) {
    console.error("Failed to connect to router:", err?.message || err);
    process.exitCode = 1;
  } finally {
    try {
      await client.close();
    } catch (closeErr) {
      console.error("Failed to close MCP client cleanly:", closeErr?.message || closeErr);
    }
  }
}

main();
