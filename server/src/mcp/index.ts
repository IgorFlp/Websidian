import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "../config/index.js";
import { TasksService, type TaskFilter } from "../service/tasks.service.js";
import { NotesService } from "../service/notes.service.js";
import { PresetsService, type PresetFile } from "../service/presets.service.js";

const tasksService = new TasksService();
const notesService = new NotesService();
const presetsService = new PresetsService();

function validateApiKey(key: string): boolean {
  const mcpApiKey = config.mcpApiKey;
  if (!mcpApiKey) return false;
  return key === mcpApiKey;
}

async function callApi(endpoint: string, method: string, body?: unknown, apiKey?: string): Promise<unknown> {
  const baseUrl = `http://localhost:${config.port}`;
  const headers: Record<string, string> = {};
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Only set Content-Type for requests with a body
  const hasBody = body !== undefined && body !== null && method !== "GET" && method !== "DELETE";
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // For 204 No Content or empty responses, return empty object
  if (response.status === 204) {
    return {};
  }

  return response.json();
}

const TOOLS: Tool[] = [
  {
    name: "tasks_list",
    description: "List tasks with optional filtering by date range, completion status, scheduled/due dates, vault, and path",
    inputSchema: {
      type: "object",
      properties: {
        vault: { type: "number", description: "Vault index (default: 0)", default: 0 },
        path: { type: "string", description: "Path prefix to filter tasks (e.g., notes/)", default: "" },
        files: { type: "array", items: { type: "string" }, description: "Specific files to include" },
        startDate: { type: "string", description: "Start date for range filter (YYYY-MM-DD)", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        finishDate: { type: "string", description: "End date for range filter (YYYY-MM-DD)", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
        Done: { type: "boolean", description: "Include completed tasks (default: true)", default: true },
        Scheduled: { type: "boolean", description: "Include scheduled tasks (default: true)", default: true },
        Due: { type: "boolean", description: "Include tasks with due date (default: true)", default: true },
      },
      additionalProperties: false,
    },
  },
  {
    name: "task_toggle",
    description: "Toggle task completion status",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "File path (e.g., notes/tasks.md)" },
        line: { type: "number", description: "Line number (e.g., 5)" },
        vault: { type: "number", description: "Vault index (default: 0)", default: 0 },
      },
      required: ["file", "line"],
      additionalProperties: false,
    },
  },
  {
    name: "note_create",
    description: "Create a new note or append to existing note",
    inputSchema: {
      type: "object",
      properties: {
        noteName: { type: "string", description: "Note name (e.g., meeting-notes)" },
        timestamp: { type: "string", description: "Timestamp (e.g., 2024-01-15T10:30:00.000Z)" },
        text: { type: "string", description: "Note content" },
        vault: { type: "number", description: "Vault index (default: 0)", default: 0 },
      },
      required: ["noteName", "timestamp", "text"],
      additionalProperties: false,
    },
  },
  {
    name: "presets_list",
    description: "List all presets",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "preset_create",
    description: "Create a new preset",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Preset name" },
        files: { type: "array", items: { type: "string" }, description: "File paths", default: [] },
        vaultIndex: { type: "number", description: "Vault index (default: 0)", default: 0 },
        order: { type: "number", description: "Display order" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "preset_update",
    description: "Update an existing preset",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Preset ID" },
        name: { type: "string", description: "Preset name" },
        vaultIndex: { type: "number", description: "Vault index" },
        order: { type: "number", description: "Display order" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "preset_delete",
    description: "Delete a preset",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Preset ID" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "preset_reorder",
    description: "Reorder presets",
    inputSchema: {
      type: "object",
      properties: {
        presetIds: { type: "array", items: { type: "string" }, description: "Array of preset IDs in new order" },
      },
      required: ["presetIds"],
      additionalProperties: false,
    },
  },
  {
    name: "preset_files_update",
    description: "Update preset file order",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Preset ID" },
        files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, order: { type: "number" } }, required: ["path", "order"] }, description: "Array of file objects with path and order" },
      },
      required: ["id", "files"],
      additionalProperties: false,
    },
  },
  {
    name: "vaults_list",
    description: "List all available vaults",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

const server = new Server(
  {
    name: "websidian-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const apiKey = config.mcpApiKey;

  if (!apiKey) {
    throw new Error("MCP not configured: MCP_API_KEY not set");
  }

  // Ensure args is an object
  const parsedArgs = args && typeof args === 'object' ? args : {};

  try {
    switch (name) {
      case "tasks_list": {
        const filter = parsedArgs as TaskFilter;
        // Ensure numeric fields are numbers
        if (filter.vault !== undefined) filter.vault = Number(filter.vault);
        const result = await callApi("/api/tasks/list", "POST", filter, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "task_toggle": {
        const { file, line, vault = 0 } = parsedArgs as { file: string; line: number; vault?: number };
        const result = await callApi("/api/tasks/toggle", "POST", { file, line, vault: Number(vault) }, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "note_create": {
        const { noteName, timestamp, text, vault = 0 } = parsedArgs as { noteName: string; timestamp: string; text: string; vault?: number };
        const result = await callApi("/api/newNote", "POST", { noteName, timestamp, text, vault: Number(vault) }, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "presets_list": {
        const result = await callApi("/api/presets", "GET", undefined, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "preset_create": {
        const { name, files = [], vaultIndex = 0, order } = parsedArgs as { name: string; files?: string[]; vaultIndex?: number; order?: number };
        const result = await callApi("/api/presets", "POST", { name, files, vaultIndex: Number(vaultIndex), order: order !== undefined ? Number(order) : undefined }, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "preset_update": {
        const argsTyped = parsedArgs as { id: string; name?: string; vaultIndex?: number; order?: number };
        const { id, name, vaultIndex, order } = argsTyped;
        const body: { name?: string; vaultIndex?: number; order?: number } = {};
        if (name !== undefined) body.name = name;
        if (vaultIndex !== undefined) body.vaultIndex = Number(vaultIndex);
        if (order !== undefined) body.order = Number(order);
        const result = await callApi(`/api/presets/${id}`, "PUT", body, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "preset_delete": {
        const { id } = parsedArgs as { id: string };
        const result = await callApi(`/api/presets/${id}`, "DELETE", undefined, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "preset_reorder": {
        const { presetIds } = parsedArgs as { presetIds: string[] };
        const result = await callApi("/api/presets/reorder", "PUT", { presetIds }, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "preset_files_update": {
        const { id, files } = parsedArgs as { id: string; files: PresetFile[] };
        const result = await callApi(`/api/presets/${id}/files`, "PUT", { files }, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "vaults_list": {
        const result = await callApi("/vaults", "GET", undefined, apiKey);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Websidian MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});