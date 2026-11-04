import { FastifyInstance } from "fastify";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { registerPlugins } from "./plugins/index.js";
import { registerRoutes } from "./routes/index.js";
import { config } from "./config/index.js";
import { cleanupAudioDirs } from "./service/audio.service.js";

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: (process.env["LOG_LEVEL"] || "info"),
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  await registerPlugins(app);
  await registerRoutes(app);

  app.get("/swagger.json", async () => app.swagger());

  // Register static plugin after routes to avoid intercepting /login and other routes
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "..", "public"),
    prefix: "/",
  });

  app.addHook("onReady", async () => {
    cleanupAudioDirs();
    console.log("Audio directories cleaned up on startup");
  });

  return app;
}

async function start(): Promise<void> {
  try {
    const app = await buildApp();
    const address = await app.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`Server running on ${address}`);
    
    // Keep process alive
    await new Promise(() => {});
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

import { fileURLToPath } from "url";

const scriptPath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1];

if (scriptPath === entryPath) {
  await start();
}

export { buildApp, start };