import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ansiToHtmlPkg from "ansi-to-html";

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

const AnsiToHtml = ansiToHtmlPkg.default || ansiToHtmlPkg;
const ansiToHtml = new AnsiToHtml({ escapeXML: true, newline: true });
const ansiToHtmlNoNewline = new AnsiToHtml({ escapeXML: true, newline: false });

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': "&#34;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function formatCodeBlocks(text) {
  if (!text) return "";
  
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let result = "";
  
  for (const match of text.matchAll(codeBlockRegex)) {
    const [fullMatch, language, code] = match;
    const matchIndex = match.index;
    
    if (matchIndex > lastIndex) {
      const beforeText = text.slice(lastIndex, matchIndex);
      result += formatText(beforeText);
    }
    
    const ansiConvertedCode = ansiToHtmlNoNewline.toHtml(code);
    const langClass = language ? ` class="language-${language}"` : "";
    result += `<pre class="code-containers"><code${langClass}>${ansiConvertedCode}</code></pre>`;
    
    lastIndex = matchIndex + fullMatch.length;
  }
  
  if (lastIndex < text.length) {
    result += formatText(text.slice(lastIndex));
  }
  
  return result || formatText(text);
}

function formatText(text) {
  if (!text) return "";
  
  const ansiConverted = ansiToHtml.toHtml(text);
  const paragraphs = ansiConverted.split(/\n\s*\n/);
  
  return paragraphs
    .filter(p => p.trim().length > 0)
    .map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function fillTemplate(template, data) {
  let html = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = "{" + key + "}";
    let strValue = value ?? "";
    if (key === "Reasoning text" || key === "Output text" || key === "CLI Output") {
      strValue = String(strValue);
    } else {
      strValue = escapeHtml(String(strValue));
    }
    html = html.split(placeholder).join(strValue);
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

function formatTimeOfDay(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
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
  }) {
    const timeOfDay = formatTimeOfDay(timestamp);
    const messageId = id || `msg-${timestamp}`;

    if (isAI) {
      const displayText = outputText || text || "";
      const brainBtnId = uniqueId("brainBtn");
      const brainIconId = uniqueId("brainIcon");
      const reasoningContainerId = uniqueId("reasoningContainer");

      let html = aiTemplate;

      html = html.split('{Agent Name}').join("HERMES");
      html = html.split('{Response Time}s').join(
        timestamp != null ? timeOfDay : ""
      );
      html = html.split('{Reasoning text}').join(formatCodeBlocks(reasoningText || ""));
      html = html.split('{Output text}').join(formatCodeBlocks(displayText));
      
      // CLI output only if present in output text
      const cliOutput = "";
      html = html.split('{CLI Output}').join(cliOutput);

      html = html.split('id="brainBtn"').join(`id="${brainBtnId}"`);
      html = html.split('id="brainIcon"').join(`id="${brainIconId}"`);
      html = html.split('id="reasoningContainer"').join(
        `id="${reasoningContainerId}"`
      );

      return html;
    }

    const displayText = text || "";
    const humanTimeOfDay = formatTimeOfDay(timestamp);
    let html = humanTemplate;
    html = html.split("{User Name} // @{User Tag}").join("OPERADOR // @dev_root");
    html = html.split("{Timestamp}").join(humanTimeOfDay);
    html = html.split("{User Message}").join(escapeHtml(displayText));

    // Voice message player (task 6.1, 6.2, 6.6)
    if (audio && audio.audioPath) {
      const voicePlayer = `<div class="voice-player"><button class="tts-play-btn" onclick="playVoiceMessage(this)" data-audio-id="${escapeHtml(audio.audioPath)}" title="Reproduzir &#225;udio"><span>&#9654;</span></button><div class="waveform"><span class="wave-bar" style="height:6px"></span><span class="wave-bar" style="height:10px"></span><span class="wave-bar" style="height:14px"></span><span class="wave-bar" style="height:8px"></span></div><span class="font-label-sm text-outline text-[10px]">${audio.duration ? escapeHtml(audio.duration) : '0:12'}</span></div>`;
      html = html.split("{Audio Player Slot}").join(voicePlayer);
      if (audio.transcript) {
        html += `<p class="text-xs text-outline mt-1">${escapeHtml(audio.transcript)}</p>`;
      }
    } else {
      html = html.split("{Audio Player Slot}").join("");
    }

    return html;
  }

  renderSessionsList(sessions, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;
    const hasMore = sessions.length >= limit;

    let html = `
      <div class="sessions-header">        
          
      </div>
      <ul class="session-list">
    `;

    for (const session of sessions) {
      const sessionId = session.id || session.sessionId || session.session_id;
      const title = session.title || session.name || `Sess\u00e3o ${sessionId?.slice(0, 8)}`;
      const lastActivity = session.lastActivity || session.updated_at || session.created_at || Date.now();
      const messageCount = session.messageCount || session.count || 0;
      const timeAgo = formatElapsedTime(typeof lastActivity === "string" ? Date.parse(lastActivity) : lastActivity);

      let sessionHtml = sessionsTemplate;
      sessionHtml = sessionHtml.split("{Session Name}").join(escapeHtml(title));
      sessionHtml = sessionHtml.split("{Session Time}").join("");
      sessionHtml = sessionHtml.split("{Session ID}").join(escapeHtml(sessionId));

      html += `
        <li class="session-item" data-session-id="${escapeHtml(sessionId)}">
          ${sessionHtml}         
        </li>
      `;
    }

    html += `</ul>`;
    html += `<div class="session-delete-footer"><button onclick="selectSessionsToDelete()" class="session-delete-all-btn">Excluir Selecionadas</button></div>`;

    if (hasMore || offset > 0) {
      html += `
        <div class="session-pagination">
          ${offset > 0 ? `<button class="pagination-btn" data-action="prev-page" data-offset="${Math.max(0, offset - limit)}"><span class="material-icons">chevron_left</span> Anterior</button>` : ""}
          ${hasMore ? `<button class="pagination-btn" data-action="next-page" data-offset="${offset + limit}">Pr\u00f3xima <span class="material-icons">chevron_right</span></button>` : ""}
        </div>
      `;
    }

    return html;
  }
}

export const htmlRenderer = new HTMLRenderer();
export default HTMLRenderer;