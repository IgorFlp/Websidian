import { FastifyInstance } from "fastify";
import authRoutes from "./auth.js";
import filesRoutes from "./files.js";
import tasksRoutes from "./tasks.js";
import presetsRoutes from "./presets.js";
import notesRoutes from "./notes.js";
import chatRoutes from "./chat.js";
import profilesRoutes from "./profiles.js";
import audioRoutes from "./audio.js";
import terminalRoutes from "./terminal.js";
import staticRoutes from "./static.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes);
  await app.register(filesRoutes);
  await app.register(tasksRoutes);
  await app.register(presetsRoutes);
  await app.register(notesRoutes);
  await app.register(chatRoutes);
  await app.register(profilesRoutes);
  await app.register(audioRoutes);
  await app.register(terminalRoutes);
  await app.register(staticRoutes);
}

export default registerRoutes;