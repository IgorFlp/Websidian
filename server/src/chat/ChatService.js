import { getHermesClient } from "../hermes/HermesClient.js";
import { chat_prompt } from "../prompts/Chat-prompt.js";
import { htmlRepository } from "../html/HTMLRepository.js";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

const SYSTEM_PROMPT = chat_prompt;

function parseHermesResponse(response) {
  if (!response) {
    return { text: "", audioPath: null, reasoningText: null, outputText: null, responseTime: null };
  }

  if (typeof response === "string") {
    return { text: response, audioPath: null, reasoningText: null, outputText: null, responseTime: null };
  }

  if (typeof response === "object") {
    if (response.message.content && typeof response.message.content === "string") {
      try {
        const parsed = JSON.parse(response.message.content);
        if (parsed.response_time !== undefined || parsed.output_text !== undefined) {
          return {
            text: parsed.output_text || parsed.text || "",
            audioPath: parsed.tts_audio_path || parsed.audioPath || null,
            reasoningText: parsed.reasoning_text || null,
            outputText: parsed.output_text || null,
            responseTime: parsed.response_time ?? null,
          };
        }
      } catch {
        /* not JSON, fall through */
      }
    }

    if (response.reasoning_text !== undefined || response.output_text !== undefined) {
      const text = response.output_text || response.text || response.content || response.message || "";
      const audioPath = response.tts_audio_path || response.audioPath || null;
      const reasoningText = response.reasoning_text || null;
      const outputText = response.output_text || null;
      const responseTime = response.response_time ?? null;
      return { text, audioPath, reasoningText, outputText, responseTime };
    }

    if (response.text && response.audioPath) {
      return { text: response.text, audioPath: response.audioPath, reasoningText: null, outputText: null, responseTime: null };
    }
    if (response.content && response.audioPath) {
      return { text: response.content, audioPath: response.audioPath, reasoningText: null, outputText: null, responseTime: null };
    }
    if (response.message && response.audioPath) {
      return { text: response.message, audioPath: response.audioPath, reasoningText: null, outputText: null, responseTime: null };
    }
    if (response.choices && response.choices[0]) {
      const choice = response.choices[0];
      if (choice.message && choice.message.content) {
        const content = choice.message.content;
        if (typeof content === "string") {
          const audioPathMatch = content.match(/audioPath[:\s]+([^\s]+)/i);
          const audioPath = audioPathMatch ? audioPathMatch[1] : null;
          const text = content.replace(/audioPath[:\s]+[^\s]+/i, "").trim();
          return { text, audioPath, reasoningText: null, outputText: null, responseTime: null };
        }
      }
    }
    if (response.audioPath) {
      const text = response.text || response.content || response.message || "";
      return { text, audioPath: response.audioPath, reasoningText: null, outputText: null, responseTime: null };
    }
  }

  return { text: JSON.stringify(response), audioPath: null, reasoningText: null, outputText: null, responseTime: null };
}

export class ChatService {
  constructor(audioFileManager, htmlRenderer) {
    this.audioFileManager = audioFileManager;
    this.htmlRenderer = htmlRenderer;
    this.hermesClient = getHermesClient();
  }

  async processChat(input, sessionId = null) {
    if (!input || typeof input !== "string") {
      throw new Error("Input is required and must be a string");
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const sessions = await this.hermesClient.getSessions({ limit: 1 });
      if (sessions && sessions.data && sessions.data.length > 0) {
        currentSessionId = sessions.data[0].id;
      } else if (sessions && sessions.length > 0) {
        currentSessionId = sessions[0].id;
      } else {
        throw new Error("No existing sessions found. Create one via Hermes dashboard first.");
      }
    }

    htmlRepository.init(currentSessionId);
    htmlRepository.setStreaming(currentSessionId, true);

    const isAudioFile = input.startsWith("/tmp/") || input.startsWith(os.tmpdir());

    if (isAudioFile) {
      const id = randomUUID().slice(0, 8);
      const managedFileName = `hermes-api-${id}.webm`;
      const managedPath = path.join(os.tmpdir(), "hermes-api-audio", managedFileName);
      if (!fs.existsSync(path.dirname(managedPath))) fs.mkdirSync(path.dirname(managedPath), { recursive: true });
      fs.copyFileSync(input, managedPath);
      try { fs.unlinkSync(input); } catch (e) { /* ignore */ }

      const messageData = {
        id: `msg-${Date.now()}`,
        isAI: false,
        text: "Áudio enviado",
        timestamp: Date.now(),
        audio: { id, url: `/audio/${id}`, text: "Áudio enviado", duration: 0 },
        reasoningText: null,
        outputText: null,
        ttsAudioPath: null,
        responseTime: null,
      };

      htmlRepository.addMessage(currentSessionId, messageData);
      htmlRepository.setStreaming(currentSessionId, false);

      return {
        sessionId: currentSessionId,
        html: htmlRepository.buildHtml(currentSessionId, this.htmlRenderer),
        audio: [messageData.audio],
        streaming: false,
      };
    }

    let hermesResponse;
    try {
      hermesResponse = await this.hermesClient.chat(currentSessionId, input, SYSTEM_PROMPT);
    } catch (err) {
      if (err.status === 404) {
        throw { status: 404, message: "Session not found" };
      }
      throw { status: 500, message: `Hermes API error: ${err.message}` };
    }

    const { text, audioPath, reasoningText, outputText, responseTime } = parseHermesResponse(hermesResponse);

    console.log("[ChatService] Hermes response parsed:", { text, audioPath, reasoningText, outputText, responseTime });

    let audioArray = [];
    if (audioPath) {
      console.log("[ChatService] Processing audio file:", audioPath);
      try {
        const audioFile = await this.audioFileManager.addFromHermesTemp(audioPath, text);
        console.log("[ChatService] Audio file processed:", audioFile.url);
        audioArray = [{
          id: audioFile.id,
          url: audioFile.url,
          text: audioFile.text,
          duration: audioFile.duration,
        }];
      } catch (err) {
        console.error("Failed to process audio file:", err.message);
      }
    } else {
      console.log("[ChatService] No audio path in response");
    }

    const messageData = {
      id: `msg-${Date.now()}`,
      isAI: true,
      text,
      timestamp: Date.now(),
      audio: audioArray.length > 0 ? audioArray[0] : null,
      reasoningText,
      outputText,
      ttsAudioPath: audioArray.length > 0 ? audioArray[0].url : null,
      responseTime,
    };

    htmlRepository.addMessage(currentSessionId, messageData);
    htmlRepository.setStreaming(currentSessionId, false);

    return {
      sessionId: currentSessionId,
      html: "",
      audio: audioArray,
      streaming: false,
    };
  }

  isStreaming(sessionId) {
    if (!sessionId) return false;
    return htmlRepository.isStreaming(sessionId);
  }
}

export default ChatService;