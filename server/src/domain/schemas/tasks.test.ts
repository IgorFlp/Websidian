import { describe, it } from "node:test";
import assert from "node:assert";
import {
  TaskSchema,
  TaskToggleRequestSchema,
  TaskToggleResponseSchema,
  ScanTasksQuerySchema,
  type Task,
  type TaskToggleRequest,
  type TaskToggleResponse,
  type ScanTasksQuery,
} from "./tasks.js";

describe("Tasks Schemas", () => {
  describe("TaskSchema", () => {
    it("should parse valid task", () => {
      const input = {
        id: "task-1",
        content: "Do something",
        completed: false,
        line: 10,
        file: "notes.md",
        section: "## Tasks",
      };
      const result = TaskSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing required fields", () => {
      assert.throws(() => TaskSchema.parse({ content: "test" }));
    });

    it("should have describe metadata", () => {
      assert.ok(TaskSchema.description);
    });
  });

  describe("TaskToggleRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { file: "notes.md", line: 10, completed: true };
      const result = TaskToggleRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing fields", () => {
      assert.throws(() => TaskToggleRequestSchema.parse({ file: "notes.md" }));
    });

    it("should have describe metadata", () => {
      assert.ok(TaskToggleRequestSchema.description);
    });
  });

  describe("TaskToggleResponseSchema", () => {
    it("should parse success response", () => {
      const input = { ok: true, task: { id: "1", content: "test", completed: true, line: 1, file: "f.md" } };
      const result = TaskToggleResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse failure response", () => {
      const input = { ok: false };
      const result = TaskToggleResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(TaskToggleResponseSchema.description);
    });
  });

  describe("ScanTasksQuerySchema", () => {
    it("should parse valid query with defaults", () => {
      const result = ScanTasksQuerySchema.parse({});
      assert.strictEqual(result.path, "");
    });

    it("should parse valid query with path", () => {
      const result = ScanTasksQuerySchema.parse({ path: "subdir", vault: "v1" });
      assert.strictEqual(result.path, "subdir");
      assert.strictEqual(result.vault, "v1");
    });

    it("should have describe metadata", () => {
      assert.ok(ScanTasksQuerySchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const task: Task = { id: "1", content: "c", completed: false, line: 1, file: "f.md" };
      const request: TaskToggleRequest = { file: "f.md", line: 1, completed: true };
      const response: TaskToggleResponse = { ok: true };
      const query: ScanTasksQuery = { path: "" };
      assert.ok(task);
      assert.ok(request);
      assert.ok(response);
      assert.ok(query);
    });
  });
});