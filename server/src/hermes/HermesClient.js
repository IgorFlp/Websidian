import { randomUUID } from "crypto";

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

class HermesClient {
  constructor() {
    this.baseUrl = (process.env.HERMES_API_URL || "http://localhost:8642").replace(/\/$/, "");
    this.apiKey = process.env.HERMES_API_KEY || "";
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    await this.healthCheck();
    this.initialized = true;
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
    };
  }

  async request(method, path, body = null, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders();
    const requestId = randomUUID().slice(0, 8);

    const logRequest = () => {
      console.log(`[HERMES] ${requestId} ${method} ${path}`);
      if (body) {
        console.log(`[HERMES] ${requestId} Request:`, JSON.stringify(body).slice(0, 500));
      }
    };

    const logResponse = (status, data) => {
      console.log(`[HERMES] ${requestId} Response: ${status}`);
      if (data) {
        console.log(`[HERMES] ${requestId} Body:`, JSON.stringify(data).slice(0, 500));
      }
    };

    let lastError;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        logRequest();

        const fetchOptions = {
          method,
          headers,
          ...(body && { body: JSON.stringify(body) }),
          signal: options.signal,
        };

        const response = await fetch(url, fetchOptions);
        const text = await response.text();

        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        logResponse(response.status, data);

        if (!response.ok) {
          const error = new Error(`Hermes API error: ${response.status} ${response.statusText}`);
          error.status = response.status;
          error.data = data;
          throw error;
        }

        return data;
      } catch (err) {
        lastError = err;
        console.error(`[HERMES] ${requestId} Attempt ${attempt} failed:`, err.message);

        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError;
  }

  async get(path, options = {}) {
    return this.request("GET", path, null, options);
  }

  async post(path, body, options = {}) {
    return this.request("POST", path, body, options);
  }

  async healthCheck() {
    try {
      const response = await this.get("/health");
      console.log("[HERMES] Health check passed:", response);
      return true;
    } catch (err) {
      console.error("[HERMES] Health check failed:", err.message);
      throw new Error(`Hermes API server unavailable: ${err.message}`);
    }
  }

  async createSession() {
    const sessions = await this.getSessions({ limit: 1 });
    if (sessions && sessions.data && sessions.data.length > 0) {
      return { sessionId: sessions.data[0].id };
    }
    if (sessions && sessions.length > 0) {
      return { sessionId: sessions[0].id };
    }
    throw new Error("No existing sessions found. Create one via Hermes dashboard first.");
  }

  async chat(sessionId, input, systemPrompt = null) {
    const body = { input };
    if (systemPrompt) body.system = systemPrompt;
    return this.post(`/api/sessions/${sessionId}/chat`, body);
  }

  async chatStream(sessionId, input, systemPrompt = null, onChunk) {
    const body = { input, stream: true };
    if (systemPrompt) body.system = systemPrompt;

    const url = `${this.baseUrl}/api/sessions/${sessionId}/chat`;
    const headers = this.getHeaders();
    const requestId = randomUUID().slice(0, 8);

    let lastError;
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (onChunk) onChunk(parsed);
            } catch {
              if (onChunk) onChunk({ text: trimmed });
            }
          }
        }

        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            if (onChunk) onChunk(parsed);
          } catch {
            if (onChunk) onChunk({ text: buffer.trim() });
          }
        }

        return;
      } catch (err) {
        lastError = err;
        console.error(`[HERMES] ${requestId} Stream attempt ${attempt} failed:`, err.message);
        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError;
  }

  async getMessages(sessionId, limit = 10) {
    return this.get(`/api/sessions/${sessionId}/messages?limit=${limit}`);
  }

  async getSessions(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit);
    if (params.offset) query.set("offset", params.offset);
    const queryString = query.toString();
    return this.get(`/api/sessions${queryString ? `?${queryString}` : ""}`);
  }

  async getModels() {
    return this.get("/api/models");
  }
}

let hermesClientInstance = null;

export function getHermesClient() {
  if (!hermesClientInstance) {
    hermesClientInstance = new HermesClient();
  }
  return hermesClientInstance;
}

export default HermesClient;