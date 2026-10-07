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
        reasoningBuffer: "",
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
      
      const repo = this.repositories.get(sessionId);
      let reasoningBuffer = repo.reasoningBuffer || "";
      let html = "";
      
      for (const msg of messages) {
        const messageData = this.parseHermesMessage(msg);
        console.log("[HTMLRepository] Parsed message:", { isAI: messageData.isAI, reasoningText: messageData.reasoningText, outputText: messageData.outputText, shouldDisplay: messageData.shouldDisplay });
        
        // Reset buffer on user message (nova conversa)
        if (messageData.shouldDisplay && msg.role === "user") {
          reasoningBuffer = "";
          repo.reasoningBuffer = "";
        }
        
        // Se tem reasoning mas não tem conteúdo pro usuário, acumula no buffer
        if (messageData.isAI && messageData.reasoningText && !messageData.outputText && !messageData.text) {
          reasoningBuffer += (reasoningBuffer ? "\n\n" : "") + messageData.reasoningText;
          repo.reasoningBuffer = reasoningBuffer;
          continue; // não renderiza mensagem vazia
        }
        
        // Se tem conteúdo pro usuário, anexa o buffer de reasoning
        if (messageData.shouldDisplay && (messageData.outputText || messageData.text)) {
          if (reasoningBuffer) {
            messageData.reasoningText = reasoningBuffer + (messageData.reasoningText ? "\n\n" + messageData.reasoningText : "");
            reasoningBuffer = "";
            repo.reasoningBuffer = "";
          }
          html += renderer.renderChatMessage(messageData);
        }
      }
      return html;
    } catch (err) {
      console.error("[HTMLRepository] Failed to fetch messages:", err.message);
      return this.buildHtml(sessionId, renderer);
    }
  }

  parseHermesMessage(msg) {
    if (!msg) return { isAI: false, text: "", timestamp: Date.now() };

    const isAI = msg.role === "assistant" 
      || msg.type === "ai" 
      || msg.role === "tool" 
      || msg.role === "function"
      || (msg.content && typeof msg.content === "object" && (msg.content.reasoning_content || msg.content.reasoning_text || msg.content.reasoning))
      || Boolean(msg.tool_calls?.length)
      || Boolean(msg.tool_call_id);
    let timestampValue = msg.timestamp || msg.created_at || Date.now();
    let text = "";
    let reasoningText = null;
    let outputText = null;

    // Normaliza reasoning de todas as fontes
    reasoningText = msg.reasoning_content || msg.reasoning || msg.content?.reasoning_content || msg.content?.reasoning || msg.content?.reasoning_text || null;

    if (typeof msg.content === "string") {
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.timestamp !== undefined || parsed.content !== undefined) {
          text = parsed.content || parsed.text || msg.content || "";
          reasoningText = parsed.reasoning_content || parsed.reasoning || reasoningText;
          outputText = parsed.content || parsed.output_text || null;
          timestampValue = parsed.timestamp ?? timestampValue;
        } else {
          text = msg.content;
        }
      } catch {
        text = msg.content;
      }
    } else if (msg.content && typeof msg.content === "object") {
      if (msg.content.output_text !== undefined || msg.content.reasoning_text !== undefined) {
        text = msg.content.output_text || msg.content.text || msg.content.message || "";
        reasoningText = msg.reasoning_content || msg.content.reasoning_content || msg.reasoning || msg.content.reasoning_text || msg.content.reasoning || reasoningText;
        outputText = msg.content.output_text || msg.content.content || null;
        timestampValue = msg.timestamp || msg.content.timestamp || timestampValue;
      } else if (msg.content.content !== undefined) {
        text = msg.content.content || msg.content.text || msg.content.message || "";
        outputText = msg.content.content || null;
        timestampValue = msg.timestamp || msg.content.timestamp || timestampValue;
      } else {
        text = msg.content.text || msg.content.message || JSON.stringify(msg.content);
        timestampValue = msg.timestamp || msg.content.timestamp || timestampValue;
      }
    } else if (msg.text) {
      text = msg.text;
    } else if (msg.message) {
      text = msg.message;
    }

    // Se o objeto direto tem content, reasoning, timestamp (como no exemplo)
    if (msg.content !== undefined && typeof msg.content === "string" && text === "") {
      text = msg.content;
      outputText = msg.content || null;
      timestampValue = msg.timestamp ?? timestampValue;
      reasoningText = msg.reasoning_content || msg.reasoning || reasoningText;
    } else if (msg.content && typeof msg.content === "object" && text === "" && msg.content.content !== undefined) {
      text = msg.content.content || msg.content.text || msg.content.message || "";
      outputText = msg.content.content || null;
      timestampValue = msg.timestamp || msg.content.timestamp || timestampValue;
      reasoningText = msg.reasoning_content || msg.content.reasoning_content || msg.reasoning || msg.content.reasoning || msg.content.reasoning_text || reasoningText;
    }

    return {
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isAI,
      text,
      timestamp: timestampValue,
      audio: null,
      reasoningText,
      outputText,
      shouldDisplay: msg.role === "user" 
        || (msg.role === "assistant" && (text || outputText || reasoningText))
        || (msg.type === "ai" && (text || outputText || reasoningText))
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