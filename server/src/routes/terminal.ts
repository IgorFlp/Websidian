import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { TerminalService } from "../service/terminal.service.js";
import { HTMLRenderer } from "../service/html.renderer.js";

const terminalService = new TerminalService();
const htmlRenderer = new HTMLRenderer();

const terminalInputRequestSchema = z.object({
  input: z.string(),
  sessionId: z.string().optional(),
});

const terminalInputResponseSchema = z.object({
  accepted: z.boolean(),
  sessionId: z.string().optional(),
});

const terminalPollQuerySchema = z.object({
  sessionId: z.string().min(1),
  since: z.coerce.number().int().nonnegative().optional().default(0),
});

const terminalPollResponseSchema = z.object({
  since: z.number(),
  html: z.string(),
  audio: z.array(z.unknown()),
});

export const terminalRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post("/terminal/input", {
    schema: {
      body: terminalInputRequestSchema,
      response: {
        202: terminalInputResponseSchema,
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const { input, sessionId } = request.body as { input: string; sessionId?: string };

      if (!input || typeof input !== "string") {
        return reply.status(400).send({ error: "Invalid payload: content must be a string" });
      }

      await terminalService.writeInput(input);
      return { accepted: true, sessionId };
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Terminal error" });
    }
  });

  fastify.get("/terminal/poll", {
    schema: {
      querystring: terminalPollQuerySchema,
      response: {
        200: terminalPollResponseSchema,
        400: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { sessionId, since } = request.query as { sessionId: string; since?: number };

    if (!sessionId) {
      return reply.status(400).send({ error: "Missing sessionId" });
    }

    const timeoutMs = 30000;
    const startTime = Date.now();

    const checkForNewOutput = async (): Promise<{ since: number; html: string; audio: unknown[] }> => {
      const sinceValue = since ?? 0;
      const result = await terminalService.pollOutput(sinceValue);

      if (result.html) {
        return result;
      }

      if (Date.now() - startTime >= timeoutMs) {
        return { since: Date.now(), html: "", audio: [] };
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      return checkForNewOutput();
    };

    return checkForNewOutput();
  });
};

export default terminalRoutes;