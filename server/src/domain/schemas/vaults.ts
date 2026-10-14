import { z } from "zod";

export const VaultSchema = z.object({
  name: z.string().describe("Vault name"),
  path: z.string().describe("Vault filesystem path"),
}).describe("Vault information");

export const ListVaultsResponseSchema = z.object({
  vaults: z.array(VaultSchema).describe("List of available vaults"),
}).describe("Response for listing vaults");

export type Vault = z.infer<typeof VaultSchema>;
export type ListVaultsResponse = z.infer<typeof ListVaultsResponseSchema>;