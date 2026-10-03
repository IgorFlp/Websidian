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

  async chat(sessionId, input) {
    return this.post(`/api/sessions/${sessionId}/chat`, { input });
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