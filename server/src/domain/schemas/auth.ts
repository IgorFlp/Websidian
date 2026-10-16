import { z } from "zod";

export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username is required").describe("Username"),
  password: z.string().min(1, "Password is required").describe("Password"),
}).describe("Login request payload");

export const LoginResponseSchema = z.object({
  redirect: z.string().url().describe("Redirect URL after successful login"),
}).describe("Login response with redirect");

export const AuthSessionSchema = z.object({
  auth: z.boolean().describe("Whether the session is authenticated"),
  user: z.string().optional().describe("Username if authenticated"),
}).describe("Session data");

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;