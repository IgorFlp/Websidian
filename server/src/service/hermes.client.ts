import { randomUUID } from "crypto";
import { config } from "../config/index.js";

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export class HermesClient {
  private baseUrl: string;
  private apiKey: string;
  private initialized = false;

  constructor(cfg: typeof config = config) {
    this.baseUrl = (cfg.hermesApiUrl || "http://localhost:8642").replace(/\/$/, "");
    this.apiKey = cfg.hermesApiKey || "";
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.healthCheck();
    this.initialized = true;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "API_SERVER_KEY": this.apiKey,
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
    };
  }

  private async request(
    method: string,
    path: string,
    body: unknown = null,
    options: { signal?: AbortSignal } = {}
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders();
    const requestId = randomUUID().slice(0, 8);

    const logRequest = (): void => {
      console.log(`[HERMES] ${requestId} ${method} ${path}`);
      if (body) {
        console.log(`[HERMES] ${requestId} Request:`, JSON.stringify(body).slice(0, 500));
      }
    };

    const logResponse = (status: number, data: unknown): void => {
      console.log(`[HERMES] ${requestId} Response: ${status}`);
      if (data) {
        console.log(`[HERMES] ${requestId} Body:`, JSON.stringify(data).slice(0, 500));
      }
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        logRequest();

        const fetchOptions: RequestInit = {
          method,
          headers,
          ...(body && typeof body === "object" ? { body: JSON.stringify(body as Record<string, unknown>) } : {}),
          signal: options.signal,
        };

        const response = await fetch(url, fetchOptions);
        const text = await response.text();

        let data: unknown;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        logResponse(response.status, data);

        if (!response.ok) {
          const error = new Error(`Hermes API error: ${response.status} ${response.statusText}`);
          (error as Error & { status: number; data: unknown }).status = response.status;
          (error as Error & { status: number; data: unknown }).data = data;
          throw error;
        }

        return data;
      } catch (err) {
        lastError = err as Error;
        console.error(`[HERMES] ${requestId} Attempt ${attempt} failed:`, err instanceof Error ? err.message : err);

        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError!;
  }

  async get(path: string, options: { signal?: AbortSignal } = {}): Promise<unknown> {
    return this.request("GET", path, null, options);
  }

  async post(path: string, body: unknown, options: { signal?: AbortSignal } = {}): Promise<unknown> {
    return this.request("POST", path, body, options);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get("/health");
      console.log("[HERMES] Health check passed:", response);
      return true;
    } catch (err) {
      console.error("[HERMES] Health check failed:", err instanceof Error ? err.message : err);
      throw new Error(`Hermes API server unavailable: ${err instanceof Error ? err.message : err}`);
    }
  }

  async createSession(title = "New Chat"): Promise<{ sessionId: string }> {
    return this.post("/api/sessions", { title }) as Promise<{ sessionId: string }>;
  }

  async chat(sessionId: string, input: string, systemPrompt: string | null = null): Promise<unknown> {
    const body: Record<string, unknown> = { input };
    if (systemPrompt) body["system"] = systemPrompt;
    return this.post(`/api/sessions/${sessionId}/chat`, body);
  }

  async chatStream(
    sessionId: string,
    input: string,
    systemPrompt: string | null = null,
    onChunk: (chunk: unknown) => void
  ): Promise<void> {
    const body: Record<string, unknown> = { input, stream: true };
    if (systemPrompt) body["system"] = systemPrompt;

    const url = `${this.baseUrl}/api/sessions/${sessionId}/chat`;
    const headers = this.getHeaders();
    const requestId = randomUUID().slice(0, 8);

    let lastError: Error;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`[HERMES] ${requestId} POST ${url} (stream)`);

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Hermes API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              onChunk(parsed);
            } catch {
              onChunk({ text: trimmed });
            }
          }
        }

        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            onChunk(parsed);
          } catch {
            onChunk({ text: buffer.trim() });
          }
        }

        return;
      } catch (err) {
        lastError = err as Error;
        console.error(`[HERMES] ${requestId} Stream attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError!;
  }

  async getMessages(sessionId: string, limit = 10): Promise<unknown> {
    return this.get(`/api/sessions/${sessionId}/messages?limit=${limit}`);
  }

  async getSessions(params: { limit?: number; offset?: number } = {}): Promise<unknown> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    const queryString = query.toString();
    return this.get(`/api/sessions${queryString ? `?${queryString}` : ""}`);
  }

  async getModels(): Promise<unknown> {
    return this.get("/api/models");
  }

  async getProfiles(): Promise<unknown> {
    return this.get("/api/profiles");
  }
}

let hermesClientInstance: HermesClient | null = null;

export function getHermesClient(cfg?: typeof config): HermesClient {
  if (!hermesClientInstance) {
    hermesClientInstance = new HermesClient(cfg);
  }
  return hermesClientInstance;
}

export function resetHermesClient(): void {
  hermesClientInstance = null;
}

export default HermesClient;