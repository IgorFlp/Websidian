import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { TasksService, type TaskFilter, type ScheduleDateOptions, type DeleteTaskOptions, type CreateTaskOptions } from "../service/tasks.service.js";
import { config } from "../config/index.js";

const tasksService = new TasksService();

const scanTasksQuerySchema = z.object({
  path: z.string().optional().default("").describe("Path prefix to filter tasks (e.g., notes/)"),
  vault: z.coerce.number().int().nonnegative().optional().default(0).describe("Vault index (e.g., 0)"),
});

const taskSchema = z.object({
  text: z.string().describe("Task text (e.g., Complete the project)"),
  done: z.boolean().describe("Task completion status (e.g., false)"),
  due: z.string().nullable().describe("Due date (e.g., 2024-01-20)"),
  scheduled: z.string().nullable().describe("Scheduled date (e.g., 2024-01-15)"),
  doneDate: z.string().nullable().describe("Completion date (e.g., null)"),
  tags: z.array(z.string()).describe("Tags (e.g., [\"work\", \"urgent\"])"),
  recurring: z.boolean().describe("Recurring flag (e.g., false)"),
  recurringRule: z.string().nullable().describe("Recurring rule (e.g., null)"),
  displayText: z.string().describe("Display text (e.g., Complete the project)"),
  file: z.string().describe("File path (e.g., notes/tasks.md)"),
  line: z.number().int().describe("Line number (e.g., 5)"),
  vaultIndex: z.number().int().describe("Vault index (e.g., 0)"),
});

const taskToggleRequestSchema = z.object({
  file: z.string().min(1).describe("File path (e.g., notes/tasks.md)"),
  line: z.number().int().describe("Line number (e.g., 5)"),
  vault: z.coerce.number().int().nonnegative().optional().default(0).describe("Vault index (e.g., 0)"),
});

const taskToggleResponseSchema = z.object({
  ok: z.boolean().describe("Success flag (e.g., true)"),
  task: taskSchema.optional(),
});

