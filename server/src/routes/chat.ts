import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { ChatService } from "../service/chat.service.js";
import { AudioFileManager } from "../service/audio.service.js";
import { HTMLRenderer } from "../service/html.renderer.js";
import { HTMLRepository } from "../service/html.repository.js";
import { HermesClient } from "../service/hermes.client.js";
import fs from "fs";
import os from "os";
import path from "path";

const audioFileManager = new AudioFileManager();
const htmlRenderer = new HTMLRenderer();
const htmlRepository = new HTMLRepository();
const hermesClient = new HermesClient();
const chatService = new ChatService(audioFileManager, htmlRenderer, htmlRepository, hermesClient);

const chatRequestSchema = z.object({
  input: z.string().min(1),
  sessionId: z.string().optional(),
  audio: z.string().optional(),
});

const chatResponseSchema = z.object({
  sessionId: z.string(),
  html: z.string(),
  audio: z.array(z.object({
    id: z.string(),
    url: z.string(),
    text: z.string(),
    duration: z.string(),
  })),
  streaming: z.boolean(),
});

const messagesParamsSchema = z.object({
  sessionId: z.string().min(1),
});

const sessionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

const createSessionRequestSchema = z.object({
  title: z.string().min(1).optional(),
});

const sessionSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  createdAt: z.number(),
});

export const chatRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post("/chat", {
    schema: {
      body: chatRequestSchema,
      response: {
        200: chatResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { input, sessionId, audio } = request.body as { input: string; sessionId?: string; audio?: string };
    try {
      let result;
      if (audio) {
        const audioBuffer = Buffer.from(audio, "base64");
        const tmpDir = path.join(os.tmpdir(), "hermes-audio-uploads");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tempPath = path.join(tmpDir, `audio_${Date.now()}.webm`);
        fs.writeFileSync(tempPath, audioBuffer);
        result = await chatService.processChat(tempPath, sessionId || null);
      } else {
        if (!input || typeof input !== "string") {
          return reply.status(400).send({ error: "Input is required and must be a string" });
        }
        result = await chatService.processChat(input, sessionId || null);
      }
      return result;
    } catch (err) {
      const error = err as { status?: number; message?: string };
      if (error.status === 404) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message || "Internal server error" });
    }
  });

  fastify.get("/messages/:sessionId", {
    schema: {
      params: z.object({ sessionId: z.string().min(1) }),
      response: {
        200: z.string(),
      },
    },
  }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const html = await htmlRepository.fetchAndBuildHtml(sessionId, htmlRenderer);
    const streaming = htmlRepository.isStreaming(sessionId);
    reply.header("Content-Type", "text/html");
    reply.header("X-Streaming", streaming ? "true" : "false");
    return html || "<div class='message-block'><div class='message-body'>Sem mensagens ainda.</div></div>";
  });

  fastify.get("/sessions", {
    schema: {
      querystring: z.object({
        limit: z.coerce.number().int().positive().max(100).optional().default(20),
        offset: z.coerce.number().int().nonnegative().optional().default(0),
      }),
      response: {
        200: z.string(),
      },
    },
  }, async (request, reply) => {
    const { limit, offset } = request.query as { limit?: number; offset?: number };
    // Use htmlRepository or sessionsService
    reply.header("Content-Type", "text/html");
    return "";
  });

  fastify.post("/sessions", {
    schema: {
      body: z.object({ title: z.string().min(1).optional() }),
      response: {
        201: z.object({
          sessionId: z.string(),
          title: z.string(),
          createdAt: z.number(),
        }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { title } = request.body as { title?: string };
    try {
      const sessionTitle = title || `Chat ${new Date().toLocaleString()} ${Math.random().toString(36).slice(2, 8)}`;
      const session = await hermesClient.createSession(sessionTitle);
      return reply.status(201).send({
        sessionId: session.sessionId,
        title: sessionTitle,
        createdAt: Date.now(),
      });
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to create session" });
    }
  });
};

export default chatRoutes;