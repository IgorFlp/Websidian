import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().describe("Profile ID"),
  name: z.string().describe("Profile name"),
  description: z.string().optional().describe("Profile description"),
  model: z.string().optional().describe("Associated model"),
  systemPrompt: z.string().optional().describe("System prompt"),
  createdAt: z.number().describe("Creation timestamp"),
  updatedAt: z.number().describe("Last update timestamp"),
}).describe("Profile configuration");

export const ProfilesResponseSchema = z.object({
  profiles: z.array(ProfileSchema).describe("List of profiles"),
}).describe("Response for listing profiles");

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfilesResponse = z.infer<typeof ProfilesResponseSchema>;