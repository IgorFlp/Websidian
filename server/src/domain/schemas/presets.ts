import { z } from "zod";

export const PresetSchema = z.object({
  id: z.string().describe("Unique preset identifier"),
  name: z.string().min(1, "Name is required").describe("Preset name"),
  description: z.string().optional().describe("Preset description"),
  files: z.array(z.string()).describe("List of file paths in preset"),
  createdAt: z.number().describe("Creation timestamp"),
  updatedAt: z.number().describe("Last update timestamp"),
}).describe("Preset configuration");

export const PresetsResponseSchema = z.object({
  presets: z.array(PresetSchema).describe("List of presets"),
}).describe("Response for listing presets");

export const CreatePresetRequestSchema = z.object({
  name: z.string().min(1, "Name is required").describe("Preset name"),
  description: z.string().optional().describe("Preset description"),
  files: z.array(z.string()).default([]).describe("List of file paths"),
}).describe("Request to create a new preset");

export const UpdatePresetRequestSchema = z.object({
  name: z.string().min(1, "Name is required").optional().describe("Preset name"),
  description: z.string().optional().describe("Preset description"),
  files: z.array(z.string()).optional().describe("List of file paths"),
}).describe("Request to update a preset");

export const ReorderPresetsRequestSchema = z.object({
  presetIds: z.array(z.string()).min(1, "At least one preset ID required").describe("Ordered list of preset IDs"),
}).describe("Request to reorder presets");

export const PresetFilesRequestSchema = z.object({
  files: z.array(z.string()).describe("List of file paths to associate with preset"),
}).describe("Request to update preset files");

export type Preset = z.infer<typeof PresetSchema>;
export type PresetsResponse = z.infer<typeof PresetsResponseSchema>;
export type CreatePresetRequest = z.infer<typeof CreatePresetRequestSchema>;
export type UpdatePresetRequest = z.infer<typeof UpdatePresetRequestSchema>;
export type ReorderPresetsRequest = z.infer<typeof ReorderPresetsRequestSchema>;
export type PresetFilesRequest = z.infer<typeof PresetFilesRequestSchema>;