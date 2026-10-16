import { describe, it } from "node:test";
import assert from "node:assert";
import {
  PresetSchema,
  PresetsResponseSchema,
  CreatePresetRequestSchema,
  UpdatePresetRequestSchema,
  ReorderPresetsRequestSchema,
  PresetFilesRequestSchema,
  type Preset,
  type PresetsResponse,
  type CreatePresetRequest,
  type UpdatePresetRequest,
  type ReorderPresetsRequest,
  type PresetFilesRequest,
} from "./presets.js";

describe("Presets Schemas", () => {
  describe("PresetSchema", () => {
    it("should parse valid preset", () => {
      const input = {
        id: "preset-1",
        name: "My Preset",
        description: "Description",
        files: ["file1.md", "file2.md"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const result = PresetSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing required fields", () => {
      assert.throws(() => PresetSchema.parse({ name: "test" }));
    });

    it("should have describe metadata", () => {
      assert.ok(PresetSchema.description);
    });
  });

  describe("PresetsResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { presets: [{ id: "1", name: "p1", files: [], createdAt: 1, updatedAt: 1 }] };
      const result = PresetsResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(PresetsResponseSchema.description);
    });
  });

  describe("CreatePresetRequestSchema", () => {
    it("should parse valid request with defaults", () => {
      const result = CreatePresetRequestSchema.parse({ name: "New Preset" });
      assert.strictEqual(result.name, "New Preset");
      assert.deepStrictEqual(result.files, []);
    });

    it("should parse valid request with all fields", () => {
      const input = { name: "New", description: "Desc", files: ["f1.md"] };
      const result = CreatePresetRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing name", () => {
      assert.throws(() => CreatePresetRequestSchema.parse({ description: "Desc" }), /invalid_type/);
    });

    it("should have describe metadata", () => {
      assert.ok(CreatePresetRequestSchema.description);
    });
  });

  describe("UpdatePresetRequestSchema", () => {
    it("should parse valid request with optional fields", () => {
      const input = { name: "Updated", files: ["f1.md"] };
      const result = UpdatePresetRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should accept empty object", () => {
      const result = UpdatePresetRequestSchema.parse({});
      assert.deepStrictEqual(result, {});
    });

    it("should have describe metadata", () => {
      assert.ok(UpdatePresetRequestSchema.description);
    });
  });

  describe("ReorderPresetsRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { presetIds: ["id1", "id2", "id3"] };
      const result = ReorderPresetsRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject empty array", () => {
      assert.throws(() => ReorderPresetsRequestSchema.parse({ presetIds: [] }), /At least one preset ID required/);
    });

    it("should have describe metadata", () => {
      assert.ok(ReorderPresetsRequestSchema.description);
    });
  });

  describe("PresetFilesRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { files: ["f1.md", "f2.md"] };
      const result = PresetFilesRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(PresetFilesRequestSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const preset: Preset = { id: "1", name: "p", files: [], createdAt: 1, updatedAt: 1 };
      const response: PresetsResponse = { presets: [preset] };
      const createReq: CreatePresetRequest = { name: "n", files: [] };
      const updateReq: UpdatePresetRequest = { name: "u" };
      const reorderReq: ReorderPresetsRequest = { presetIds: ["1"] };
      const filesReq: PresetFilesRequest = { files: ["f.md"] };
      assert.ok(preset);
      assert.ok(response);
      assert.ok(createReq);
      assert.ok(updateReq);
      assert.ok(reorderReq);
      assert.ok(filesReq);
    });
  });
});