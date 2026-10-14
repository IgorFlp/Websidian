import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { config } from "../config/index.js";

const DATA_DIR = config.dataDir;
const PRESETS_FILE = config.presetsFile;

export interface PresetFile {
  path: string;
  order: number;
}

export interface Preset {
  id: string;
  name: string;
  files: PresetFile[];
  vaultIndex: number;
  order: number;
  createdAt: string;
}

export interface PresetsData {
  presets: Preset[];
}

export class PresetsService {
  private presetsFile: string;

  constructor(presetsFile?: string) {
    this.presetsFile = presetsFile || PRESETS_FILE;
  }

  private loadPresets(): PresetsData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(this.presetsFile)) {
        fs.writeFileSync(this.presetsFile, JSON.stringify({ presets: [] }, null, 2));
        return { presets: [] };
      }
      const data = fs.readFileSync(this.presetsFile, "utf8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Error loading presets:", e);
      return { presets: [] };
    }
  }

  private savePresets(presets: Preset[]): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(this.presetsFile, JSON.stringify({ presets }, null, 2));
    } catch (e) {
      console.error("Error saving presets:", e);
    }
  }

  getAll(): Preset[] {
    const data = this.loadPresets();
    return data.presets;
  }

  create(name: string, files: string[] = [], vaultIndex = 0, order?: number): Preset {
    if (!name || !name.trim()) {
      throw new Error("Name is required");
    }

    const data = this.loadPresets();
    const maxOrder = data.presets.length > 0 ? Math.max(...data.presets.map((p) => p.order || 0)) : 0;

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: name.trim(),
      files: files.map((f, i) => ({ path: f, order: i })),
      vaultIndex: vaultIndex !== undefined ? vaultIndex : 0,
      order: order !== undefined ? order : maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    data.presets.push(newPreset);
    this.savePresets(data.presets);
    return newPreset;
  }

  update(id: string, updates: { name?: string; vaultIndex?: number; order?: number }): Preset | null {
    const data = this.loadPresets();
    const index = data.presets.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    const preset = data.presets[index];
    if (!preset) return null;
    if (updates.name !== undefined) preset.name = updates.name.trim();
    if (updates.vaultIndex !== undefined) preset.vaultIndex = updates.vaultIndex;
    if (updates.order !== undefined) preset.order = updates.order;

    this.savePresets(data.presets);
    return data.presets[index] ?? null;
  }

  delete(id: string): boolean {
    const data = this.loadPresets();
    const index = data.presets.findIndex((p) => p.id === id);
    if (index === -1) {
      return false;
    }
    data.presets.splice(index, 1);
    this.savePresets(data.presets);
    return true;
  }

  reorder(presetIds: string[]): void {
    if (!Array.isArray(presetIds)) {
      throw new Error("presetIds array required");
    }

    const data = this.loadPresets();
    presetIds.forEach((id, index) => {
      const preset = data.presets.find((p) => p.id === id);
      if (preset) preset.order = index;
    });
    this.savePresets(data.presets);
  }

  updateFiles(id: string, files: { path: string; order?: number }[]): Preset | null {
    if (!Array.isArray(files)) {
      throw new Error("files array required");
    }

    const data = this.loadPresets();
    const index = data.presets.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    const preset = data.presets[index];
    if (!preset) return null;
    preset.files = files.map((f, i) => ({
      path: f.path,
      order: f.order !== undefined ? f.order : i,
    }));

    this.savePresets(data.presets);
    return data.presets[index] ?? null;
  }
}

export default PresetsService;