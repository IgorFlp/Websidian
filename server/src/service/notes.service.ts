import fs from "fs";
import path from "path";
import { config } from "../config/index.js";

export interface NewNoteOptions {
  noteName: string;
  timestamp: string;
  text: string;
  vaultIndex?: number;
}

export interface NewNoteResult {
  ok: string;
  path?: string;
}

export class NotesService {
  private vaultPaths: string[];

  constructor(vaultPaths?: string[]) {
    this.vaultPaths = vaultPaths || config.vaultPath.split(",");
  }

  getVaultPath(vaultIndex = 0): string {
    return this.vaultPaths[vaultIndex] ?? this.vaultPaths[0] ?? "";
  }

  createOrAppendNote(options: NewNoteOptions): NewNoteResult {
    const { noteName, timestamp, text, vaultIndex = 0 } = options;
    const safeNoteName = noteName.replace(/[^a-zA-Z0-9-_ ]/g, "");
    const vaultPath = this.getVaultPath(vaultIndex);
    const fullPath = path.join(vaultPath, "Dailynotes", `${safeNoteName}.md`);

    if (fs.existsSync(fullPath)) {
      fs.appendFileSync(fullPath, `\n ## ${timestamp}`);
      fs.appendFileSync(fullPath, `\n ${text}\n`);
      return { ok: `Adicionado a nota existente no arquivo ${noteName}.md`, path: fullPath };
    } else {
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, `## ${timestamp}\n${text}`);
      return { ok: `Arquivo criado com nova nota em ${noteName}.md`, path: fullPath };
    }
  }
}

export default NotesService;