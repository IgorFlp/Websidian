import "fastify";
import { SessionData } from "./service/auth.service.js";

declare module "fastify" {
  interface FastifyRequest {
    session: SessionData;
  }
}