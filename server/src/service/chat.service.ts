import { HermesClient, getHermesClient } from "./hermes.client.js";
import { HTMLRenderer } from "./html.renderer.js";
import { HTMLRepository } from "./html.repository.js";
import { AudioFileManager } from "./audio.service.js";
import { config } from "../config/index.js";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

const SYSTEM_PROMPT = `Responda ao usuário {USER_PROMPT}

Responda como se estivesse no modo CLI, qualquer solicitação de autorização, allow ou algo assim deve ser solicitada via texto para eu poder permitir via texto/audio.

# Output format

{
    response_time: float,
    reasoning_text: string(ANSI -> HTML),
    output_text: string
}

`;

interface ParsedHermesResponse {
  text: string;
  reasoningText: string | null;
  outputText: string | null;
  responseTime: number | null;
}

function parseHermesResponse(response: unknown): ParsedHermesResponse {
  if (!response) {
    return { text: "", reasoningText: null, outputText: null, responseTime: null };
  }

  if (typeof response === "string") {
    return { text: response, reasoningText: null, outputText: null, responseTime: null };
  }

  if (typeof response === "object" && response !== null) {
    const resp = response as Record<string, unknown>;

    const message = resp["message"] as Record<string, unknown> | undefined;
    if (message && typeof message["content"] === "string") {
      try {
        const parsed = JSON.parse(message["content"] as string);
        if (parsed.response_time !== undefined || parsed.output_text !== undefined) {
          return {
            text: parsed.output_text || parsed.text || "",
            reasoningText: parsed.reasoning_text || null,
            outputText: parsed.output_text || null,
            responseTime: parsed.response_time ?? null,
          };
        }
      } catch {
        /* not JSON, fall through */
      }
    }

    if (resp["reasoning_text"] !== undefined || resp["output_text"] !== undefined) {
      const text = (resp["output_text"] as string) || (resp["text"] as string) || (resp["content"] as string) || (resp["message"] as string) || "";
      const reasoningText = (resp["reasoning_text"] as string) || null;
      const outputText = (resp["output_text"] as string) || null;
      const responseTime = (resp["response_time"] as number) ?? null;
      return { text, reasoningText, outputText, responseTime };
    }

    const choices = resp["choices"] as unknown[] | undefined;
    if (choices && choices[0]) {
      const choice = choices[0] as Record<string, unknown>;
      const choiceMessage = choice["message"] as Record<string, unknown> | undefined;
      if (choiceMessage && typeof choiceMessage["content"] === "string") {
        const content = choiceMessage["content"] as string;
        return { text: content, reasoningText: null, outputText: null, responseTime: null };
      }
    }
  }

  return { text: JSON.stringify(response), reasoningText: null, outputText: null, responseTime: null };
}

async function generateTTS(text: string, messageId: string): Promise<string | null> {
  try {
    const speachesUrl = config.speachesApiUrl;
    const apiKey = config.speachesApiKey;
    const ttsModel = config.ttsModel;
    const ttsVoice = config.ttsVoice;
    const ttsLanguage = config.ttsLanguage;

    const payload = {
      model: ttsModel,
      input: text,
      voice: ttsVoice,
      language: ttsLanguage,
      response_format: "mp3",
      speed: 1,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.error("[TTS] Request timeout after 30s");
      controller.abort();
    }, 30000);

    const fullUrl = `${speachesUrl}/v1/audio/speech`;
    console.log("[TTS] Calling speaches API for messageId:", messageId);

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        console.error("[TTS] Request aborted (timeout or manual abort)");
        return null;
      }
      console.error("[TTS] Fetch error:", fetchErr instanceof Error ? fetchErr.message : fetchErr);
      return null;
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[TTS] speaches API error:", response.status, errText);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    const PUBLIC_DIR = path.join(__dirname, "..", "..", "..", "public");
    const AUDIOS_DIR = path.join(PUBLIC_DIR, "audio");
    if (!fs.existsSync(AUDIOS_DIR)) {
      fs.mkdirSync(AUDIOS_DIR, { recursive: true });
    }

    const fileName = `tts-${messageId}.mp3`;
    const filePath = path.join(AUDIOS_DIR, fileName);
    fs.writeFileSync(filePath, audioData);

    const audioUrl = `/audio/${fileName}`;
    console.log("[TTS] Generated for messageId:", messageId, "->", audioUrl);
    return audioUrl;
  } catch (err) {
    console.error("[TTS] Error generating for messageId:", messageId, err);
    return null;
  }
}

interface ChatMessageData {
  id: string;
  isAI: boolean;
  text: string;
  timestamp: number;
  audio: { id: string; url: string; text: string; duration: string } | null;
  reasoningText: string | null;
  outputText: string | null;
  responseTime: number | null;
  shouldDisplay: boolean;
}

interface ProcessChatResult {
  sessionId: string;
  html: string;
  audio: { id: string; url: string; text: string; duration: string }[];
  streaming: boolean;
}

export class ChatService {
  private audioFileManager: AudioFileManager;
  private htmlRenderer: HTMLRenderer;
  private htmlRepository: HTMLRepository;
  private hermesClient: HermesClient;

  constructor(
    audioFileManager: AudioFileManager,
    htmlRenderer: HTMLRenderer,
    htmlRepository?: HTMLRepository,
    hermesClient?: HermesClient
  ) {
    this.audioFileManager = audioFileManager;
    this.htmlRenderer = htmlRenderer;
    this.htmlRepository = htmlRepository || new HTMLRepository(hermesClient);
    this.hermesClient = hermesClient || getHermesClient();
  }

