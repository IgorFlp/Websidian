import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..", "..", "..");

dotenv.config({ path: path.join(rootDir, ".env") });

export interface Config {
  vaultPath: string;
  sessionSecret: string;
  appUser: string;
  appPassword: string;
  hermesApiUrl: string;
  hermesApiKey: string;
  speachesApiUrl: string;
  speachesApiKey: string;
  kokoroApiUrl: string;
  kokoroAutoPlay: boolean;
  sttModel: string;
  sttLanguage: string;
  ttsModel: string;
  ttsVoice: string;
  ttsLanguage: string;
  ttsSpeed: number;
  audioMaxEntries: number;
  dataDir: string;
  publicDir: string;
  presetsFile: string;
  port: number;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new Error(`Invalid integer for ${key}: ${value}`);
  return parsed;
}

function getEnvBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value !== "false" && value !== "0";
}

function getEnvFloat(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) throw new Error(`Invalid float for ${key}: ${value}`);
  return parsed;
}

export const config: Config = {
  vaultPath: getEnv("VAULT_PATH", "/vault"),
  sessionSecret: getEnv("SESSION_SECRET"),
  appUser: getEnv("APP_USER"),
  appPassword: getEnv("APP_PASSWORD"),
  hermesApiUrl: getEnv("HERMES_API_URL", "http://localhost:8642").replace(/\/$/, ""),
  hermesApiKey: getEnv("HERMES_API_KEY", ""),
  speachesApiUrl: getEnv("SPEACHES_API_URL", "http://localhost:8000"),
  speachesApiKey: getEnv("SPEACHES_API_KEY", ""),
  kokoroApiUrl: getEnv("KOKORO_API_URL", ""),
  kokoroAutoPlay: getEnvBool("KOKORO_AUTO_PLAY", true),
  sttModel: getEnv("STT_MODEL", "adminbr/whisper-small-pt-ct2"),
  sttLanguage: getEnv("STT_LANGUAGE", "pt"),
  ttsModel: getEnv("TTS_MODEL", "speaches-ai/Kokoro-82M-v1.0-ONNX"),
  ttsVoice: getEnv("TTS_VOICE", "pm_alex"),
  ttsLanguage: getEnv("TTS_LANGUAGE", "pt"),
  ttsSpeed: getEnvFloat("TTS_SPEED", 1.0),
  audioMaxEntries: getEnvInt("AUDIO_MAX_ENTRIES", 10),
  dataDir: getEnv("DATA_DIR", "/data"),
  publicDir: getEnv("PUBLIC_DIR", "/public"),
  presetsFile: getEnv("PRESETS_FILE", "/data/presets.json"),
  port: getEnvInt("PORT", 9091),
};

export type { Config as ConfigType };