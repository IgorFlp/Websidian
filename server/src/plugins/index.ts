import { FastifyInstance } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyFormbody from "@fastify/formbody";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import path from "path";

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifyCookie, {
    secret: process.env["SESSION_SECRET"] || "default-secret-change-in-production",
    hook: "onRequest",
  });

  await app.register(fastifySession, {
    secret: process.env["SESSION_SECRET"] || "default-secret-change-in-production",
    cookie: { secure: false },
    saveUninitialized: false,
  });

  await app.register(fastifyFormbody);

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Websidian API",
        description: "API for Websidian",
        version: "1.0.0",
      },
      servers: [{ url: "http://localhost:9091" }],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/api-docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
    initOAuth: {},
    specPath: "/api-docs/json",
  });
}

export default registerPlugins;