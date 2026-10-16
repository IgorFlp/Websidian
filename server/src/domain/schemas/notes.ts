import { z } from "zod";

export const NewNoteRequestSchema = z.object({
  content: z.string().min(1, "Content is required").describe("Note content"),
  date: z.string().optional().describe("Date in YYYY-MM-DD format (defaults to today)"),
  vault: z.string().optional().describe("Vault name (optional)"),
}).describe("Request to create a new daily note");

export const NewNoteResponseSchema = z.object({
  ok: z.boolean().describe("Whether the operation succeeded"),
  path: z.string().optional().describe("Created note file path"),
  message: z.string().optional().describe("Success message"),
}).describe("Response for creating a new note");

export type NewNoteRequest = z.infer<typeof NewNoteRequestSchema>;
export type NewNoteResponse = z.infer<typeof NewNoteResponseSchema>;