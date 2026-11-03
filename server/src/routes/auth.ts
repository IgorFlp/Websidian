import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthService } from "../service/auth.service.js";
import { config } from "../config/index.js";

const authService = new AuthService();

const loginBodySchema = z.object({
  username: z.string().min(1).describe("Username (e.g., admin)"),
  password: z.string().min(1).describe("Password (e.g., password123)"),
}).or(z.object({
  user: z.string().min(1).describe("Username (e.g., admin)"),
  pass: z.string().min(1).describe("Password (e.g., password123)"),
}));

const vaultsResponseSchema = z.array(z.object({
  id: z.number().describe("Vault ID (e.g., 0)"),
  name: z.string().describe("Vault name (e.g., Main Vault)"),
  fullPath: z.string().describe("Full vault path (e.g., /vault/main)"),
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
    const body = request.body as { username?: string; password?: string; user?: string; pass?: string };
    const username = body.username || body.user;
    const password = body.password || body.pass;
    
    if (!username || !password) {
      return reply.redirect("/login?error=1");
    }
    
    if (authService.validateCredentials(username, password)) {
      (request.session as unknown as Record<string, unknown>)["auth"] = true;
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
    return reply.sendFile("login.html");
  });
};

export default authRoutes;
