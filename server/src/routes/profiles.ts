import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { ProfilesService } from "../service/profiles.service.js";

const profilesService = new ProfilesService();

const profileSchema = z.object({
  name: z.string(),
  modelName: z.string(),
  endpoint: z.string(),
  isDefault: z.boolean(),
});

export const profilesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get("/profiles", {
    schema: {
      response: {
        200: z.array(profileSchema),
        500: z.object({ error: z.string() }),
      },
    },
  }, async (_request, reply) => {
    try {
      const profiles = await profilesService.getProfiles();
      return profiles;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : "Failed to get profiles" });
    }
  });
};

export default profilesRoutes;