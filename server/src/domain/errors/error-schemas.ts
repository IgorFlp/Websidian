import { z } from "zod";

export const ErrorResponseSchema = z.object({
  error: z.string().describe("Error code"),
  message: z.string().describe("Human-readable error message"),
  details: z.unknown().optional().describe("Additional error details"),
});

export const NotFoundErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("NOT_FOUND"),
});

export const ValidationErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("VALIDATION_ERROR"),
});

export const UnauthorizedErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("UNAUTHORIZED"),
});

export const ForbiddenErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("FORBIDDEN"),
});

export const InternalErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("INTERNAL_ERROR"),
});

export const ServiceUnavailableErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("SERVICE_UNAVAILABLE"),
});

export const BadGatewayErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("BAD_GATEWAY"),
});

export const GatewayTimeoutErrorSchema = ErrorResponseSchema.extend({
  error: z.literal("GATEWAY_TIMEOUT"),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type NotFoundErrorResponse = z.infer<typeof NotFoundErrorSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorSchema>;
export type UnauthorizedErrorResponse = z.infer<typeof UnauthorizedErrorSchema>;
export type ForbiddenErrorResponse = z.infer<typeof ForbiddenErrorSchema>;
export type InternalErrorResponse = z.infer<typeof InternalErrorSchema>;
export type ServiceUnavailableErrorResponse = z.infer<typeof ServiceUnavailableErrorSchema>;
export type BadGatewayErrorResponse = z.infer<typeof BadGatewayErrorSchema>;
export type GatewayTimeoutErrorResponse = z.infer<typeof GatewayTimeoutErrorSchema>;