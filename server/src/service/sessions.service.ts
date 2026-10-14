import { HermesClient, getHermesClient } from "./hermes.client.js";
import { HTMLRenderer } from "./html.renderer.js";

export class SessionsService {
  private htmlRenderer: HTMLRenderer;
  private hermesClient: HermesClient;

  constructor(htmlRenderer: HTMLRenderer, hermesClient?: HermesClient) {
    this.htmlRenderer = htmlRenderer;
    this.hermesClient = hermesClient || getHermesClient();
  }

  async getSessions(limit = 20, offset = 0): Promise<unknown[]> {
    const response = await this.hermesClient.getSessions({ limit, offset });
    const sessions = (response as { sessions?: unknown[]; data?: unknown[] })?.sessions ||
      (response as { sessions?: unknown[]; data?: unknown[] })?.data ||
      (response as unknown[]) ||
      [];
    return sessions;
  }

  async getSessionsHTML(limit = 20, offset = 0): Promise<string> {
    const sessions = await this.getSessions(limit, offset);
    return this.htmlRenderer.renderSessionsList(sessions, { limit, offset });
  }

  async createSession(): Promise<{ sessionId: string; title: string; createdAt: number }> {
    const sessionTitle = `Chat ${new Date().toLocaleString()} ${Math.random().toString(36).slice(2, 8)}`;
    const result = await this.hermesClient.createSession(sessionTitle);
    const sessionId = (result as { sessionId: string }).sessionId;
    return {
      sessionId,
      title: sessionTitle,
      createdAt: Date.now(),
    };
  }
}

export default SessionsService;