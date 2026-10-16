import { z } from "zod";

export const FileNodeSchema: z.ZodType<any> = z.object({
  name: z.string().describe("File or directory name"),
  path: z.string().describe("Relative path from vault root"),
  type: z.enum(["file", "directory"]).describe("Type of entry"),
  children: z.array(z.lazy(() => FileNodeSchema)).optional().describe("Child entries for directories"),
  size: z.number().optional().describe("File size in bytes"),
  modified: z.number().optional().describe("Last modified timestamp"),
}).describe("File tree node");

export const ApiFilesResponseSchema = z.object({
  files: z.array(FileNodeSchema).describe("File tree entries"),
}).describe("Response for file tree listing");

export const GetFilesQuerySchema = z.object({
  path: z.string().optional().default("").describe("Relative path to list"),
  vault: z.string().optional().describe("Vault name (optional)"),
}).describe("Query parameters for listing files");

export const FileContentQuerySchema = z.object({
  path: z.string().min(1, "Path is required").describe("File path"),
  vault: z.string().optional().describe("Vault name (optional)"),
}).describe("Query parameters for getting file content");

export const FileContentResponseSchema = z.object({
  content: z.string().describe("File content"),
  path: z.string().describe("File path"),
}).describe("Response for file content");

export const DownloadQuerySchema = z.object({
  path: z.string().min(1, "Path is required").describe("File path to download"),
  vault: z.string().optional().describe("Vault name (optional)"),
}).describe("Query parameters for file download");

export type FileNode = z.infer<typeof FileNodeSchema>;
export type ApiFilesResponse = z.infer<typeof ApiFilesResponseSchema>;
export type GetFilesQuery = z.infer<typeof GetFilesQuerySchema>;
export type FileContentQuery = z.infer<typeof FileContentQuerySchema>;
export type FileContentResponse = z.infer<typeof FileContentResponseSchema>;
export type DownloadQuery = z.infer<typeof DownloadQuerySchema>;