  async processChat(
    input: string,
    sessionId: string | null = null,
    audioPath: string | null = null,
    audioFileName: string | null = null,
    audioTranscript: string | null = null
  ): Promise<ProcessChatResult> {
    if (!input || typeof input !== "string") {
      throw new Error("Input is required and must be a string");
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const sessions = await this.hermesClient.getSessions({ limit: 1 });
      const sessionsArray = (sessions as { data?: unknown[]; sessions?: unknown[] })?.data ||
        (sessions as { data?: unknown[]; sessions?: unknown[] })?.sessions ||
        (sessions as unknown[]) ||
        [];

      if (sessionsArray.length > 0) {
        const firstSession = sessionsArray[0] as { id?: string; sessionId?: string };
        currentSessionId = firstSession.id ?? firstSession.sessionId ?? "";
      } else {
        const newSession = await this.hermesClient.createSession();
        currentSessionId = (newSession as { sessionId: string }).sessionId;
      }
    }

    this.htmlRepository.init(currentSessionId);
    this.htmlRepository.setStreaming(currentSessionId, true);

    const isAudioFile = audioPath && (audioPath.startsWith("/tmp/") || audioPath.startsWith(os.tmpdir()) || audioPath.includes("public/recordings"));

    if (isAudioFile) {
      const id = randomUUID().slice(0, 8);
      const managedFileName = `hermes-api-${id}.webm`;
      const managedPath = path.join(os.tmpdir(), "hermes-api-audio", managedFileName);
      if (!fs.existsSync(path.dirname(managedPath))) fs.mkdirSync(path.dirname(managedPath), { recursive: true });
      fs.copyFileSync(audioPath, managedPath);
      try { fs.unlinkSync(audioPath); } catch { /* ignore */ }

      const displayName = audioFileName || managedFileName;
      const audioUrl = `/api/audio-file?path=${encodeURIComponent(managedPath)}`;

      const messageText = audioTranscript && audioTranscript.trim()
        ? audioTranscript
        : `🎵 Áudio gravado: ${displayName}`;

      const messageData: ChatMessageData = {
        id: `msg-${Date.now()}`,
        isAI: false,
        text: messageText,
        timestamp: Date.now(),
        audio: { id, url: audioUrl, text: displayName, duration: "0" },
        reasoningText: null,
        outputText: null,
        responseTime: null,
        shouldDisplay: true,
      };

      this.htmlRepository.addMessage(currentSessionId, messageData);
      this.htmlRepository.setStreaming(currentSessionId, false);

      if (audioTranscript && audioTranscript.trim()) {
        let hermesResponse: unknown;
        try {
          hermesResponse = await this.hermesClient.chat(currentSessionId, audioTranscript, SYSTEM_PROMPT);
        } catch (err) {
          const error = err as Error & { status?: number };
          if (error.status === 404) {
            throw { status: 404, message: "Session not found" };
          }
          throw { status: 500, message: `Hermes API error: ${error.message}` };
        }

        const { text, reasoningText, outputText, responseTime } = parseHermesResponse(hermesResponse);

        const aiMessageData: ChatMessageData = {
          id: `msg-${Date.now()}`,
          isAI: true,
          text,
          timestamp: Date.now(),
          audio: null,
          reasoningText,
          outputText,
          responseTime,
          shouldDisplay: true,
        };

        this.htmlRepository.addMessage(currentSessionId, aiMessageData);

        const outputForTTS = outputText ?? text ?? "";
        if (outputForTTS.trim()) {
          await generateTTS(outputForTTS.trim(), aiMessageData.id);
        }

        return {
          sessionId: currentSessionId,
          html: this.htmlRepository.buildHtml(currentSessionId, this.htmlRenderer),
          audio: [],
          streaming: false,
        };
      }

      return {
        sessionId: currentSessionId,
        html: this.htmlRepository.buildHtml(currentSessionId, this.htmlRenderer),
        audio: messageData.audio ? [messageData.audio] : [],
        streaming: false,
      };
    }

    let hermesResponse: unknown;
    try {
      hermesResponse = await this.hermesClient.chat(currentSessionId, input, SYSTEM_PROMPT);
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 404) {
        throw { status: 404, message: "Session not found" };
      }
      throw { status: 500, message: `Hermes API error: ${error.message}` };
    }

    console.log("[ChatService] Raw Hermes response:", JSON.stringify(hermesResponse).slice(0, 500));

    const { text, reasoningText, outputText, responseTime } = parseHermesResponse(hermesResponse);

    console.log("[ChatService] Hermes response parsed:", { text, reasoningText, outputText, responseTime });

    const messageData: ChatMessageData = {
      id: `msg-${Date.now()}`,
      isAI: true,
      text,
      timestamp: Date.now(),
      audio: null,
      reasoningText,
      outputText,
      responseTime,
      shouldDisplay: true,
    };

    this.htmlRepository.addMessage(currentSessionId, messageData);
    this.htmlRepository.setStreaming(currentSessionId, false);

    const outputForTTS = outputText ?? text ?? "";
    if (outputForTTS.trim()) {
      await generateTTS(outputForTTS.trim(), messageData.id);
    }

    return {
      sessionId: currentSessionId,
      html: "",
      audio: [],
      streaming: false,
    };
  }

  isStreaming(sessionId: string): boolean {
    if (!sessionId) return false;
    return this.htmlRepository.isStreaming(sessionId);
  }
}

export default ChatService;