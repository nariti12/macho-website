#!/usr/bin/env node
// Minimal memory_bank MCP server implementation.
// Provides basic tooling to store and retrieve "memories" persisted on disk.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(
  SCRIPT_DIR,
  "memory-bank-data",
  "memories.json",
);
const DB_PATH = process.env.MEMORY_BANK_PATH || DEFAULT_DB_PATH;

let storageAvailable = true;
let inMemoryMemories = [];

async function ensureStore() {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, "[]", "utf8");
  }
}

async function loadMemories() {
  if (!storageAvailable) {
    return inMemoryMemories;
  }
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      inMemoryMemories = [...data];
      return data;
    }
  } catch (err) {
    storageAvailable = false;
    console.error("[memory_bank] failed to load memories:", err);
    console.error("[memory_bank] falling back to in-memory store only.");
    return inMemoryMemories;
  }
  return [];
}

async function saveMemories(memories) {
  if (!storageAvailable) {
    inMemoryMemories = [...memories];
    return;
  }
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(memories, null, 2), "utf8");
  } catch (err) {
    storageAvailable = false;
    inMemoryMemories = [...memories];
    console.error("[memory_bank] failed to persist memories:", err);
    console.error("[memory_bank] falling back to in-memory store only.");
  }
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildMemoryResource(memories) {
  return {
    uri: "memory-bank://memories/all",
    name: "Stored Memories",
    description: "Chronological list of saved memory entries.",
    mimeType: "application/json",
    metadata: {
      count: memories.length,
      lastUpdated:
        memories.length > 0 ? memories[memories.length - 1].timestamp : null,
    },
  };
}

async function main() {
  console.error(`[memory_bank] server starting (pid ${process.pid})`);
  try {
    await ensureStore();
  } catch (err) {
    storageAvailable = false;
    console.error("[memory_bank] persistent storage unavailable:", err);
    console.error("[memory_bank] running with in-memory storage only.");
  }

  const server = new Server(
    { name: "memory_bank", version: "0.1.0" },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  server.oninitialized = () => {
    console.error("[memory_bank] initialization completed");
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "memory_bank.store",
          description:
            "Store a memory entry with optional source and tags metadata.",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string", description: "Memory content to store." },
              source: {
                type: "string",
                description: "Origin or context for the memory.",
              },
              tags: {
                anyOf: [
                  {
                    type: "array",
                    items: { type: "string" },
                    description: "Tags associated with this memory entry.",
                  },
                  {
                    type: "string",
                    description: "Comma separated list of tags.",
                  },
                ],
              },
            },
            required: ["text"],
            additionalProperties: false,
          },
        },
        {
          name: "memory_bank.list",
          description:
            "List recent memory entries. Defaults to the latest 10 entries.",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                description: "Maximum number of entries to return.",
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: "memory_bank.clear",
          description:
            "Clear every stored memory entry. Use with caution; this is irreversible.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    if (name === "memory_bank.store") {
      if (!args.text || typeof args.text !== "string") {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "memory_bank.store requires a string 'text' property.",
        );
      }
      const memories = await loadMemories();
      const entry = {
        id: crypto.randomUUID(),
        text: args.text,
        source: args.source || null,
        tags: normalizeTags(args.tags),
        timestamp: new Date().toISOString(),
      };
      memories.push(entry);
      await saveMemories(memories);
      return {
        content: [
          {
            type: "text",
            text: `Stored memory entry (${entry.id}).`,
          },
        ],
      };
    }
    if (name === "memory_bank.list") {
      const limit =
        typeof args.limit === "number" && args.limit > 0
          ? Math.min(args.limit, 100)
          : 10;
      const memories = await loadMemories();
      const slice = memories.slice(-limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(slice, null, 2),
          },
        ],
      };
    }
    if (name === "memory_bank.clear") {
      await saveMemories([]);
      return {
        content: [
          {
            type: "text",
            text: "Cleared all memory entries.",
          },
        ],
      };
    }
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool '${name}' requested.`,
    );
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const memories = await loadMemories();
    return { resources: [buildMemoryResource(memories)] };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates: [] };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri !== "memory-bank://memories/all") {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource URI: ${request.params.uri}`,
      );
    }
    const memories = await loadMemories();
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(memories, null, 2),
        },
      ],
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: [] };
  });

  server.setRequestHandler(GetPromptRequestSchema, async () => {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "memory_bank does not provide prompts.",
    );
  });

  const transport = new StdioServerTransport();
  // Ensure the process remains alive to receive stdio messages until the client disconnects.
  if (typeof process.stdin.resume === "function") {
    process.stdin.resume();
  }
  process.stdin.on("data", (chunk) => {
    console.error(`[memory_bank] raw stdin chunk (${chunk.length} bytes)`);
  });
  const keepAlive = setInterval(() => {
    // periodic no-op to keep Node.js event loop alive while awaiting client messages
  }, 60_000);

  const closed = new Promise((resolve) => {
    server.onclose = () => {
      console.error("[memory_bank] connection closed");
      clearInterval(keepAlive);
      resolve();
    };
    server.onerror = (err) => {
      console.error("[memory_bank] transport error:", err);
    };
  });

  await server.connect(transport);
  await closed;
  console.error("[memory_bank] main loop exiting");
}

main().catch((err) => {
  console.error("[memory_bank] fatal:", err);
  process.exit(1);
});
