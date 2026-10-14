import { describe, it } from "node:test";
import assert from "node:assert";
import {
  TTSRequestSchema,
  TTSResponseSchema,
  TTSCheckParamsSchema,
  TTSCheckResponseSchema,
  STTRequestSchema,
  STTResponseSchema,
  UploadAudioResponseSchema,
  AudioParamsSchema,
  type TTSRequest,
  type TTSResponse,
  type TTSCheckParams,
  type TTSCheckResponse,
  type STTRequest,
  type STTResponse,
  type UploadAudioResponse,
  type AudioParams,
} from "./audio.js";

describe("Audio Schemas", () => {
  describe("TTSRequestSchema", () => {
    it("should parse valid request", () => {
      const input = { text: "Hello world", voice: "pm_alex", model: "kokoro", language: "pt" };
      const result = TTSRequestSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse minimal request", () => {
      const result = TTSRequestSchema.parse({ text: "Hello" });
      assert.strictEqual(result.text, "Hello");
    });

    it("should reject missing text", () => {
      assert.throws(() => TTSRequestSchema.parse({ voice: "v" }), /Required/);
    });

    it("should reject empty text", () => {
      assert.throws(() => TTSRequestSchema.parse({ text: "" }), /Text is required/);
    });

    it("should have describe metadata", () => {
      assert.ok(TTSRequestSchema.description);
    });
  });

  describe("TTSResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { messageId: "msg-1", accepted: true, audioUrl: "/audio/msg-1.mp3" };
      const result = TTSResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse pending response", () => {
      const input = { messageId: "msg-1", accepted: true };
      const result = TTSResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(TTSResponseSchema.description);
    });
  });

  describe("TTSCheckParamsSchema", () => {
    it("should parse valid params", () => {
      const result = TTSCheckParamsSchema.parse({ messageId: "msg-1" });
      assert.strictEqual(result.messageId, "msg-1");
    });

    it("should reject missing messageId", () => {
      assert.throws(() => TTSCheckParamsSchema.parse({}), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(TTSCheckParamsSchema.description);
    });
  });

  describe("TTSCheckResponseSchema", () => {
    it("should parse completed response", () => {
      const input = { messageId: "msg-1", status: "completed" as const, audioUrl: "/audio/msg-1.mp3" };
      const result = TTSCheckResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse failed response", () => {
      const input = { messageId: "msg-1", status: "failed" as const, error: "Generation failed" };
      const result = TTSCheckResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse pending response", () => {
      const input = { messageId: "msg-1", status: "pending" as const };
      const result = TTSCheckResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(TTSCheckResponseSchema.description);
    });
  });

  describe("STTRequestSchema", () => {
    it("should parse valid request", () => {
      const file = new File(["audio"], "test.webm", { type: "audio/webm" });
      const input = { audio: file, model: "whisper", language: "pt" };
      const result = STTRequestSchema.parse(input);
      assert.strictEqual(result.audio, file);
      assert.strictEqual(result.model, "whisper");
    });

    it("should have describe metadata", () => {
      assert.ok(STTRequestSchema.description);
    });
  });

  describe("STTResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { text: "Transcribed text", language: "pt" };
      const result = STTResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should parse minimal response", () => {
      const input = { text: "Text" };
      const result = STTResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(STTResponseSchema.description);
    });
  });

  describe("UploadAudioResponseSchema", () => {
    it("should parse valid response", () => {
      const input = { id: "aud-1", url: "/audio/aud-1.webm", filename: "recording.webm" };
      const result = UploadAudioResponseSchema.parse(input);
      assert.deepStrictEqual(result, input);
    });

    it("should have describe metadata", () => {
      assert.ok(UploadAudioResponseSchema.description);
    });
  });

  describe("AudioParamsSchema", () => {
    it("should parse valid params", () => {
      const result = AudioParamsSchema.parse({ id: "aud-1" });
      assert.strictEqual(result.id, "aud-1");
    });

    it("should reject missing id", () => {
      assert.throws(() => AudioParamsSchema.parse({}), /Required/);
    });

    it("should have describe metadata", () => {
      assert.ok(AudioParamsSchema.description);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types", () => {
      const ttsReq: TTSRequest = { text: "t" };
      const ttsRes: TTSResponse = { messageId: "m", accepted: true };
      const checkParams: TTSCheckParams = { messageId: "m" };
      const checkRes: TTSCheckResponse = { messageId: "m", status: "pending" };
      const sttReq: STTRequest = { audio: new File([], "a.webm") };
      const sttRes: STTResponse = { text: "t" };
      const uploadRes: UploadAudioResponse = { id: "i", url: "u", filename: "f" };
      const audioParams: AudioParams = { id: "i" };
      assert.ok(ttsReq);
      assert.ok(ttsRes);
      assert.ok(checkParams);
      assert.ok(checkRes);
      assert.ok(sttReq);
      assert.ok(sttRes);
      assert.ok(uploadRes);
      assert.ok(audioParams);
    });
  });
});