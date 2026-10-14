import { HermesClient, getHermesClient } from "./hermes.client.js";
import { HTMLRenderer } from "./html.renderer.js";

interface AudioData {
  audioPath?: string;
  duration?: string;
  transcript?: string;
}

interface MessageData {
  id: string;
  isAI: boolean;
  text: string;
  timestamp: number;
  audio: AudioData | null;
  reasoningText: string | null;
  outputText: string | null;
  shouldDisplay: boolean;
}

interface SessionRepository {
  messages: MessageData[];
  lastUpdated: number;
  isStreaming: boolean;
  reasoningBuffer: string;
}

export class HTMLRepository {
  private repositories: Map<string, SessionRepository>;
  private hermesClient: HermesClient;

  constructor(hermesClient?: HermesClient) {
    this.repositories = new Map();
    this.hermesClient = hermesClient || getHermesClient();
  }

  init(sessionId: string): void {
    if (!this.repositories.has(sessionId)) {
      this.repositories.set(sessionId, {
        messages: [],
        lastUpdated: Date.now(),
        isStreaming: false,
        reasoningBuffer: "",
      });
    }
  }

  addMessage(sessionId: string, messageData: MessageData): void {
    const repo = this.repositories.get(sessionId);
    if (!repo) return;
    repo.messages.push(messageData);
    repo.lastUpdated = Date.now();
  }

