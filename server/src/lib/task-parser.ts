import { ParsedTask } from "../service/tasks.service.js";

export interface TaskLineMatch {
  lineNumber: number;
  line: string;
  parsed: ParsedTask;
}

const DUE_REGEX = /📅\s*(\d{4}-\d{2}-\d{2})/;
const SCHEDULED_REGEX = /⏳\s*(\d{4}-\d{2}-\d{2})/;
const DONE_REGEX = /✅\s*(\d{4}-\d{2}-\d{2})/;
const TASK_LINE_REGEX = /^- \[[ x]\]\s/;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function findTaskLine(
  fileContent: string,
  taskText: string
): TaskLineMatch | null {
  const lines = fileContent.split("\n");
  let matches: TaskLineMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (!TASK_LINE_REGEX.test(line)) continue;

    const parsed = parseTaskLine(line);
    if (!parsed) continue;

    if (parsed.text === taskText || parsed.displayText === taskText) {
      matches.push({ lineNumber: i, line, parsed });
    }
  }

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error("AMBIGUOUS_MATCH");
  }
  return matches[0] ?? null;
}

export function parseTaskLine(line: string): ParsedTask | null {
  if (!line || typeof line !== "string") return null;

  // Only parse lines that look like tasks
  if (!TASK_LINE_REGEX.test(line)) return null;

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

  const dueMatch = rawText.match(DUE_REGEX);
  task.due = dueMatch?.[1] ?? null;

  const schedMatch = rawText.match(SCHEDULED_REGEX);
  task.scheduled = schedMatch?.[1] ?? null;

  const doneMatch = rawText.match(DONE_REGEX);
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

export function replaceDateInLine(
  line: string,
  dateType: "due" | "scheduled",
  newDate: string
): string {
  if (!DATE_FORMAT_REGEX.test(newDate)) {
    throw new Error("INVALID_DATE");
  }

  const regex = dateType === "due" ? DUE_REGEX : SCHEDULED_REGEX;
  const emoji = dateType === "due" ? "📅" : "⏳";

  if (regex.test(line)) {
    return line.replace(regex, `${emoji} ${newDate}`);
  }

  const taskLineMatch = line.match(/(^- \[[ x]\]\s.+?)(\s*[🔁📅⏳✅]|$)/);
  if (taskLineMatch && taskLineMatch[1]) {
    return line.replace(
      taskLineMatch[0],
      `${taskLineMatch[1]} ${emoji} ${newDate}${taskLineMatch[2] || ""}`
    );
  }

  return `${line} ${emoji} ${newDate}`;
}

export function removeTaskLine(
  fileContent: string,
  lineNumber: number
): string {
  const lines = fileContent.split("\n");
  if (lineNumber < 0 || lineNumber >= lines.length) {
    throw new Error("INVALID_LINE_NUMBER");
  }
  lines.splice(lineNumber, 1);
  return lines.join("\n");
}

export function insertTaskLine(
  fileContent: string,
  referenceLineNumber: number | null,
  newTask: string
): string {
  const lines = fileContent.split("\n");

  if (referenceLineNumber === null) {
    let insertIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line && TASK_LINE_REGEX.test(line)) {
        insertIndex = i + 1;
        break;
      }
    }
    lines.splice(insertIndex, 0, newTask);
    return lines.join("\n");
  }

  if (referenceLineNumber < 0 || referenceLineNumber >= lines.length) {
    throw new Error("INVALID_REFERENCE_LINE");
  }

  lines.splice(referenceLineNumber + 1, 0, newTask);
  return lines.join("\n");
}

export function validateDate(date: string): boolean {
  return DATE_FORMAT_REGEX.test(date);
}

export function validateDateType(dateType: string): dateType is "due" | "scheduled" {
  return dateType === "due" || dateType === "scheduled";
}

export function generateTaskId(
  referenceTaskText: string,
  newTaskText: string
): string {
  const match = referenceTaskText.match(/^([A-Z0-9]{2,}-T\d{2})-/);
  if (!match || !match[1]) {
    return newTaskText;
  }
  const prefix = match[1];
  const numMatch = prefix.match(/-T(\d{2})$/);
  if (!numMatch || !numMatch[1]) {
    return `${prefix}-${newTaskText}`;
  }
  const nextNum = parseInt(numMatch[1], 10) + 1;
  const newPrefix = prefix.replace(/-T\d{2}$/, `-T${nextNum.toString().padStart(2, "0")}`);
  return `${newPrefix}-${newTaskText}`;
}