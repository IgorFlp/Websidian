class HTMLRepository {
  constructor() {
    this.repositories = new Map();
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

  getMessages(sessionId) {
    const repo = this.repositories.get(sessionId);
    return repo ? repo.messages : [];
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