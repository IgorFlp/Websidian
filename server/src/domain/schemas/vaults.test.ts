import { describe, it } from "node:test";
import assert from "node:assert";
import {
  VaultSchema,
  ListVaultsResponseSchema,
  type Vault,
  type ListVaultsResponse,
} from "./vaults.js";

describe("Vaults Schemas", () => {
  describe("VaultSchema", () => {
    it("should parse valid vault", () => {
      const input = { name: "vault1", path: "/path/to/vault" };
      const result = VaultSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing name", () => {
      assert.throws(() => VaultSchema.parse({ path: "/path" }));
    });

    it("should reject missing path", () => {
      assert.throws(() => VaultSchema.parse({ name: "vault" }));
    });

    it("should have describe metadata", () => {
      assert.ok(VaultSchema.description);
    });
  });

  describe("ListVaultsResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { vaults: [{ name: "v1", path: "/p1" }, { name: "v2", path: "/p2" }] };
      const result = ListVaultsResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should accept empty array", () => {
      const input = { vaults: [] };
      const result = ListVaultsResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(ListVaultsResponseSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const vault: Vault = { name: "v", path: "/p" };
      const response: ListVaultsResponse = { vaults: [vault] };
      assert.ok(vault);
      assert.ok(response);
    });
  });
});