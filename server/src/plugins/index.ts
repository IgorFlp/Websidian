import { FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from "fastify-type-provider-zod";
import path from "path";

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifyCookie, {
    secret: process.env["SESSION_SECRET"] || "default-secret-change-in-production",
    hook: "onRequest",
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "public"),
    prefix: "/",
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Websidian API",
        description: "API for Websidian - Obsidian-like web interface with AI chat",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:9091", description: "Development server" },
      ],
      components: {
        securitySchemes: {
          sessionAuth: {
            type: "apiKey",
            in: "cookie",
            name: "connect.sid",
            description: "Session cookie for authentication",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
          },
          LoginRequest: {
            type: "object",
            required: ["username", "password"],
            properties: {
              username: { type: "string" },
              password: { type: "string" },
            },
          },
          Session: {
            type: "object",
            properties: {
              auth: { type: "boolean" },
              user: { type: "string" },
            },
          },
        },
      },
      security: [{ sessionAuth: [] }],
    },
    transform: jsonSchemaTransform,
    routePrefix: "/swagger",
  });

  // Manually expose /swagger.json endpoint with basic spec (avoids crash from jsonSchemaTransform)
  app.get("/swagger.json", async () => {
    return {
      openapi: "3.0.3",
      info: { title: "Websidian API", description: "API for Websidian - Obsidian-like web interface with AI chat", version: "1.0.0" },
      servers: [{ url: "http://localhost:9091", description: "Development server" }],
      paths: {},
      components: {
        securitySchemes: { sessionAuth: { type: "apiKey", in: "cookie", name: "connect.sid" } },
        schemas: {},
      },
    };
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/api-docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
    initOAuth: {},
    transformSpecs: (specs) => specs,
    specPath: "/swagger/json",
  });
}

export default registerPlugins;