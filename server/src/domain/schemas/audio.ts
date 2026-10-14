import { z } from "zod";

export const TTSRequestSchema = z.object({
  text: z.string().min(1, "Text is required").describe("Text to synthesize"),
  voice: z.string().optional().describe("Voice to use (optional)"),
  model: z.string().optional().describe("Model to use (optional)"),
  language: z.string().optional().describe("Language code (optional)"),
}).describe("TTS generation request");

export const TTSResponseSchema = z.object({
  messageId: z.string().describe("Message ID for tracking"),
  accepted: z.boolean().describe("Whether the request was accepted for processing"),
  audioUrl: z.string().optional().describe("Audio URL if immediately available"),
}).describe("TTS response");

export const TTSCheckParamsSchema = z.object({
  messageId: z.string().min(1, "Message ID is required").describe("Message ID to check"),
}).describe("Route parameters for checking TTS status");

export const TTSCheckResponseSchema = z.object({
  messageId: z.string().describe("Message ID"),
  status: z.enum(["pending", "completed", "failed"]).describe("Processing status"),
  audioUrl: z.string().optional().describe("Audio URL if completed"),
  error: z.string().optional().describe("Error message if failed"),
}).describe("TTS status check response");

export const STTRequestSchema = z.object({
  audio: z.instanceof(File).describe("Audio file to transcribe"),
  model: z.string().optional().describe("Model to use (optional)"),
  language: z.string().optional().describe("Language code (optional)"),
}).describe("STT transcription request");

export const STTResponseSchema = z.object({
  text: z.string().describe("Transcribed text"),
  language: z.string().optional().describe("Detected language"),
}).describe("STT transcription response");

export const UploadAudioResponseSchema = z.object({
  id: z.string().describe("Uploaded audio ID"),
  url: z.string().describe("Audio file URL"),
  filename: z.string().describe("Original filename"),
}).describe("Audio upload response");

export const AudioParamsSchema = z.object({
  id: z.string().min(1, "Audio ID is required").describe("Audio file ID"),
}).describe("Route parameters for audio file access");

export type TTSRequest = z.infer<typeof TTSRequestSchema>;
export type TTSResponse = z.infer<typeof TTSResponseSchema>;
export type TTSCheckParams = z.infer<typeof TTSCheckParamsSchema>;
export type TTSCheckResponse = z.infer<typeof TTSCheckResponseSchema>;
export type STTRequest = z.infer<typeof STTRequestSchema>;
export type STTResponse = z.infer<typeof STTResponseSchema>;
export type UploadAudioResponse = z.infer<typeof UploadAudioResponseSchema>;
export type AudioParams = z.infer<typeof AudioParamsSchema>;