  async fetchAndBuildHtml(sessionId: string, renderer: HTMLRenderer): Promise<string> {
    this.init(sessionId);

    try {
      const response = await this.hermesClient.getMessages(sessionId, 100);
      const messages = (response as { messages?: unknown[]; data?: unknown[] })?.messages ||
        (response as { messages?: unknown[]; data?: unknown[] })?.data ||
        (response as unknown[]) ||
        [];

      console.log("[HTMLRepository] Messages fetched:", messages.length);
      if (messages.length > 0) {
        console.log("[HTMLRepository] First message:", JSON.stringify(messages[0]).slice(0, 500));
      }

      const repo = this.repositories.get(sessionId)!;
      let reasoningBuffer = repo.reasoningBuffer || "";
      let html = "";

      for (const msg of messages) {
        const messageData = this.parseHermesMessage(msg);
        console.log("[HTMLRepository] Parsed message:", {
          isAI: messageData.isAI,
          reasoningText: messageData.reasoningText,
          outputText: messageData.outputText,
          shouldDisplay: messageData.shouldDisplay,
        });

        if (messageData.shouldDisplay && msg && typeof msg === "object" && "role" in msg && msg["role"] === "user") {
          reasoningBuffer = "";
          repo.reasoningBuffer = "";
        }

        if (messageData.isAI && messageData.reasoningText && !messageData.outputText && !messageData.text) {
          reasoningBuffer += (reasoningBuffer ? "\n\n" : "") + messageData.reasoningText;
          repo.reasoningBuffer = reasoningBuffer;
          continue;
        }

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
      console.error("[HTMLRepository] Failed to fetch messages:", err instanceof Error ? err.message : err);
      return this.buildHtml(sessionId, renderer);
    }
  }

  parseHermesMessage(msg: unknown): MessageData {
    if (!msg) return { id: "", isAI: false, text: "", timestamp: Date.now(), audio: null, reasoningText: null, outputText: null, shouldDisplay: false };

    const msgObj = msg as Record<string, unknown>;

    const isAI = Boolean(
      (msgObj["role"] as string) === "assistant"
      || (msgObj["type"] as string) === "ai"
      || (msgObj["role"] as string) === "tool"
      || (msgObj["role"] as string) === "function"
      || (msgObj["content"] && typeof msgObj["content"] === "object" &&
        (("reasoning_content" in (msgObj["content"] as Record<string, unknown>)) || ("reasoning_text" in (msgObj["content"] as Record<string, unknown>)) || ("reasoning" in (msgObj["content"] as Record<string, unknown>))))
      || Boolean(((msgObj["tool_calls"] as unknown[])?.length))
      || Boolean(msgObj["tool_call_id"])
    );

    let timestampValue = (msgObj["timestamp"] as number) || (msgObj["created_at"] as number) || Date.now();
    let text = "";
    let reasoningText: string | null = null;
    let outputText: string | null = null;

    reasoningText = (msgObj["reasoning_content"] as string) || (msgObj["reasoning"] as string) ||
      ((msgObj["content"] as Record<string, unknown>)?.["reasoning_content"] as string) ||
      ((msgObj["content"] as Record<string, unknown>)?.["reasoning"] as string) ||
      ((msgObj["content"] as Record<string, unknown>)?.["reasoning_text"] as string) || null;

    if (typeof msgObj["content"] === "string") {
      try {
        const parsed = JSON.parse(msgObj["content"] as string);
        if (parsed.timestamp !== undefined || parsed.content !== undefined) {
          text = parsed.content || parsed.text || (msgObj["content"] as string) || "";
          reasoningText = parsed.reasoning_content || parsed.reasoning || reasoningText;
          outputText = parsed.content || parsed.output_text || null;
          timestampValue = parsed.timestamp ?? timestampValue;
        } else {
          text = msgObj["content"] as string;
        }
      } catch {
        text = msgObj["content"] as string;
      }
    } else if (msgObj["content"] && typeof msgObj["content"] === "object") {
      const content = msgObj["content"] as Record<string, unknown>;
      if (content["output_text"] !== undefined || content["reasoning_text"] !== undefined) {
        text = (content["output_text"] as string) || (content["text"] as string) || (content["message"] as string) || "";
        reasoningText = (msgObj["reasoning_content"] as string) || (content["reasoning_content"] as string) ||
          (msgObj["reasoning"] as string) || (content["reasoning_text"] as string) || (content["reasoning"] as string) || reasoningText;
        outputText = (content["output_text"] as string) || (content["content"] as string) || null;
        timestampValue = (msgObj["timestamp"] as number) || (content["timestamp"] as number) || timestampValue;
      } else if (content["content"] !== undefined) {
        text = (content["content"] as string) || (content["text"] as string) || (content["message"] as string) || "";
        outputText = (content["content"] as string) || null;
        timestampValue = (msgObj["timestamp"] as number) || (content["timestamp"] as number) || timestampValue;
      } else {
        text = (content["text"] as string) || (content["message"] as string) || JSON.stringify(content);
        timestampValue = (msgObj["timestamp"] as number) || (content["timestamp"] as number) || timestampValue;
      }
    } else if (msgObj["text"]) {
      text = msgObj["text"] as string;
    } else if (msgObj["message"]) {
      text = msgObj["message"] as string;
    }

    if (msgObj["content"] !== undefined && typeof msgObj["content"] === "string" && text === "") {
      text = msgObj["content"] as string;
      outputText = msgObj["content"] as string || null;
      timestampValue = (msgObj["timestamp"] as number) ?? timestampValue;
      reasoningText = (msgObj["reasoning_content"] as string) || (msgObj["reasoning"] as string) || reasoningText;
    } else if (msgObj["content"] && typeof msgObj["content"] === "object" && text === "" && "content" in (msgObj["content"] as Record<string, unknown>)) {
      const content = msgObj["content"] as Record<string, unknown>;
      text = (content["content"] as string) || (content["text"] as string) || (content["message"] as string) || "";
      outputText = (content["content"] as string) || null;
      timestampValue = (msgObj["timestamp"] as number) || (content["timestamp"] as number) || timestampValue;
      reasoningText = (msgObj["reasoning_content"] as string) || (content["reasoning_content"] as string) ||
        (msgObj["reasoning"] as string) || (content["reasoning"] as string) || (content["reasoning_text"] as string) || reasoningText;
    }

    return {
      id: (msgObj["id"] as string) || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isAI,
      text,
      timestamp: timestampValue,
      audio: null,
      reasoningText,
      outputText,
      shouldDisplay: (msgObj["role"] as string) === "user"
        || ((msgObj["role"] as string) === "assistant" && Boolean(text || outputText || reasoningText))
        || ((msgObj["type"] as string) === "ai" && Boolean(text || outputText || reasoningText)),
    };
  }

  buildHtml(sessionId: string, renderer: HTMLRenderer): string {
    const repo = this.repositories.get(sessionId);
    if (!repo || !repo.messages.length) return "";

    let html = "";
    for (const msg of repo.messages) {
      html += renderer.renderChatMessage(msg);
    }
    return html;
  }

  isStreaming(sessionId: string): boolean {
    const repo = this.repositories.get(sessionId);
    return repo ? repo.isStreaming : false;
  }

  setStreaming(sessionId: string, value: boolean): void {
    const repo = this.repositories.get(sessionId);
    if (!repo) return;
    repo.isStreaming = value;
  }

  clear(sessionId: string): void {
    this.repositories.delete(sessionId);
  }
}

export const htmlRepository = new HTMLRepository();
export default HTMLRepository;