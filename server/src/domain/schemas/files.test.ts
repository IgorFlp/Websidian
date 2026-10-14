import { describe, it } from "node:test";
import assert from "node:assert";
import {
  FileNodeSchema,
  ApiFilesResponseSchema,
  GetFilesQuerySchema,
  FileContentQuerySchema,
  FileContentResponseSchema,
  DownloadQuerySchema,
  type FileNode,
  type ApiFilesResponse,
  type GetFilesQuery,
  type FileContentQuery,
  type FileContentResponse,
  type DownloadQuery,
} from "./files.js";

describe("Files Schemas", () => {
  describe("FileNodeSchema", () => {
    it("should parse valid file node", () => {
      const input = {
        name: "file.txt",
        path: "file.txt",
        type: "file" as const,
        size: 100,
        modified: Date.now(),
      };
      const result = FileNodeSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse valid directory node with children", () => {
      const input = {
        name: "dir",
        path: "dir",
        type: "directory" as const,
        children: [{ name: "child.txt", path: "dir/child.txt", type: "file" as const }],
      };
      const result = FileNodeSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject invalid type", () => {
      assert.throws(() => FileNodeSchema.parse({ name: "f", path: "f", type: "invalid" }));
    });

    it("should have describe metadata", () => {
      assert.ok(FileNodeSchema.description);
    });
  });

  describe("ApiFilesResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { files: [{ name: "f", path: "f", type: "file" as const }] };
      const result = ApiFilesResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(ApiFilesResponseSchema.description);
    });
  });

  describe("GetFilesQuerySchema", () => {
    it("should parse valid query with defaults", () => {
      const result = GetFilesQuerySchema.parse({});
      assert.strictEqual(result.path, "");
    });

    it("should parse valid query with path", () => {
      const result = GetFilesQuerySchema.parse({ path: "subdir", vault: "v1" });
      assert.strictEqual(result.path, "subdir");
      assert.strictEqual(result.vault, "v1");
    });

    it("should have describe metadata", () => {
      assert.ok(GetFilesQuerySchema.description);
    });
  });

  describe("FileContentQuerySchema", () => {
    it("should parse valid query", () => {
      const result = FileContentQuerySchema.parse({ path: "file.txt", vault: "v1" });
      assert.strictEqual(result.path, "file.txt");
      assert.strictEqual(result.vault, "v1");
    });

    it("should reject missing path", () => {
      assert.throws(() => FileContentQuerySchema.parse({ vault: "v1" }), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(FileContentQuerySchema.description);
    });
  });

  describe("FileContentResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { content: "file content", path: "file.txt" };
      const result = FileContentResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(FileContentResponseSchema.description);
    });
  });

  describe("DownloadQuerySchema", () => {
    it("should parse valid query", () => {
      const result = DownloadQuerySchema.parse({ path: "file.txt", vault: "v1" });
      assert.strictEqual(result.path, "file.txt");
    });

    it("should reject missing path", () => {
      assert.throws(() => DownloadQuerySchema.parse({ vault: "v1" }), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(DownloadQuerySchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const fileNode: FileNode = { name: "f", path: "f", type: "file" };
      const response: ApiFilesResponse = { files: [fileNode] };
      const query: GetFilesQuery = { path: "" };
      const contentQuery: FileContentQuery = { path: "f.txt" };
      const contentResponse: FileContentResponse = { content: "c", path: "f.txt" };
      const downloadQuery: DownloadQuery = { path: "f.txt" };
      assert.ok(fileNode);
      assert.ok(response);
      assert.ok(query);
      assert.ok(contentQuery);
      assert.ok(contentResponse);
      assert.ok(downloadQuery);
    });
  });
});