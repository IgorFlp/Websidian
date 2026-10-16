import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { TasksService } from "../service/tasks.service.js";

const tasksService = new TasksService();

const scanTasksQuerySchema = z.object({
  path: z.string().optional().default(""),
  vault: z.coerce.number().int().nonnegative().optional().default(0),
});

const taskSchema = z.object({
  text: z.string(),
  done: z.boolean(),
  due: z.string().nullable(),
  scheduled: z.string().nullable(),
  doneDate: z.string().nullable(),
  tags: z.array(z.string()),
  recurring: z.boolean(),
  recurringRule: z.string().nullable(),
  displayText: z.string(),
  file: z.string(),
  line: z.number().int(),
  vaultIndex: z.number().int(),
});

const taskToggleRequestSchema = z.object({
  file: z.string().min(1),
  line: z.number().int(),
  vault: z.coerce.number().int().nonnegative().optional().default(0),
});

const taskToggleResponseSchema = z.object({
  ok: z.boolean(),
  task: taskSchema.optional(),
});

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
    const { path: pathPrefix, vault } = request.query as { path?: string; vault?: number };
    try {
      const tasks = tasksService.scanTasks(vault, pathPrefix);
      return tasks;
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
};

export default tasksRoutes;