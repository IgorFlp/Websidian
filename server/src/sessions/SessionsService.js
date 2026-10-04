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

  async createSession(title = null) {
    const result = await this.hermesClient.createSession();
    const sessionId = result.sessionId;
    return {
      sessionId,
      title: title || `Chat ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
    };
  }
}

export default SessionsService;