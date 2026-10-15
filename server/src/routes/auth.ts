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
    const loginPath = "C:\\\Users\\\Igor\\\Desktop\\\Projetos Pessoais\\\IgorFlpDev-Documentacao\\\systems\\\Websidian\\\public\\\login.html";
    if (fs.existsSync(loginPath)) {
      reply.type("text/html");
      return fs.readFileSync(loginPath, "utf-8");
    }
    return reply.status(404).send({ error: "Login page not found" });
  });
};

export default authRoutes;