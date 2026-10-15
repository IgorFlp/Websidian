import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { FilesService } from "../service/files.service.js";
import path from "path";

const filesService = new FilesService();

const getFilesQuerySchema = z.object({
  flat: z.coerce.boolean().optional().default(false),
  vault: z.coerce.number().int().nonnegative().optional().default(0),
});

const fileContentQuerySchema = z.object({
  path: z.string().min(1),
  vault: z.coerce.number().int().nonnegative().optional().default(0),
});

const downloadQuerySchema = z.object({
  path: z.string().min(1),
  vault: z.coerce.number().int().nonnegative().optional().default(0),
});

const fileNodeSchema: z.ZodType<any> = z.object({
  type: z.enum(["folder", "file"]),
  name: z.string(),
  path: z.string(),
  children: z.array(z.unknown()).optional(),
  size: z.number().optional(),
  modified: z.number().optional(),
});

const apiFilesResponseSchema = z.object({
  files: z.array(fileNodeSchema),
});

const fileContentResponseSchema = z.object({
  content: z.string(),
  path: z.string(),
});

export const filesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("/api/files", {
    schema: {
      querystring: getFilesQuerySchema,
      response: {
        200: apiFilesResponseSchema,
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { flat, vault } = request.query as { flat?: boolean; vault?: number };
    try {
      const result = filesService.getFiles({ flat, vaultIndex: vault });
      return result;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to get files" });
    }
  });

  fastify.get("/api/file-content", {
    schema: {
      querystring: fileContentQuerySchema,
      response: {
        200: fileContentResponseSchema,
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { path: filePath, vault } = request.query as { path: string; vault?: number };
    try {
      const result = filesService.getFileContent(filePath, vault);
      return result;
    } catch (err) {
      return reply.status(404).send({ error: "File not found" });
    }
  });

  fastify.get("/download", {
    schema: {
      querystring: downloadQuerySchema,
      response: {
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { path: filePath, vault } = request.query as { path: string; vault?: number };
    try {
      const { fullPath, fileName } = filesService.downloadFile(filePath, vault);
      return reply.sendFile(fileName, path.dirname(fullPath));
    } catch (err) {
      if (err instanceof Error && err.message === "File not found") {
        return reply.status(404).send({ error: "File not found" });
      }
      return reply.status(500).send({ error: "Erro ao processar download" });
    }
  });
};

export default filesRoutes;