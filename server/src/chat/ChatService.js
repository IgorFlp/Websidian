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
    return { text: "", reasoningText: null, outputText: null, responseTime: null };
  }

  if (typeof response === "string") {
    return { text: response, reasoningText: null, outputText: null, responseTime: null };
  }

  if (typeof response === "object") {
    if (response.message.content && typeof response.message.content === "string") {
      try {
        const parsed = JSON.parse(response.message.content);
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

    if (response.reasoning_text !== undefined || response.output_text !== undefined) {
      const text = response.output_text || response.text || response.content || response.message || "";
      const reasoningText = response.reasoning_text || null;
      const outputText = response.output_text || null;
      const responseTime = response.response_time ?? null;
      return { text, reasoningText, outputText, responseTime };
    }

    if (response.choices && response.choices[0]) {
      const choice = response.choices[0];
      if (choice.message && choice.message.content) {
        const content = choice.message.content;
        if (typeof content === "string") {
          return { text: content, reasoningText: null, outputText: null, responseTime: null };
        }
      }
    }
  }

  return { text: JSON.stringify(response), reasoningText: null, outputText: null, responseTime: null };
}

async function generateTTS(text, messageId) {
  try {
    const speachesUrl = process.env.SPEACHES_API_URL || "http://localhost:8000";
    const apiKey = process.env.SPEACHES_API_KEY || "";
    const ttsModel = process.env.TTS_MODEL || "speaches-ai/Kokoro-82M-v1.0-ONNX";
    const ttsVoice = process.env.TTS_VOICE || "pm_alex";
    const ttsLanguage = process.env.TTS_LANGUAGE || "pt";
    
    const payload = {
      model: ttsModel,
      input: text,
      voice: ttsVoice,
      language: ttsLanguage,
      response_format: "mp3",
      speed: 1
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.error("[TTS] Request timeout after 30s");
      controller.abort();
    }, 30000);

    const fullUrl = `${speachesUrl}/v1/audio/speech`;
    console.log("[TTS] Calling speaches API for messageId:", messageId);

    let response;
    try {
      response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "*/*",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
        console.error("[TTS] Request aborted (timeout or manual abort)");
        return null;
      }
      console.error("[TTS] Fetch error:", fetchErr.message);
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

    // Save to public/audio
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

export class ChatService {
  constructor(audioFileManager, htmlRenderer) {
    this.audioFileManager = audioFileManager;
    this.htmlRenderer = htmlRenderer;
    this.hermesClient = getHermesClient();
  }

  async processChat(input, sessionId = null, audioPath = null, audioFileName = null, audioTranscript = null) {
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
        // No sessions exist, create a new one
        const newSession = await this.hermesClient.createSession();
        currentSessionId = newSession.sessionId;
      }
    }

    htmlRepository.init(currentSessionId);
    htmlRepository.setStreaming(currentSessionId, true);

    const isAudioFile = audioPath && (audioPath.startsWith("/tmp/") || audioPath.startsWith(os.tmpdir()) || audioPath.includes("public/recordings"));

    if (isAudioFile) {
      const id = randomUUID().slice(0, 8);
      const managedFileName = `hermes-api-${id}.webm`;
      const managedPath = path.join(os.tmpdir(), "hermes-api-audio", managedFileName);
      if (!fs.existsSync(path.dirname(managedPath))) fs.mkdirSync(path.dirname(managedPath), { recursive: true });
      fs.copyFileSync(audioPath, managedPath);
      try { fs.unlinkSync(audioPath); } catch (e) { /* ignore */ }

      const displayName = audioFileName || managedFileName;
      const audioUrl = `/api/audio-file?path=${encodeURIComponent(managedPath)}`;

      // Use transcript as the actual message content if available
      const messageText = audioTranscript && audioTranscript.trim() 
        ? audioTranscript 
        : `🎵 Áudio gravado: ${displayName}`;

      const messageData = {
        id: `msg-${Date.now()}`,
        isAI: false,
        text: messageText,
        timestamp: Date.now(),
        audio: { id, url: audioUrl, text: displayName, duration: 0 },
        reasoningText: null,
        outputText: null,
        responseTime: null,
      };

      htmlRepository.addMessage(currentSessionId, messageData);
      htmlRepository.setStreaming(currentSessionId, false);

      // If we have transcript, send it to Hermes as the actual message
      if (audioTranscript && audioTranscript.trim()) {
        let hermesResponse;
        try {
          hermesResponse = await this.hermesClient.chat(currentSessionId, audioTranscript, SYSTEM_PROMPT);
        } catch (err) {
          if (err.status === 404) {
            throw { status: 404, message: "Session not found" };
          }
          throw { status: 500, message: `Hermes API error: ${err.message}` };
        }

        const { text, reasoningText, outputText, responseTime } = parseHermesResponse(hermesResponse);

        // Add AI response to history
        const aiMessageData = {
          id: `msg-${Date.now()}`,
          isAI: true,
          text,
          timestamp: Date.now(),
          audio: null,
          reasoningText,
          outputText,
          responseTime,
        };

        htmlRepository.addMessage(currentSessionId, aiMessageData);
        
        // Generate TTS for the AI response
        const outputForTTS = outputText || text;
        if (outputForTTS && outputForTTS.trim()) {
          await generateTTS(outputForTTS.trim(), aiMessageData.id);
        }

        return {
          sessionId: currentSessionId,
          html: htmlRepository.buildHtml(currentSessionId, this.htmlRenderer),
          audio: [],
          streaming: false,
        };
      }

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

    console.log("[ChatService] Raw Hermes response:", JSON.stringify(hermesResponse).slice(0, 500));

    const { text, reasoningText, outputText, responseTime } = parseHermesResponse(hermesResponse);

    console.log("[ChatService] Hermes response parsed:", { text, reasoningText, outputText, responseTime });

    const messageData = {
      id: `msg-${Date.now()}`,
      isAI: true,
      text,
      timestamp: Date.now(),
      audio: null,
      reasoningText,
      outputText,
      ttsAudioPath: null,
      responseTime,
    };

    htmlRepository.addMessage(currentSessionId, messageData);
    htmlRepository.setStreaming(currentSessionId, false);
    
    // Generate TTS for the AI response
    const outputForTTS = outputText || text;
    if (outputForTTS && outputForTTS.trim()) {
      await generateTTS(outputForTTS.trim(), messageData.id);
    }

    return {
      sessionId: currentSessionId,
      html: "",
      audio: [],
      streaming: false,
    };
  }

  isStreaming(sessionId) {
    if (!sessionId) return false;
    return htmlRepository.isStreaming(sessionId);
  }
}

export default ChatService;