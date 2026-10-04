import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "..", "..", "..", "public");
const COMPONENTS_DIR = path.join(PUBLIC_DIR, "components");

const aiTemplate = fs.readFileSync(
  path.join(COMPONENTS_DIR, "AI-message-template.html"),
  "utf8"
);
const humanTemplate = fs.readFileSync(
  path.join(COMPONENTS_DIR, "Human-message-template.html"),
  "utf8"
);
const sessionsTemplate = fs.readFileSync(
  path.join(COMPONENTS_DIR, "sessions-template.html"),
  "utf8"
);

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function fillTemplate(template, data) {
  let html = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = "{" + key + "}";
    html = html.split(placeholder).join(escapeHtml(String(value ?? "")));
  }
  return html;
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

function uniqueId(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10);
}

export class HTMLRenderer {
  constructor() {
    this.processStartTime = Date.now();
  }

  setProcessStartTime(time) {
    this.processStartTime = time;
  }

  renderChatMessage({
    id,
    isAI,
    text,
    timestamp,
    audio = null,
    isLastAI = false,
    reasoningText = null,
    outputText = null,
    ttsAudioPath = null,
    responseTime = null,
  }) {
    const elapsed = formatElapsedTime(timestamp);
    const messageId = id || `msg-${timestamp}`;

    if (isAI) {
      const displayText = outputText || text || "";
      const brainBtnId = uniqueId("brainBtn");
      const brainIconId = uniqueId("brainIcon");
      const reasoningContainerId = uniqueId("reasoningContainer");

      let html = aiTemplate;

      html = html.split('{Agent Name}').join("HERMES");
      html = html.split('{Response Time}s').join(
        responseTime != null ? `${responseTime}s` : ""
      );
      html = html.split('{Reasoning text}').join(reasoningText || "");
      html = html.split('{Output text}').join(displayText);
      
      // CLI output only if present in output text
      const cliOutput = "";
      html = html.split('{CLI Output}').join(cliOutput);
      
      html = html.split('{TTS Button Title}').join("Reproduzir Síntese Vocal");
      html = html.split('{TTS Audio Path}').join(ttsAudioPath || "");
      html = html.split('{tts_audio_path}').join(ttsAudioPath || "");

      html = html.split('id="brainBtn"').join(`id="${brainBtnId}"`);
      html = html.split('id="brainIcon"').join(`id="${brainIconId}"`);
      html = html.split('id="reasoningContainer"').join(
        `id="${reasoningContainerId}"`
      );

      const script = `
<script>
document.getElementById('${brainBtnId}').addEventListener('click', function() {
    var rc = document.getElementById('${reasoningContainerId}');
    var icon = document.getElementById('${brainIconId}');
    rc.classList.toggle('collapsed');
    rc.classList.toggle('expanded');
    icon.classList.toggle('expanded');
});
</script>`;

      html = html + script;

      return html;
    }

    const displayText = text || "";
    let html = humanTemplate;
    html = html.split("{User Name} // @{User Tag}").join("OPERADOR // @dev_root");
    html = html.split("{Timestamp}").join(elapsed);
    html = html.split("{User Message}").join(escapeHtml(displayText));

    return html;
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

      let sessionHtml = sessionsTemplate;
      sessionHtml = sessionHtml.split("{Session Name}").join(escapeHtml(title));
      sessionHtml = sessionHtml.split("{Session Time}").join(escapeHtml(timeAgo));
      sessionHtml = sessionHtml.split("{Session ID}").join(escapeHtml(sessionId));

      html += `
        <li class="session-item" data-session-id="${escapeHtml(sessionId)}">
          ${sessionHtml}         
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