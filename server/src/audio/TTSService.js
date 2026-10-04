import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "..", "..", "..", "public");
const AUDIOS_DIR = path.join(PUBLIC_DIR, "audios");
const MAX_ENTRIES = parseInt(process.env.AUDIO_MAX_ENTRIES || "10", 10);

function ensureAudiosDir() {
  if (!fs.existsSync(AUDIOS_DIR)) {
    fs.mkdirSync(AUDIOS_DIR, { recursive: true });
  }
}

function cleanupAudiosDir() {
  try {
    const files = fs.readdirSync(AUDIOS_DIR);
    for (const file of files) {
      if (file.startsWith("tts-") && file.endsWith(".mp3")) {
        try {
          fs.unlinkSync(path.join(AUDIOS_DIR, file));
        } catch (err) {
          console.warn(`[TTS] Failed to clean ${file}:`, err.message);
        }
      }
    }
    console.log("[TTS] Cleaned audios directory on startup");
  } catch (err) {
    console.warn("[TTS] Failed to clean audios directory:", err.message);
  }
}

async function generateTTS(text) {
  const response = await fetch("https://api.puter.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      voice: "pt-BR",
      model: "tts-1",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Puter TTS error: ${response.status} ${error}`);
  }

  return response.arrayBuffer();
}

export class TTSService {
  constructor() {
    this.index = [];
    ensureAudiosDir();
    cleanupAudiosDir();
  }

  async generateAndSave(text) {
    if (!text || !text.trim()) {
      return null;
    }

    try {
      console.log("[TTS] Generating audio for text:", text.slice(0, 50));
      const audioBuffer = await generateTTS(text);

      const id = randomUUID().slice(0, 8);
      const fileName = `tts-${id}.mp3`;
      const filePath = path.join(AUDIOS_DIR, fileName);

      fs.writeFileSync(filePath, Buffer.from(audioBuffer));

      const entry = {
        id,
        path: filePath,
        url: `/audios/${fileName}`,
        text: text.slice(0, 100),
        timestamp: Date.now(),
      };

      this.index.push(entry);

      if (this.index.length > MAX_ENTRIES) {
        const evicted = this.index.shift();
        try {
          fs.unlinkSync(evicted.path);
          console.log(`[TTS] Evicted oldest audio: ${evicted.id}`);
        } catch (err) {
          console.warn(`[TTS] Failed to delete evicted file: ${err.message}`);
        }
      }

      console.log(`[TTS] Generated audio: ${id}, url: ${entry.url}`);
      return entry;
    } catch (err) {
      console.error("[TTS] Failed to generate audio:", err.message);
      return null;
    }
  }

  get(id) {
    return this.index.find((entry) => entry.id === id) || null;
  }

  getAll() {
    return [...this.index].sort((a, b) => b.timestamp - a.timestamp);
  }

  clear() {
    for (const entry of this.index) {
      try {
        fs.unlinkSync(entry.path);
      } catch (err) {
        console.warn(`[TTS] Failed to delete file ${entry.id}:`, err.message);
      }
    }
    this.index = [];
  }
}

export const ttsService = new TTSService();
export default TTSService;