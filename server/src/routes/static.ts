import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthService } from "../service/auth.service.js";
import fs from "fs";
import path from "path";

const authService = new AuthService();

const emptyResponseSchema = z.object({});

export const staticRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const publicDir = path.join(process.cwd(), "..", "public");

  fastify.get("/", {
    schema: {
      response: { 200: emptyResponseSchema },
      hide: true,
    },
  }, async (request, reply) => {
    const isAuthenticated = authService.isAuthenticated(request.session as unknown as Record<string, unknown> | undefined);
    if (isAuthenticated) {
      const indexPath = path.join(publicDir, "index.html");
      if (fs.existsSync(indexPath)) {
        return reply.sendFile("index.html");
      }
    }
    return reply.redirect("/login");
  });
};

export default staticRoutes;