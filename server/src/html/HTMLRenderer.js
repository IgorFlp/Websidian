function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function formatElapsedTime(timestamp) {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ${diffSec % 60}s`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ${diffMin % 60}m`;
}

function renderWaveformBars() {
  const bars = 8;
  let html = '<div class="waveform">';
  for (let i = 0; i < bars; i++) {
    const height = 20 + Math.floor(Math.random() * 60);
    html += `<div class="waveform-bar" style="height: ${height}%"></div>`;
  }
  html += '</div>';
  return html;
}

export class HTMLRenderer {
  constructor() {
    this.processStartTime = Date.now();
  }

  setProcessStartTime(time) {
    this.processStartTime = time;
  }

  renderChatMessage({ id, isAI, text, timestamp, audio = null, isLastAI = false }) {
    const agentIndicator = isAI ? "☤ Hermes" : "● User";
    const agentClass = isAI ? "ai-message" : "user-message";
    const elapsed = formatElapsedTime(timestamp);
    const escapedText = escapeHtml(text);
    const messageId = id || `msg-${timestamp}`;

    let audioPlayerHtml = "";
    if (isAI && audio) {
      const autoplayAttr = isLastAI ? ' autoplay' : '';
      audioPlayerHtml = `
        <div class="audio-player">
          <button class="audio-play-btn" data-audio-id="${audio.id}"${autoplayAttr}>
            <span class="material-icons">play_arrow</span>
          </button>
          <div class="audio-info">
            <span class="audio-title">Síntese Vocal Agêntica</span>
            <span class="audio-meta">${audio.duration}s • Hermes Neural Voxtral</span>
          </div>
          ${renderWaveformBars()}
          <audio id="audio-${audio.id}" src="${audio.url}" preload="metadata"></audio>
        </div>
      `;
    }

    return `
      <div class="message-block ${agentClass}" id="${messageId}" data-timestamp="${timestamp}" data-is-ai="${isAI}">
        <div class="message-header">
          <span class="agent-indicator">${escapeHtml(agentIndicator)}</span>
          <span class="elapsed-time">${elapsed}</span>
        </div>
        <div class="message-body">${escapedText}</div>
        ${audioPlayerHtml}
      </div>
    `;
  }

  renderSessionsList(sessions, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;
    const hasMore = sessions.length >= limit;

    let html = `
      <div class="sessions-header">
        <button class="new-session-btn" data-action="new-session">
          <span class="material-icons">add</span> Nova Sessão
        </button>
      </div>
      <ul class="session-list">
    `;

    for (const session of sessions) {
      const sessionId = session.id || session.sessionId || session.session_id;
      const title = session.title || session.name || `Sessão ${sessionId?.slice(0, 8)}`;
      const lastActivity = session.lastActivity || session.updated_at || session.created_at || Date.now();
      const messageCount = session.messageCount || session.count || 0;
      const timeAgo = formatElapsedTime(typeof lastActivity === "string" ? Date.parse(lastActivity) : lastActivity);

      html += `
        <li class="session-item" data-session-id="${escapeHtml(sessionId)}">
          <div class="session-info">
            <span class="session-title">${escapeHtml(title)}</span>
            <span class="session-meta">${timeAgo} • ${messageCount} msgs</span>
          </div>
          <button class="session-action-btn" data-action="load-session" data-session-id="${escapeHtml(sessionId)}">
            <span class="material-icons">open_in_new</span>
          </button>
        </li>
      `;
    }

    html += `</ul>`;

    if (hasMore || offset > 0) {
      html += `
        <div class="session-pagination">
          ${offset > 0 ? `<button class="pagination-btn" data-action="prev-page" data-offset="${Math.max(0, offset - limit)}"><span class="material-icons">chevron_left</span> Anterior</button>` : ""}
          ${hasMore ? `<button class="pagination-btn" data-action="next-page" data-offset="${offset + limit}">Próxima <span class="material-icons">chevron_right</span></button>` : ""}
        </div>
      `;
    }

    return html;
  }
}

export const htmlRenderer = new HTMLRenderer();
export default HTMLRenderer;