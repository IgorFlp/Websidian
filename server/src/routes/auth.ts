import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthService } from "../service/auth.service.js";
import { config } from "../config/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const authService = new AuthService();

const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const vaultsResponseSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  fullPath: z.string(),
}));

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post("/login", {
    schema: {
      body: loginBodySchema,
      response: {
        302: z.object({}),
        400: z.object({ error: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };
    if (authService.validateCredentials(username, password)) {
      (request.session as Record<string, unknown>)["auth"] = true;
      return reply.redirect("/");
    }
    return reply.redirect("/login?error=1");
  });

  fastify.get("/logout", async (request, reply) => {
    request.session.destroy(() => {
      reply.clearCookie("connect.sid");
      reply.redirect("/login");
    });
  });

  fastify.get("/vaults", {
    schema: {
      response: {
        200: vaultsResponseSchema,
      },
    },
  }, async (_request, reply) => {
    const vaultPaths = config.vaultPath.split(",");
    const vaults = vaultPaths.map((v, index) => ({
      id: index,
      name: v.split("\\").pop() || v.split("/").pop() || `vault-${index}`,
      fullPath: v,
    }));
    return vaults;
  });

  fastify.get("/login", async (_request, reply) => {
    reply.type("text/html");
    return `<html><head><title>Login</title></head><body><h1>Login</h1><form method="POST" action="/login"><input name="username" placeholder="Username"/><input name="password" type="password" placeholder="Password"/><button type="submit">Login</button></form></body></html>`;
  });
};

export default authRoutes;