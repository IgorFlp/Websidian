import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  ServiceUnavailableError,
  BadGatewayError,
  GatewayTimeoutError,
  handleError,
} from "./index.js";

describe("Domain Errors", () => {
  describe("DomainError", () => {
    it("should create error with correct properties", () => {
      const error = new DomainError("Test error", 400, "TEST_CODE", { detail: "value" });
      assert.strictEqual(error.message, "Test error");
      assert.strictEqual(error.statusCode, 400);
      assert.strictEqual(error.code, "TEST_CODE");
      assert.deepStrictEqual(error.details, { detail: "value" });
      assert.strictEqual(error.name, "DomainError");
    });
  });

  describe("NotFoundError", () => {
    it("should create error with 404 status and NOT_FOUND code", () => {
      const error = new NotFoundError("Resource not found");
      assert.strictEqual(error.message, "Resource not found");
      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.code, "NOT_FOUND");
      assert.strictEqual(error.name, "NotFoundError");
    });

    it("should accept optional details", () => {
      const error = new NotFoundError("Resource not found", { id: "123" });
      assert.deepStrictEqual(error.details, { id: "123" });
    });
  });

  describe("ValidationError", () => {
    it("should create error with 400 status and VALIDATION_ERROR code", () => {
      const error = new ValidationError("Invalid input");
      assert.strictEqual(error.message, "Invalid input");
      assert.strictEqual(error.statusCode, 400);
      assert.strictEqual(error.code, "VALIDATION_ERROR");
      assert.strictEqual(error.name, "ValidationError");
    });
  });

  describe("UnauthorizedError", () => {
    it("should create error with 401 status and UNAUTHORIZED code", () => {
      const error = new UnauthorizedError();
      assert.strictEqual(error.message, "Unauthorized");
      assert.strictEqual(error.statusCode, 401);
      assert.strictEqual(error.code, "UNAUTHORIZED");
      assert.strictEqual(error.name, "UnauthorizedError");
    });

    it("should accept custom message", () => {
      const error = new UnauthorizedError("Custom auth error");
      assert.strictEqual(error.message, "Custom auth error");
    });
  });

  describe("ForbiddenError", () => {
    it("should create error with 403 status and FORBIDDEN code", () => {
      const error = new ForbiddenError();
      assert.strictEqual(error.message, "Forbidden");
      assert.strictEqual(error.statusCode, 403);
      assert.strictEqual(error.code, "FORBIDDEN");
      assert.strictEqual(error.name, "ForbiddenError");
    });
  });

  describe("InternalError", () => {
    it("should create error with 500 status and INTERNAL_ERROR code", () => {
      const error = new InternalError();
      assert.strictEqual(error.message, "Internal server error");
      assert.strictEqual(error.statusCode, 500);
      assert.strictEqual(error.code, "INTERNAL_ERROR");
      assert.strictEqual(error.name, "InternalError");
    });
  });

  describe("ServiceUnavailableError", () => {
    it("should create error with 503 status and SERVICE_UNAVAILABLE code", () => {
      const error = new ServiceUnavailableError();
      assert.strictEqual(error.message, "Service unavailable");
      assert.strictEqual(error.statusCode, 503);
      assert.strictEqual(error.code, "SERVICE_UNAVAILABLE");
      assert.strictEqual(error.name, "ServiceUnavailableError");
    });
  });

  describe("BadGatewayError", () => {
    it("should create error with 502 status and BAD_GATEWAY code", () => {
      const error = new BadGatewayError();
      assert.strictEqual(error.message, "Bad gateway");
      assert.strictEqual(error.statusCode, 502);
      assert.strictEqual(error.code, "BAD_GATEWAY");
      assert.strictEqual(error.name, "BadGatewayError");
    });
  });

  describe("GatewayTimeoutError", () => {
    it("should create error with 504 status and GATEWAY_TIMEOUT code", () => {
      const error = new GatewayTimeoutError();
      assert.strictEqual(error.message, "Gateway timeout");
      assert.strictEqual(error.statusCode, 504);
      assert.strictEqual(error.code, "GATEWAY_TIMEOUT");
      assert.strictEqual(error.name, "GatewayTimeoutError");
    });
  });
});

