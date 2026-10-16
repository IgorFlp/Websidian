import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().describe("Unique task identifier"),
  content: z.string().describe("Task content/text"),
  completed: z.boolean().describe("Whether the task is completed"),
  line: z.number().int().positive().describe("Line number in source file"),
  file: z.string().describe("Source file path"),
  section: z.string().optional().describe("Section/header where task was found"),
}).describe("Task item");

export const TaskToggleRequestSchema = z.object({
  file: z.string().min(1, "File path is required").describe("Source file path"),
  line: z.number().int().positive().describe("Line number of the task"),
  completed: z.boolean().describe("New completion status"),
}).describe("Request to toggle task completion");

export const TaskToggleResponseSchema = z.object({
  ok: z.boolean().describe("Whether the operation succeeded"),
  task: TaskSchema.optional().describe("Updated task if successful"),
}).describe("Response for task toggle");

export const ScanTasksQuerySchema = z.object({
  path: z.string().optional().default("").describe("Directory path to scan"),
  vault: z.string().optional().describe("Vault name (optional)"),
}).describe("Query parameters for scanning tasks");

export type Task = z.infer<typeof TaskSchema>;
export type TaskToggleRequest = z.infer<typeof TaskToggleRequestSchema>;
export type TaskToggleResponse = z.infer<typeof TaskToggleResponseSchema>;
export type ScanTasksQuery = z.infer<typeof ScanTasksQuerySchema>;