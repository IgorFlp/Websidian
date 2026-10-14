import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { NotesService } from "../service/notes.service.js";

const notesService = new NotesService();

const newNoteRequestSchema = z.object({
  noteName: z.string().min(1),
  timestamp: z.string().min(1),
  text: z.string().min(1),
  vault: z.coerce.number().int().nonnegative().optional().default(0),
});

const newNoteResponseSchema = z.object({
  ok: z.string(),
  path: z.string().optional(),
});

export const notesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post("/api/newNote", {
    schema: {
      body: newNoteRequestSchema,
      response: {
        200: newNoteResponseSchema,
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { noteName, timestamp, text, vault } = request.body as { noteName: string; timestamp: string; text: string; vault?: number };
    try {
      const result = notesService.createOrAppendNote({ noteName, timestamp, text, vaultIndex: vault });
      return reply.status(200).send(result);
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Erro ao criar a nota" });
    }
  });
};

export default notesRoutes;