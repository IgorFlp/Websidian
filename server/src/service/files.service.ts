import fs from "fs";
import path from "path";
import { config } from "../config/index.js";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".obsidian",
  ".trash",
]);

export interface FileNode {
  type: "folder" | "file";
  name: string;
  path: string;
  children?: FileNode[];
  size?: number;
  modified?: number;
}

export interface GetFilesOptions {
  flat?: boolean;
  vaultIndex?: number;
}

export class FilesService {
  private vaultPaths: string[];

  constructor(vaultPaths?: string[]) {
    this.vaultPaths = vaultPaths || config.vaultPath.split(",");
  }

  getVaultPath(vaultIndex = 0): string {
    return this.vaultPaths[vaultIndex] ?? this.vaultPaths[0] ?? "";
  }

  getFiles(options: GetFilesOptions = {}): { files: FileNode[] } {
    const { flat = false, vaultIndex = 0 } = options;
    const vaultPath = this.getVaultPath(vaultIndex);

    function buildTree(dir: string, basePath: string): FileNode[] {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return [];
      }

      const nodes: FileNode[] = [];

      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) {
          continue;
        }

        const full = path.join(dir, entry.name);
        const relPath = path.relative(basePath, full);

        if (entry.isDirectory()) {
          const children = buildTree(full, basePath);
          if (children.length > 0) {
            nodes.push({
              type: "folder",
              name: entry.name,
              path: relPath,
              children,
            });
          }
        } else if (entry.name.endsWith(".md") || entry.name.endsWith(".pdf")) {
          const stat = fs.statSync(full);
          nodes.push({
            type: "file",
            name: entry.name,
            path: relPath,
            size: stat.size,
            modified: stat.mtimeMs,
          });
        }
      }

      return nodes;
    }

    if (flat) {
      const allFiles: FileNode[] = [];
      function scanFlat(dir: string) {
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }

        for (const entry of entries) {
          if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) {
            continue;
          }

          const full = path.join(dir, entry.name);
          const relPath = path.relative(vaultPath, full);

          if (entry.isDirectory()) {
            scanFlat(full);
          } else if (entry.name.endsWith(".md") || entry.name.endsWith(".pdf")) {
            const stat = fs.statSync(full);
            allFiles.push({
              type: "file",
              name: entry.name,
              path: relPath,
              size: stat.size,
              modified: stat.mtimeMs,
            });
          }
        }
      }
      scanFlat(vaultPath);
      return { files: allFiles };
    }

    const files = buildTree(vaultPath, vaultPath);
    return { files };
  }

  getFileContent(filePath: string, vaultIndex = 0): { content: string; path: string } {
    const vaultPath = this.getVaultPath(vaultIndex);
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(vaultPath, safePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error("File not found");
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return { content, path: filePath };
  }

  downloadFile(filePath: string, vaultIndex = 0): { fullPath: string; fileName: string } {
    const vaultPath = path.resolve(this.getVaultPath(vaultIndex));
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(vaultPath, safePath);

    if (!fullPath.startsWith(vaultPath) || !fs.existsSync(fullPath)) {
      throw new Error("File not found");
    }

    const fileName = path.basename(fullPath);
    return { fullPath, fileName };
  }
}

export default FilesService;