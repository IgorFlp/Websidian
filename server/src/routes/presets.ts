import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { PresetsService } from "../service/presets.service.js";

const presetsService = new PresetsService();

const presetFileSchema = z.object({
  path: z.string(),
  order: z.number().int(),
});

const presetSchema = z.object({
  id: z.string(),
  name: z.string(),
  files: z.array(presetFileSchema),
  vaultIndex: z.number().int(),
  order: z.number().int(),
  createdAt: z.string(),
});

const presetsResponseSchema = z.object({
  presets: z.array(presetSchema),
});

const createPresetRequestSchema = z.object({
  name: z.string().min(1),
  files: z.array(z.string()).optional().default([]),
  vaultIndex: z.coerce.number().int().nonnegative().optional().default(0),
  order: z.coerce.number().int().optional(),
});

const updatePresetRequestSchema = z.object({
  name: z.string().min(1).optional(),
  vaultIndex: z.coerce.number().int().optional(),
  order: z.coerce.number().int().optional(),
});

const reorderPresetsRequestSchema = z.object({
  presetIds: z.array(z.string()).min(1),
});

const presetFilesRequestSchema = z.object({
  files: z.array(presetFileSchema),
});

const presetParamsSchema = z.object({
  id: z.string(),
});

export const presetsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("/api/presets", {
    schema: {
      response: {
        200: presetsResponseSchema,
        500: z.object({ error: z.string() }),
      },
    },
  }, async (_request, reply) => {
    const presets = presetsService.getAll();
    return { presets };
  });

  fastify.post("/api/presets", {
    schema: {
      body: createPresetRequestSchema,
      response: {
        201: z.object({ preset: presetSchema }),
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { name, files, vaultIndex, order } = request.body as { name: string; files?: string[]; vaultIndex?: number; order?: number };
    try {
      const preset = presetsService.create(name, files, vaultIndex, order);
      return reply.status(201).send({ preset });
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : "Failed to create preset" });
    }
  });

  fastify.delete("/api/presets/:id", {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({ ok: z.boolean() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = presetsService.delete(id);
    if (!deleted) {
      return reply.status(404).send({ error: "Preset not found" });
    }
    return { ok: true };
  });

  fastify.put("/api/presets/:id", {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        name: z.string().min(1).optional(),
        vaultIndex: z.number().int().optional(),
        order: z.number().int().optional(),
      }),
      response: {
        200: z.object({ preset: presetSchema }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, vaultIndex, order } = request.body as { name?: string; vaultIndex?: number; order?: number };
    const preset = presetsService.update(id, { name, vaultIndex, order });
    if (!preset) {
      return reply.status(404).send({ error: "Preset not found" });
    }
    return { preset };
  });

  fastify.put("/api/presets/reorder", {
    schema: {
      body: z.object({ presetIds: z.array(z.string()).min(1) }),
      response: {
        200: z.object({ ok: z.boolean() }),
        400: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { presetIds } = request.body as { presetIds: string[] };
    try {
      presetsService.reorder(presetIds);
      return { ok: true };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : "Failed to reorder presets" });
    }
  });

  fastify.put("/api/presets/:id/files", {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ files: z.array(z.object({ path: z.string(), order: z.number().int() })) }),
      response: {
        200: z.object({ preset: presetSchema }),
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { files } = request.body as { files: { path: string; order?: number }[] };
    const preset = presetsService.updateFiles(id, files);
    if (!preset) {
      return reply.status(404).send({ error: "Preset not found" });
    }
    return { preset };
  });
};

export default presetsRoutes;