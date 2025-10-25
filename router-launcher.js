import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";

const CONFIG_FILE = "router.config.json";
const DEFAULT_PORT = 3282;
let routerProcess = null;
let routerReadyPromise = null;
let exitHookRegistered = false;

function resolveConfigPath() {
  return path.resolve(process.cwd(), CONFIG_FILE);
}

async function loadConfig() {
  const configPath = resolveConfigPath();
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return { config: parsed, dir: path.dirname(configPath) };
  } catch (err) {
    if (err.code === "ENOENT") {
      return { config: null, dir: path.dirname(configPath) };
    }
    throw new Error(`Failed to read router.config.json: ${err.message}`);
  }
}

function toAbsoluteCommand(baseDir, command) {
  if (!command) {
    throw new Error("router.config.json missing servers[].command");
  }
  if (
    command.startsWith("./") ||
    command.startsWith("../") ||
    command.includes("/") ||
    command.includes("\\")
  ) {
    return path.resolve(baseDir, command);
  }
  return command;
}

function toAbsoluteArgs(baseDir, args = []) {
  if (!Array.isArray(args)) return [];
  return args.map((arg, index) => {
    if (typeof arg !== "string") {
      return String(arg);
    }
    // Absolutize first arg if it looks like a path
    if (
      index === 0 &&
      (arg.startsWith("./") ||
        arg.startsWith("../") ||
        arg.endsWith(".js") ||
        arg.includes("/") ||
        arg.includes("\\"))
    ) {
      return path.resolve(baseDir, arg);
    }
    return arg;
  });
}

function waitForReady(child, port) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (ok, err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (ok) {
        resolve();
      } else {
        reject(err ?? new Error("MCP Router の起動に失敗しました。"));
      }
    };

    const checkPort = () =>
      new Promise((res, rej) => {
        const socket = net
          .createConnection({ host: "127.0.0.1", port }, () => {
            socket.end();
            res(true);
          })
          .on("error", (error) => {
            socket.destroy();
            rej(error);
          });
      });

    const timeout = setTimeout(async () => {
      try {
        await checkPort();
        finish(true);
      } catch {
        finish(false, new Error("MCP Router did not respond within 10 seconds."));
      }
    }, 10000);

    const handleOutput = (data) => {
      const text = data.toString();
      process.stderr.write(`[router] ${text}`);
      if (
        text.includes("All MCP servers connected and ready!") ||
        text.includes("HTTP MCP Aggregator Server listening")
      ) {
        finish(true);
      }
    };

    child.stderr.on("data", handleOutput);
    child.stdout.on("data", (data) => {
      const text = data.toString();
      process.stderr.write(`[router] ${text}`);
    });

    child.once("exit", (code, signal) => {
      if (settled) return;
      finish(
        false,
        new Error(
          `MCP Router exited before readiness (code=${code}, signal=${signal ?? "none"})`,
        ),
      );
    });
  });
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function registerExitHook() {
  if (exitHookRegistered) return;
  exitHookRegistered = true;
  const terminate = () => {
    if (routerProcess && !routerProcess.killed) {
      routerProcess.kill("SIGTERM");
    }
  };
  process.on("exit", terminate);
  process.on("SIGINT", () => {
    terminate();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    terminate();
    process.exit(143);
  });
}

async function startRouter() {
  const { config, dir } = await loadConfig();
  if (!config || !Array.isArray(config.servers) || config.servers.length === 0) {
    return null;
  }

  const port = Number(config.port ?? config.httpPort ?? DEFAULT_PORT);
  if (Number.isNaN(port)) {
    throw new Error("router.config.json port is not a valid number.");
  }

  if (await isPortOpen(port)) {
    return { port, started: false };
  }

  const mcprPath = path.resolve(process.cwd(), "node_modules", ".bin", "mcpr");
  try {
    await fs.access(mcprPath);
  } catch {
    throw new Error("node_modules/.bin/mcpr not found. Run npm install.");
  }

  const args = ["serve", "--port", String(port)];
  config.servers.forEach((server, index) => {
    const id = server.id || `server${index + 1}`;
    const name = server.name || id;
    const command = toAbsoluteCommand(dir, server.command);
    const serverArgs = toAbsoluteArgs(dir, server.args);
    args.push("--server", id, name, command, ...serverArgs);
  });

  const child = spawn(mcprPath, args, {
    cwd: config.cwd ? path.resolve(process.cwd(), config.cwd) : process.cwd(),
    env: { ...process.env, ...(config.env ?? {}) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  routerProcess = child;
  registerExitHook();
  await waitForReady(child, port);
  return { port, started: true };
}

export async function ensureRouterRunning() {
  if (routerReadyPromise) {
    return routerReadyPromise;
  }

  routerReadyPromise = startRouter()
    .catch((err) => {
      routerReadyPromise = null;
      throw err;
    });
  return routerReadyPromise;
}
