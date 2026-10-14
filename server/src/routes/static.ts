import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthService } from "../service/auth.service.js";
import fs from "fs";
import path from "path";

const authService = new AuthService();

export const staticRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const publicDir = path.join(process.cwd(), "public");

  fastify.get("/", async (request, reply) => {
    const isAuthenticated = authService.isAuthenticated(request.session as Record<string, unknown> | undefined);
    if (isAuthenticated) {
      const indexPath = path.join(publicDir, "index.html");
      if (fs.existsSync(indexPath)) {
        return reply.sendFile("index.html");
      }
    }
    return reply.redirect("/login");
  });

  fastify.get("/components/*", async (request, reply) => {
    const filePath = path.join(publicDir, "components", (request.params as { "*": string })["*"]);
    if (fs.existsSync(filePath)) {
      return reply.sendFile(filePath);
    }
    return reply.status(404).send("Not found");
  });

  fastify.get("/audios/*", async (request, reply) => {
    const filePath = path.join(publicDir, "audios", (request.params as { "*": string })["*"]);
    if (fs.existsSync(filePath)) {
      return reply.sendFile(filePath);
    }
    return reply.status(404).send("Not found");
  });

  fastify.get("/audio/*", async (request, reply) => {
    const filePath = path.join(publicDir, "audio", (request.params as { "*": string })["*"]);
    if (fs.existsSync(filePath)) {
      return reply.sendFile(filePath);
    }
    return reply.status(404).send("Not found");
  });
};

export default staticRoutes;