import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import ffprobeStatic from "ffprobe-static";

const MANAGED_TEMP_DIR = path.join(os.tmpdir(), "hermes-api-audio");
const MAX_ENTRIES = parseInt(process.env.AUDIO_MAX_ENTRIES || "10", 10);
const HERMES_TEMP_PATTERN = /^hermes-api-.*\.mp3$/;

function ensureManagedTempDir() {
  if (!fs.existsSync(MANAGED_TEMP_DIR)) {
    fs.mkdirSync(MANAGED_TEMP_DIR, { recursive: true });
  }
}

function getAudioDuration(filePath) {
  return new Promise((resolve) => {
    const ffprobePath = ffprobeStatic.path;
    const args = [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ];

    const proc = spawn(ffprobePath, args);
    let output = "";
    let error = "";

    proc.stdout.on("data", (data) => { output += data.toString(); });
    proc.stderr.on("data", (data) => { error += data.toString(); });

    proc.on("close", (code) => {
      if (code === 0 && output.trim()) {
        resolve(Math.round(parseFloat(output.trim())));
      } else {
        console.warn(`ffprobe failed for ${filePath}: ${error}`);
        resolve(0);
      }
    });

    proc.on("error", (err) => {
      console.warn(`ffprobe error for ${filePath}: ${err.message}`);
      resolve(0);
    });
  });
}

function cleanupOrphanedHermesFiles() {
  const tempDir = os.tmpdir();
  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (HERMES_TEMP_PATTERN.test(file)) {
        const filePath = path.join(tempDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`[AUDIO] Cleaned up orphaned file: ${file}`);
        } catch (err) {
          console.warn(`[AUDIO] Failed to delete orphaned file ${file}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.warn("[AUDIO] Failed to scan temp dir for cleanup:", err.message);
  }
}

export class AudioFileManager {
  constructor() {
    this.index = [];
    ensureManagedTempDir();
    cleanupOrphanedHermesFiles();
  }

  async addFromHermesTemp(hermesTempPath, text) {
    if (!fs.existsSync(hermesTempPath)) {
      throw new Error(`Hermes temp file not found: ${hermesTempPath}`);
    }

    const id = randomUUID().slice(0, 8);
    const managedFileName = `hermes-api-${id}.mp3`;
    const managedPath = path.join(MANAGED_TEMP_DIR, managedFileName);

    fs.copyFileSync(hermesTempPath, managedPath);

    try {
      fs.unlinkSync(hermesTempPath);
    } catch (err) {
      console.warn(`[AUDIO] Could not delete Hermes temp file: ${err.message}`);
    }

    const duration = await getAudioDuration(managedPath);

    const entry = {
      id,
      path: managedPath,
      text: text || "",
      timestamp: Date.now(),
      duration,
    };

    this.index.push(entry);

    if (this.index.length > MAX_ENTRIES) {
      const evicted = this.index.shift();
      try {
        fs.unlinkSync(evicted.path);
        console.log(`[AUDIO] Evicted oldest audio: ${evicted.id}`);
      } catch (err) {
        console.warn(`[AUDIO] Failed to delete evicted file: ${err.message}`);
      }
    }

    console.log(`[AUDIO] Added audio: ${id}, duration: ${duration}s, total: ${this.index.length}`);
    return entry;
  }

  get(id) {
    return this.index.find((entry) => entry.id === id) || null;
  }

  getAll() {
    return [...this.index].sort((a, b) => b.timestamp - a.timestamp);
  }

  remove(id) {
    const index = this.index.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      const entry = this.index[index];
      try {
        fs.unlinkSync(entry.path);
      } catch (err) {
        console.warn(`[AUDIO] Failed to delete file for ${id}:`, err.message);
      }
      this.index.splice(index, 1);
      return true;
    }
    return false;
  }

  clear() {
    for (const entry of this.index) {
      try {
        fs.unlinkSync(entry.path);
      } catch (err) {
        console.warn(`[AUDIO] Failed to delete file ${entry.id}:`, err.message);
      }
    }
    this.index = [];
  }

  getManagedTempDir() {
    return MANAGED_TEMP_DIR;
  }
}

export const audioFileManager = new AudioFileManager();
export default AudioFileManager;