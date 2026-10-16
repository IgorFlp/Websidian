import { z } from "zod";

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message is required").describe("User message"),
  sessionId: z.string().optional().describe("Existing session ID (optional)"),
  model: z.string().optional().describe("Model to use (optional)"),
  systemPrompt: z.string().optional().describe("System prompt (optional)"),
}).describe("Chat request payload");

export const ChatResponseSchema = z.object({
  sessionId: z.string().describe("Session ID"),
  messageId: z.string().describe("Message ID"),
  response: z.string().describe("Assistant response"),
  audioUrl: z.string().optional().describe("TTS audio URL if generated"),
}).describe("Chat response");

export const MessagesParamsSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required").describe("Session ID"),
}).describe("Route parameters for getting messages");

export const SessionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50).describe("Maximum number of sessions"),
  offset: z.coerce.number().int().nonnegative().optional().default(0).describe("Offset for pagination"),
}).describe("Query parameters for listing sessions");

export const SessionSchema = z.object({
  id: z.string().describe("Session ID"),
  title: z.string().describe("Session title"),
  createdAt: z.number().describe("Creation timestamp"),
  updatedAt: z.number().describe("Last update timestamp"),
  messageCount: z.number().int().nonnegative().describe("Number of messages in session"),
}).describe("Session summary");

export const CreateSessionRequestSchema = z.object({
  title: z.string().min(1, "Title is required").describe("Session title"),
  model: z.string().optional().describe("Model to use"),
  systemPrompt: z.string().optional().describe("System prompt"),
}).describe("Request to create a new session");

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type MessagesParams = z.infer<typeof MessagesParamsSchema>;
export type SessionsQuery = z.infer<typeof SessionsQuerySchema>;
export type Session = z.infer<typeof SessionSchema>;
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;