const taskFilterSchema = z.object({
  vault: z.coerce.number().int().nonnegative().optional().default(0).describe("Vault index"),
  path: z.string().optional().default("").describe("Path prefix to filter tasks"),
  files: z.array(z.string()).optional().describe("Specific files to include"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date for range filter (YYYY-MM-DD)"),
  finishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date for range filter (YYYY-MM-DD)"),
  Done: z.boolean().optional().default(true).describe("Include completed tasks (default true)"),
  Scheduled: z.boolean().optional().default(true).describe("Include scheduled tasks (default true)"),
  Due: z.boolean().optional().default(true).describe("Include tasks with due date (default true)"),
});

const taskScheduleRequestSchema = z.object({
  file: z.string().min(1).describe("File path (e.g., notes/tasks.md)"),
  taskText: z.string().min(1).describe("Task text to match"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format"),
  dateType: z.enum(["due", "scheduled"]).describe("Type of date to schedule"),
  vault: z.coerce.number().int().nonnegative().optional().default(0).describe("Vault index (default: 0)"),
});

const taskScheduleResponseSchema = z.object({
  ok: z.boolean(),
  task: taskSchema.optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
});

const taskDeleteRequestSchema = z.object({
  file: z.string().min(1).describe("File path (e.g., notes/tasks.md)"),
  taskText: z.string().min(1).describe("Task text to match"),
  vault: z.coerce.number().int().nonnegative().optional().default(0).describe("Vault index (default: 0)"),
});

const taskDeleteResponseSchema = z.object({
  ok: z.boolean(),
  deletedText: z.string().optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
});

const taskCreateRequestSchema = z.object({
  file: z.string().min(1).describe("File path (e.g., notes/tasks.md)"),
  taskText: z.string().min(1).describe("Task text to create"),
  referenceTask: z.string().optional().describe("Reference task text to insert below"),
  vault: z.coerce.number().int().nonnegative().optional().default(0).describe("Vault index (default: 0)"),
});

const taskCreateResponseSchema = z.object({
  ok: z.boolean(),
  task: taskSchema.optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
  suggestion: z.object({ file: z.string(), confidence: z.number() }).optional(),
});

function requireApiKeyOrSession(request: any, reply: any, done: () => void) {
  const authHeader = request.headers.authorization;
  const apiKey = config.mcpApiKey;

  // If no MCP_API_KEY configured, return 503 for MCP endpoints
  if (!apiKey) {
    return reply.status(503).send({ error: "MCP not configured" });
  }

  // Check for API_KEY auth
  if (authHeader?.startsWith("Bearer ")) {
    const providedKey = authHeader.slice(7);
    if (providedKey === apiKey) {
      return done();
    }
    return reply.status(401).send({ error: "Invalid API key" });
  }

  // Check for session auth
  const session = request.session as any;
  if (session?.auth === true) {
    return done();
  }

  return reply.status(401).send({ error: "API key required" });
}

export const tasksRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("/api/tasks", {
    schema: {
      querystring: scanTasksQuerySchema,
      response: {
        200: z.array(taskSchema),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    // Log deprecation warning
    fastify.log.warn("GET /api/tasks deprecated, use POST /api/tasks/list");

    const { path: pathPrefix, vault } = request.query as { path?: string; vault?: number };
    try {
      const tasks = tasksService.scanTasks(vault ?? 0, pathPrefix ?? "");
      return tasks;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Error scanning tasks" });
    }
  });

  fastify.post("/api/tasks/list", {
    schema: {
      body: taskFilterSchema,
      response: {
        200: z.array(taskSchema),
        400: z.object({ error: z.string() }),
        401: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
        503: z.object({ error: z.string() }),
      },
    },
    preHandler: requireApiKeyOrSession,
  }, async (request, reply) => {
    const filter = request.body as TaskFilter;
    try {
      // Validate date range: both startDate and finishDate must be provided together
      if ((filter.startDate && !filter.finishDate) || (!filter.startDate && filter.finishDate)) {
        return reply.status(400).send({ error: "Both startDate and finishDate must be provided together" });
      }

      const tasks = tasksService.scanTasks(filter.vault ?? 0, filter.path ?? "");
      const filtered = tasksService.filterTasks(tasks, filter);
      return filtered;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Error scanning tasks" });
    }
  });

  fastify.post("/api/tasks/toggle", {
    schema: {
      body: taskToggleRequestSchema,
      response: {
        200: taskToggleResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { file, line, vault } = request.body as { file: string; line: number; vault?: number };
    try {
      const result = tasksService.toggleTask({ file, line, vaultIndex: vault ?? 0 });
      if (!result.ok) {
        return reply.status(404).send({ error: "Task not found" });
      }
      return result;
    } catch (err) {
      if (err instanceof Error && err.message === "File not found") {
        return reply.status(404).send({ error: "File not found" });
      }
      if (err instanceof Error && err.message === "Not a task line") {
        return reply.status(400).send({ error: "Not a task line" });
      }
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to toggle task" });
    }
  });

  fastify.post("/api/tasks/schedule", {
    schema: {
      body: taskScheduleRequestSchema,
      response: {
        200: taskScheduleResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
    preHandler: requireApiKeyOrSession,
  }, async (request, reply) => {
    const { file, taskText, date, dateType, vault } = request.body as ScheduleDateOptions & { vault?: number };
    try {
      const result = tasksService.scheduleTaskDate({ file, taskText, date, dateType, vaultIndex: vault ?? 0 });
      if (!result.ok) {
        const status = result.error?.code === "NOT_FOUND" ? 404 :
                       result.error?.code === "AMBIGUOUS_MATCH" ? 400 :
                       result.error?.code === "INVALID_DATE" ? 400 :
                       result.error?.code === "INVALID_DATE_TYPE" ? 400 : 500;
        return reply.status(status).send({ error: result.error?.message || "Failed to schedule date" });
      }
      return result;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to schedule date" });
    }
  });

  fastify.post("/api/tasks/delete", {
    schema: {
      body: taskDeleteRequestSchema,
      response: {
        200: taskDeleteResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
    preHandler: requireApiKeyOrSession,
  }, async (request, reply) => {
    const { file, taskText, vault } = request.body as DeleteTaskOptions & { vault?: number };
    try {
      const result = tasksService.deleteTask({ file, taskText, vaultIndex: vault ?? 0 });
      if (!result.ok) {
        const status = result.error?.code === "NOT_FOUND" ? 404 :
                       result.error?.code === "AMBIGUOUS_MATCH" ? 400 : 500;
        return reply.status(status).send({ error: result.error?.message || "Failed to delete task" });
      }
      return result;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to delete task" });
    }
  });

  fastify.post("/api/tasks/create", {
    schema: {
      body: taskCreateRequestSchema,
      response: {
        200: taskCreateResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
    preHandler: requireApiKeyOrSession,
  }, async (request, reply) => {
    const { file, taskText, referenceTask, vault } = request.body as CreateTaskOptions & { vault?: number };
    try {
      const result = tasksService.createTask({ file, taskText, referenceTask, vaultIndex: vault ?? 0 });
      if (!result.ok) {
        const status = result.error?.code === "NOT_FOUND" ? 404 :
                       result.error?.code === "REFERENCE_NOT_FOUND" ? 404 : 500;
        return reply.status(status).send({ error: result.error?.message || "Failed to create task" });
      }
      return result;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to create task" });
    }
  });
};

export default tasksRoutes;