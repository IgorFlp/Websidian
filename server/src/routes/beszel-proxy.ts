import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { config } from "../config/index.js";

const beszelProxySchema = z.object({
  method: z.string().default("GET"),
  path: z.string(),
  query: z.record(z.string()).optional(),
});

export const beszelProxyRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.all("/api/beszel/*", {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    const beszelUrl = config.beszelApiUrl;
    const token = config.beszelApiKey;
    
    if (!beszelUrl || !token) {
      return reply.status(500).send({ error: "Beszel not configured" });
    }

    // Extract the path after /api/beszel/
    const fullPath = request.url.replace("/api/beszel", "");
    const targetUrl = new URL(fullPath, beszelUrl).toString();

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          "Authorization": token,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body),
      });

      const data = await response.json();
      return reply.status(response.status).send(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      fastify.log.error({ err: error }, "Beszel proxy error");
      return reply.status(502).send({ error: "Bad gateway", message: errorMessage });
    }
  });
};

export default beszelProxyRoutes;