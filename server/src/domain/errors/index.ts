export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class InternalError extends DomainError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super(message, 500, "INTERNAL_ERROR", details);
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(message: string = "Service unavailable", details?: unknown) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
  }
}

export class BadGatewayError extends DomainError {
  constructor(message: string = "Bad gateway", details?: unknown) {
    super(message, 502, "BAD_GATEWAY", details);
  }
}

export class GatewayTimeoutError extends DomainError {
  constructor(message: string = "Gateway timeout", details?: unknown) {
    super(message, 504, "GATEWAY_TIMEOUT", details);
  }
}

export function handleError(
  err: unknown,
  reply: {
    status(code: number): { send(value: unknown): void; json(value: unknown): void };
    code?: string;
  }
): void {
  if (err instanceof DomainError) {
    reply.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof Error) {
    reply.status(500).json({
      error: "INTERNAL_ERROR",
      message: err.message,
    });
    return;
  }

  reply.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Unknown error",
  });
}