import { z } from "zod";

export const TerminalInputRequestSchema = z.object({
  input: z.string().describe("Terminal input data"),
  sessionId: z.string().optional().describe("Terminal session ID (optional)"),
}).describe("Terminal input request");

export const TerminalInputResponseSchema = z.object({
  ok: z.boolean().describe("Whether the input was accepted"),
  sessionId: z.string().optional().describe("Terminal session ID"),
}).describe("Terminal input response");

export const TerminalPollQuerySchema = z.object({
  sessionId: z.string().min(1, "Session ID is required").describe("Terminal session ID"),
  since: z.coerce.number().int().nonnegative().optional().default(0).describe("Timestamp to poll from"),
}).describe("Query parameters for polling terminal output");

export const TerminalPollResponseSchema = z.object({
  output: z.string().describe("Terminal output since last poll"),
  exited: z.boolean().describe("Whether the terminal session has exited"),
  exitCode: z.number().int().optional().describe("Exit code if session exited"),
}).describe("Terminal poll response");

export type TerminalInputRequest = z.infer<typeof TerminalInputRequestSchema>;
export type TerminalInputResponse = z.infer<typeof TerminalInputResponseSchema>;
export type TerminalPollQuery = z.infer<typeof TerminalPollQuerySchema>;
export type TerminalPollResponse = z.infer<typeof TerminalPollResponseSchema>;