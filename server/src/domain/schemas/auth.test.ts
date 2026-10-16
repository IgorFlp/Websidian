import { describe, it } from "node:test";
import assert from "node:assert";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  AuthSessionSchema,
  type LoginRequest,
  type LoginResponse,
  type AuthSession,
} from "./auth.js";

describe("Auth Schemas", () => {
  describe("LoginRequestSchema", () => {
    it("should parse valid login request", () => {
      const input = { username: "user", password: "pass" };
      const result = LoginRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing username", () => {
      assert.throws(() => LoginRequestSchema.parse({ password: "pass" }), /invalid_type/);
    });

    it("should reject missing password", () => {
      assert.throws(() => LoginRequestSchema.parse({ username: "user" }), /invalid_type/);
    });

    it("should reject empty username", () => {
      assert.throws(() => LoginRequestSchema.parse({ username: "", password: "pass" }), /Username is required/);
    });

    it("should have describe metadata", () => {
      assert.ok(LoginRequestSchema.description);
    });
  });

  describe("LoginResponseSchema", () => {
    it("should parse valid login response", () => {
      const input = { redirect: "http://localhost/" };
      const result = LoginResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject invalid URL", () => {
      assert.throws(() => LoginResponseSchema.parse({ redirect: "not-a-url" }));
    });

    it("should have describe metadata", () => {
      assert.ok(LoginResponseSchema.description);
    });
  });

  describe("AuthSessionSchema", () => {
    it("should parse valid session", () => {
      const input = { auth: true, user: "user" };
      const result = AuthSessionSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse session without user", () => {
      const input = { auth: false };
      const result = AuthSessionSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject invalid auth type", () => {
      assert.throws(() => AuthSessionSchema.parse({ auth: "true" }));
    });

    it("should have describe metadata", () => {
      assert.ok(AuthSessionSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const request: LoginRequest = { username: "u", password: "p" };
      const response: LoginResponse = { redirect: "http://localhost/" };
      const session: AuthSession = { auth: true, user: "u" };
      assert.ok(request);
      assert.ok(response);
      assert.ok(session);
    });
  });
});