describe("handleError", () => {
  const createMockReply = () => {
    const calls: { method: string; args: unknown[] }[] = [];
    const mockReply = {
      status: (code: number) => {
        calls.push({ method: "status", args: [code] });
        return mockReply;
      },
      json: (data: unknown) => {
        calls.push({ method: "json", args: [data] });
      },
      send: (data: unknown) => {
        calls.push({ method: "send", args: [data] });
      },
      _getCalls: () => calls,
    };
    return mockReply;
  };

  const getCall = (calls: { method: string; args: unknown[] }[], index: number) => {
    const call = calls[index];
    if (!call) throw new Error(`Call at index ${index} not found`);
    return call;
  };

  it("should handle DomainError correctly", () => {
    const reply = createMockReply();
    const error = new ValidationError("Invalid input", { field: "email" });
    handleError(error, reply as any);
    const calls = reply._getCalls();
    assert.strictEqual(getCall(calls, 0).method, "status");
    assert.strictEqual(getCall(calls, 0).args[0], 400);
    assert.strictEqual(getCall(calls, 1).method, "json");
    assert.deepStrictEqual(getCall(calls, 1).args[0], {
      error: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { field: "email" },
    });
  });

  it("should handle NotFoundError correctly", () => {
    const reply = createMockReply();
    const error = new NotFoundError("Not found");
    handleError(error, reply as any);
    const calls = reply._getCalls();
    assert.strictEqual(getCall(calls, 0).method, "status");
    assert.strictEqual(getCall(calls, 0).args[0], 404);
    assert.strictEqual(getCall(calls, 1).method, "json");
    assert.deepStrictEqual(getCall(calls, 1).args[0], {
      error: "NOT_FOUND",
      message: "Not found",
      details: undefined,
    });
  });

  it("should handle generic Error", () => {
    const reply = createMockReply();
    const error = new Error("Generic error");
    handleError(error, reply as any);
    const calls = reply._getCalls();
    assert.strictEqual(getCall(calls, 0).method, "status");
    assert.strictEqual(getCall(calls, 0).args[0], 500);
    assert.strictEqual(getCall(calls, 1).method, "json");
    assert.deepStrictEqual(getCall(calls, 1).args[0], {
      error: "INTERNAL_ERROR",
      message: "Generic error",
    });
  });

  it("should handle unknown error", () => {
    const reply = createMockReply();
    handleError("string error", reply as any);
    const calls = reply._getCalls();
    assert.strictEqual(getCall(calls, 0).method, "status");
    assert.strictEqual(getCall(calls, 0).args[0], 500);
    assert.strictEqual(getCall(calls, 1).method, "json");
    assert.deepStrictEqual(getCall(calls, 1).args[0], {
      error: "INTERNAL_ERROR",
      message: "Unknown error",
    });
  });

  it("should handle null error", () => {
    const reply = createMockReply();
    handleError(null, reply as any);
    const calls = reply._getCalls();
    assert.strictEqual(getCall(calls, 0).method, "status");
    assert.strictEqual(getCall(calls, 0).args[0], 500);
    assert.strictEqual(getCall(calls, 1).method, "json");
    assert.deepStrictEqual(getCall(calls, 1).args[0], {
      error: "INTERNAL_ERROR",
      message: "Unknown error",
    });
  });

  it("should handle undefined error", () => {
    const reply = createMockReply();
    handleError(undefined, reply as any);
    const calls = reply._getCalls();
    assert.strictEqual(getCall(calls, 0).method, "status");
    assert.strictEqual(getCall(calls, 0).args[0], 500);
    assert.strictEqual(getCall(calls, 1).method, "json");
    assert.deepStrictEqual(getCall(calls, 1).args[0], {
      error: "INTERNAL_ERROR",
      message: "Unknown error",
    });
  });

  it("should handle all DomainError subclasses", () => {
    const errors = [
      new NotFoundError("Not found"),
      new ValidationError("Invalid"),
      new UnauthorizedError(),
      new ForbiddenError(),
      new InternalError(),
      new ServiceUnavailableError(),
      new BadGatewayError(),
      new GatewayTimeoutError(),
    ];

    for (const error of errors) {
      const reply = createMockReply();
      handleError(error, reply as any);
      const calls = reply._getCalls();
      assert.strictEqual(getCall(calls, 0).method, "status");
      assert.strictEqual(getCall(calls, 0).args[0], error.statusCode);
      assert.strictEqual(getCall(calls, 1).method, "json");
      assert.deepStrictEqual(getCall(calls, 1).args[0], {
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }
  });
});