import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ProfileSchema,
  ProfilesResponseSchema,
  type Profile,
  type ProfilesResponse,
} from "./profiles.js";

describe("Profiles Schemas", () => {
  describe("ProfileSchema", () => {
    it("should parse valid profile", () => {
      const input = {
        id: "p1",
        name: "Profile 1",
        description: "Description",
        model: "gpt-4",
        systemPrompt: "Be helpful",
        createdAt: 1,
        updatedAt: 2,
      };
      const result = ProfileSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse profile with only required fields", () => {
      const input = { id: "p1", name: "Profile", createdAt: 1, updatedAt: 1 };
      const result = ProfileSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(ProfileSchema.description);
    });
  });

  describe("ProfilesResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { profiles: [{ id: "p1", name: "P1", createdAt: 1, updatedAt: 1 }] };
      const result = ProfilesResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(ProfilesResponseSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const profile: Profile = { id: "p1", name: "P", createdAt: 1, updatedAt: 1 };
      const response: ProfilesResponse = { profiles: [profile] };
      assert.ok(profile);
      assert.ok(response);
    });
  });
});