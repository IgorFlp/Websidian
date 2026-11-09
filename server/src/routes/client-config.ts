import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { config } from "../config/index.js";

const clientConfigSchema = z.object({
  beszelApiUrl: z.string(),
  beszelApiKey: z.string(),
});

export const clientConfigRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("/api/client-config", {
    schema: {
      response: {
        200: clientConfigSchema,
      },
    },
  }, async () => {
    return {
      beszelApiUrl: config.beszelApiUrl,
      beszelApiKey: config.beszelApiKey,
    };
  });
};

export default clientConfigRoutes;