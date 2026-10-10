import { getHermesClient } from "../hermes/HermesClient.js";

export class SessionsService {
  constructor(htmlRenderer) {
    this.htmlRenderer = htmlRenderer;
    this.hermesClient = getHermesClient();
  }

  async getSessions(limit = 20, offset = 0) {
    const response = await this.hermesClient.getSessions({ limit, offset });
    const sessions = response.sessions || response.data || response || [];
    return sessions;
  }

  async getSessionsHTML(limit = 20, offset = 0) {
    const sessions = await this.getSessions(limit, offset);
    return this.htmlRenderer.renderSessionsList(sessions, { limit, offset });
  }

  async createSession() {
    const sessionTitle = `Chat ${new Date().toLocaleString()} ${Math.random().toString(36).slice(2, 8)}`;
    const result = await this.hermesClient.createSession(sessionTitle);
    const sessionId = result.sessionId;
    return {
      sessionId,
      title: sessionTitle,
      createdAt: Date.now(),
    };
  }
}

export default SessionsService;