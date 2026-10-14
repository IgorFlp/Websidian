import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ChatRequestSchema,
  ChatResponseSchema,
  MessagesParamsSchema,
  SessionsQuerySchema,
  SessionSchema,
  CreateSessionRequestSchema,
  type ChatRequest,
  type ChatResponse,
  type MessagesParams,
  type SessionsQuery,
  type Session,
  type CreateSessionRequest,
} from "./chat.js";

describe("Chat Schemas", () => {
  describe("ChatRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { message: "Hello", sessionId: "sess-1", model: "gpt-4", systemPrompt: "Be helpful" };
      const result = ChatRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse minimal request", () => {
      const result = ChatRequestSchema.parse({ message: "Hello" });
      assert.strictEqual(result.message, "Hello");
    });

    it("should reject missing message", () => {
      assert.throws(() => ChatRequestSchema.parse({ sessionId: "s1" }), /Required/);
    });

    it("should reject empty message", () => {
      assert.throws(() => ChatRequestSchema.parse({ message: "" }), /Message is required/);
    });

    it("should have describe metadata", () => {
      assert.ok(ChatRequestSchema.description);
    });
  });

  describe("ChatResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { sessionId: "s1", messageId: "m1", response: "Hi there", audioUrl: "/audio/m1.mp3" };
      const result = ChatResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse response without audio", () => {
      const input = { sessionId: "s1", messageId: "m1", response: "Hi" };
      const result = ChatResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(ChatResponseSchema.description);
    });
  });

  describe("MessagesParamsSchema", () => {
    it("should parse valid params", () => {
      const result = MessagesParamsSchema.parse({ sessionId: "sess-1" });
      assert.strictEqual(result.sessionId, "sess-1");
    });

    it("should reject missing sessionId", () => {
      assert.throws(() => MessagesParamsSchema.parse({}), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(MessagesParamsSchema.description);
    });
  });

  describe("SessionsQuerySchema", () => {
    it("should parse with defaults", () => {
      const result = SessionsQuerySchema.parse({});
      assert.strictEqual(result.limit, 50);
      assert.strictEqual(result.offset, 0);
    });

    it("should parse with custom values", () => {
      const result = SessionsQuerySchema.parse({ limit: "20", offset: "10" });
      assert.strictEqual(result.limit, 20);
      assert.strictEqual(result.offset, 10);
    });

    it("should reject invalid limit", () => {
      assert.throws(() => SessionsQuerySchema.parse({ limit: "0" }));
      assert.throws(() => SessionsQuerySchema.parse({ limit: "101" }));
    });

    it("should reject negative offset", () => {
      assert.throws(() => SessionsQuerySchema.parse({ offset: "-1" }));
    });

    it("should have describe metadata", () => {
      assert.ok(SessionsQuerySchema.description);
    });
  });

  describe("SessionSchema", () => {
    it("should parse valid session", () => {
      const input = { id: "s1", title: "Chat", createdAt: 1, updatedAt: 2, messageCount: 5 };
      const result = SessionSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(SessionSchema.description);
    });
  });

  describe("CreateSessionRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { title: "New Chat", model: "gpt-4", systemPrompt: "Be helpful" };
      const result = CreateSessionRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should reject missing title", () => {
      assert.throws(() => CreateSessionRequestSchema.parse({ model: "gpt-4" }), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(CreateSessionRequestSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const request: ChatRequest = { message: "m" };
      const response: ChatResponse = { sessionId: "s", messageId: "m", response: "r" };
      const params: MessagesParams = { sessionId: "s" };
      const query: SessionsQuery = { limit: 10, offset: 0 };
      const session: Session = { id: "s", title: "t", createdAt: 1, updatedAt: 1, messageCount: 0 };
      const createReq: CreateSessionRequest = { title: "t" };
      assert.ok(request);
      assert.ok(response);
      assert.ok(params);
      assert.ok(query);
      assert.ok(session);
      assert.ok(createReq);
    });
  });
});