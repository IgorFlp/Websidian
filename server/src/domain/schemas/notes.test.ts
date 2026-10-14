import { describe, it } from "node:test";
import assert from "node:assert";
import {
  NewNoteRequestSchema,
  NewNoteResponseSchema,
  type NewNoteRequest,
  type NewNoteResponse,
} from "./notes.js";

describe("Notes Schemas", () => {
  describe("NewNoteRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { content: "Note content", date: "2024-01-15", vault: "v1" };
      const result = NewNoteRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse request with only content", () => {
      const result = NewNoteRequestSchema.parse({ content: "Note content" });
      assert.strictEqual(result.content, "Note content");
      assert.strictEqual(result.date, undefined);
    });

    it("should reject missing content", () => {
      assert.throws(() => NewNoteRequestSchema.parse({ date: "2024-01-15" }), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(NewNoteRequestSchema.description);
    });
  });

  describe("NewNoteResponseSchema", () => {
    it("should parse success response", () => {
      const input = { ok: true, path: "notes/2024-01-15.md", message: "Created" };
      const result = NewNoteResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse minimal response", () => {
      const input = { ok: false };
      const result = NewNoteResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(NewNoteResponseSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const request: NewNoteRequest = { content: "c" };
      const response: NewNoteResponse = { ok: true };
      assert.ok(request);
      assert.ok(response);
    });
  });
});