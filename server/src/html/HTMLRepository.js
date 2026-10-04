import { getHermesClient } from "../hermes/HermesClient.js";

class HTMLRepository {
  constructor() {
    this.repositories = new Map();
    this.hermesClient = getHermesClient();
  }

  init(sessionId) {
    if (!this.repositories.has(sessionId)) {
      this.repositories.set(sessionId, {
        messages: [],
        lastUpdated: Date.now(),
        isStreaming: false,
      });
    }
  }

  addMessage(sessionId, messageData) {
    const repo = this.repositories.get(sessionId);
    if (!repo) return;
    repo.messages.push(messageData);
    repo.lastUpdated = Date.now();
  }

  async fetchAndBuildHtml(sessionId, renderer) {
    this.init(sessionId);

    try {
      const response = await this.hermesClient.getMessages(sessionId, 100);
      const messages = response.messages || response.data || response || [];
      
      console.log("[HTMLRepository] Messages fetched:", messages.length);
      if (messages.length > 0) {
        console.log("[HTMLRepository] First message:", JSON.stringify(messages[0]).slice(0, 500));
      }
      
      let html = "";
      for (const msg of messages) {
        const messageData = this.parseHermesMessage(msg);
        console.log("[HTMLRepository] Parsed message:", { isAI: messageData.isAI, reasoningText: messageData.reasoningText, outputText: messageData.outputText });
        html += renderer.renderChatMessage(messageData);
      }
      return html;
    } catch (err) {
      console.error("[HTMLRepository] Failed to fetch messages:", err.message);
      return this.buildHtml(sessionId, renderer);
    }
  }

  parseHermesMessage(msg) {
    if (!msg) return { isAI: false, text: "", timestamp: Date.now() };

    const isAI = msg.role === "assistant" || msg.type === "ai";
    let text = "";
    let reasoningText = null;
    let outputText = null;
    let ttsAudioPath = null;
    let responseTime = null;

    if (typeof msg.content === "string") {
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.response_time !== undefined || parsed.output_text !== undefined) {
          text = parsed.output_text || parsed.text || "";
          ttsAudioPath = parsed.tts_audio_path || null;
          reasoningText = parsed.reasoning_text || null;
          outputText = parsed.output_text || null;
          responseTime = parsed.response_time ?? null;
        } else {
          text = msg.content;
        }
      } catch {
        text = msg.content;
      }
    } else if (msg.content && typeof msg.content === "object") {
      if (msg.content.output_text !== undefined || msg.content.reasoning_text !== undefined) {
        text = msg.content.output_text || msg.content.text || "";
        ttsAudioPath = msg.content.tts_audio_path || null;
        reasoningText = msg.content.reasoning_text || null;
        outputText = msg.content.output_text || null;
        responseTime = msg.content.response_time ?? null;
      } else {
        text = msg.content.text || msg.content.message || JSON.stringify(msg.content);
      }
    } else if (msg.text) {
      text = msg.text;
    } else if (msg.message) {
      text = msg.message;
    }

    return {
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isAI,
      text,
      timestamp: msg.timestamp || msg.created_at || Date.now(),
      audio: null,
      reasoningText,
      outputText,
      ttsAudioPath,
      responseTime,
    };
  }

  buildHtml(sessionId, renderer) {
    const repo = this.repositories.get(sessionId);
    if (!repo || !repo.messages.length) return "";

    let html = "";
    for (const msg of repo.messages) {
      html += renderer.renderChatMessage(msg);
    }
    return html;
  }

  isStreaming(sessionId) {
    const repo = this.repositories.get(sessionId);
    return repo ? repo.isStreaming : false;
  }

  setStreaming(sessionId, value) {
    const repo = this.repositories.get(sessionId);
    if (!repo) return;
    repo.isStreaming = value;
  }

  clear(sessionId) {
    this.repositories.delete(sessionId);
  }
}

const htmlRepository = new HTMLRepository();

export { htmlRepository, HTMLRepository };