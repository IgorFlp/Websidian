import { describe, it } from "node:test";
import assert from "node:assert";
import {
  TerminalInputRequestSchema,
  TerminalInputResponseSchema,
  TerminalPollQuerySchema,
  TerminalPollResponseSchema,
  type TerminalInputRequest,
  type TerminalInputResponse,
  type TerminalPollQuery,
  type TerminalPollResponse,
} from "./terminal.js";

describe("Terminal Schemas", () => {
  describe("TerminalInputRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { input: "ls\n", sessionId: "term-1" };
      const result = TerminalInputRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse request without sessionId", () => {
      const result = TerminalInputRequestSchema.parse({ input: "ls\n" });
      assert.strictEqual(result.input, "ls\n");
      assert.strictEqual(result.sessionId, undefined);
    });

    it("should reject missing input", () => {
      assert.throws(() => TerminalInputRequestSchema.parse({ sessionId: "s" }));
    });

    it("should have describe metadata", () => {
      assert.ok(TerminalInputRequestSchema.description);
    });
  });

  describe("TerminalInputResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { ok: true, sessionId: "term-1" };
      const result = TerminalInputResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse minimal response", () => {
      const input = { ok: false };
      const result = TerminalInputResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(TerminalInputResponseSchema.description);
    });
  });

  describe("TerminalPollQuerySchema", () => {
    it("should parse with defaults", () => {
      const result = TerminalPollQuerySchema.parse({ sessionId: "term-1" });
      assert.strictEqual(result.sessionId, "term-1");
      assert.strictEqual(result.since, 0);
    });

    it("should parse with custom since", () => {
      const result = TerminalPollQuerySchema.parse({ sessionId: "term-1", since: "1000" });
      assert.strictEqual(result.since, 1000);
    });

    it("should reject missing sessionId", () => {
      assert.throws(() => TerminalPollQuerySchema.parse({}), /invalid_type/);
    });

    it("should reject negative since", () => {
      assert.throws(() => TerminalPollQuerySchema.parse({ sessionId: "s", since: "-1" }));
    });

    it("should have describe metadata", () => {
      assert.ok(TerminalPollQuerySchema.description);
    });
  });

  describe("TerminalPollResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { output: "user@host:~$ ls\nfile1.txt\n", exited: false };
      const result = TerminalPollResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse exited response", () => {
      const input = { output: "exit\n", exited: true, exitCode: 0 };
      const result = TerminalPollResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(TerminalPollResponseSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const inputReq: TerminalInputRequest = { input: "i" };
      const inputRes: TerminalInputResponse = { ok: true };
      const pollQuery: TerminalPollQuery = { sessionId: "s", since: 0 };
      const pollRes: TerminalPollResponse = { output: "o", exited: false };
      assert.ok(inputReq);
      assert.ok(inputRes);
      assert.ok(pollQuery);
      assert.ok(pollRes);
    });
  });
});