import fs from "fs";
import path from "path";
import { config } from "../config/index.js";

const IGNORED_DIRS = [".obsidian", ".trash", ".git", "node_modules"];

export interface ParsedTask {
  text: string;
  done: boolean;
  due: string | null;
  scheduled: string | null;
  doneDate: string | null;
  tags: string[];
  recurring: boolean;
  recurringRule: string | null;
  displayText: string;
}

export interface Task extends ParsedTask {
  file: string;
  line: number;
  vaultIndex: number;
}

export interface ToggleTaskOptions {
  file: string;
  line: number;
  vaultIndex: number;
}

export class TasksService {
  private vaultPaths: string[];

  constructor(vaultPaths?: string[]) {
    this.vaultPaths = vaultPaths || config.vaultPath.split(",");
  }

  getVaultPath(vaultIndex = 0): string {
    return this.vaultPaths[vaultIndex] ?? this.vaultPaths[0] ?? "";
  }

parseTask(line: string): ParsedTask | null {
    if (!line || typeof line !== "string") return null;

    const task: ParsedTask = {
      text: "",
      done: false,
      due: null,
      scheduled: null,
      doneDate: null,
      tags: [],
      recurring: false,
      recurringRule: null,
      displayText: "",
    };

    task.done = line.indexOf("[x]") !== -1;

    const rawText = line.replace(/- \[[ x]\]\s*/, "");
    task.text = rawText;

    const tagMatches = rawText.match(/#([a-zA-Z0-9_-]+)/g);
    task.tags = tagMatches
      ? tagMatches.map((t) => `#${t.substring(1)}`)
      : [];

    const dueMatch = rawText.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
    task.due = dueMatch?.[1] ?? null;

    const schedMatch = rawText.match(/⏳\s*(\d{4}-\d{2}-\d{2})/);
    task.scheduled = schedMatch?.[1] ?? null;

    const doneMatch = rawText.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
    task.doneDate = doneMatch?.[1] ?? null;

    task.recurring = rawText.indexOf("🔁") !== -1;
    if (task.recurring) {
      const recurMatch = rawText.match(/🔁\s*(.*?)(?:\s*📅|\s*⏳|\s*✅|$)/);
      task.recurringRule = recurMatch?.[1]?.trim() ?? null;
    }

    const displayText = rawText
      .replace(/#[a-zA-Z0-9_-]+/g, "")
      .replace(/🔁.*|📅.*|⏳.*|✅.*/g, "")
      .trim();

    task.displayText = displayText;
    return task;
  }

  scanTasks(this: TasksService, vaultIndex = 0, pathPrefix = ""): Task[] {
    const tasks: Task[] = [];
    const vaultPath = this.getVaultPath(vaultIndex);
    const scanPath = pathPrefix ? path.join(vaultPath, pathPrefix) : vaultPath;

    const self: TasksService = this;

    function scan(dir: string) {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (IGNORED_DIRS.includes(entry.name) || entry.name.startsWith(".")) {
          continue;
        }

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scan(full);
          continue;
        }

        if (!entry.name.endsWith(".md")) continue;

        const lines = fs.readFileSync(full, "utf8").split("\n");

        lines.forEach((line: string, index: number) => {
          if (!line.match(/- \[[ x]\]/)) return;

          const parsed = self.parseTask(line);
          if (!parsed) return;

          tasks.push({
            ...parsed,
            file: path.relative(vaultPath, full),
            line: index,
            vaultIndex,
          });
        });
      }
    }

    scan(scanPath);
    return tasks;
  }

  toggleTask(options: ToggleTaskOptions): { ok: boolean; task?: Task } {
    const { file, line, vaultIndex = 0 } = options;
    const vaultPath = this.getVaultPath(vaultIndex);
    const fullPath = path.join(vaultPath, file);

    if (!fs.existsSync(fullPath)) {
      throw new Error("File not found");
    }

    const content = fs.readFileSync(fullPath, "utf8").split("\n");
    const originalLine = content[line] ?? "";

    if (!originalLine.match(/- \[[ x]\]/)) {
      throw new Error("Not a task line");
    }

    const wasDone = originalLine.includes("[x]");
    content[line] = wasDone
      ? originalLine.replace("[x]", "[ ]")
      : originalLine.replace("[ ]", "[x]") + ` ✅ ${new Date().toISOString().split("T")[0]}`;

    if (content[line].includes("🔁")) {
      const task = this.parseTask(content[line]);
      if (task && task.recurring) {
        // This would need a CreateTask function - keeping simple for now
      }
    }

    fs.writeFileSync(fullPath, content.join("\n"));

    const parsed = this.parseTask(content[line]);
    if (!parsed) {
      return { ok: true };
    }

    const task: Task = {
      ...parsed,
      file,
      line,
      vaultIndex,
    };

    return { ok: true, task };
  }
}

export default TasksService;