import { describe, it } from "node:test";
import assert from "node:assert";
import {
  findTaskLine,
  parseTaskLine,
  replaceDateInLine,
  removeTaskLine,
  insertTaskLine,
  validateDate,
  validateDateType,
  generateTaskId,
} from "./task-parser.js";

describe("task-parser", () => {
  describe("parseTaskLine", () => {
    it("should parse a basic task", () => {
      const line = "- [ ] Basic task";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.strictEqual(result!.text, "Basic task");
      assert.strictEqual(result!.done, false);
      assert.strictEqual(result!.due, null);
      assert.strictEqual(result!.scheduled, null);
    });

    it("should parse a completed task", () => {
      const line = "- [x] Completed task";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.strictEqual(result!.done, true);
    });

    it("should parse task with due date", () => {
      const line = "- [ ] Task with due 📅 2024-01-15";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.strictEqual(result!.due, "2024-01-15");
    });

    it("should parse task with scheduled date", () => {
      const line = "- [ ] Task scheduled ⏳ 2024-01-10";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.strictEqual(result!.scheduled, "2024-01-10");
    });

    it("should parse task with both due and scheduled", () => {
      const line = "- [ ] Task ⏳ 2024-01-10 📅 2024-01-15";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.strictEqual(result!.scheduled, "2024-01-10");
      assert.strictEqual(result!.due, "2024-01-15");
    });

    it("should parse task with tags", () => {
      const line = "- [ ] Task #work #urgent";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.ok(result!.tags.includes("#work"));
      assert.ok(result!.tags.includes("#urgent"));
    });

    it("should parse task with done date", () => {
      const line = "- [x] Done task ✅ 2024-01-20";
      const result = parseTaskLine(line);
      assert.ok(result !== null);
      assert.strictEqual(result!.doneDate, "2024-01-20");
    });

    it("should return null for non-task line", () => {
      const result = parseTaskLine("Not a task line");
      assert.strictEqual(result, null);
    });

    it("should return null for empty line", () => {
      const result = parseTaskLine("");
      assert.strictEqual(result, null);
    });
  });

  describe("findTaskLine", () => {
    const fileContent = `- [ ] Task one
- [ ] Task two 📅 2024-01-15
- [x] Task three ⏳ 2024-01-10
- [ ] Another task`;

    it("should find exact task text match", () => {
      const result = findTaskLine(fileContent, "Task one");
      assert.ok(result !== null);
      assert.strictEqual(result!.lineNumber, 0);
      assert.strictEqual(result!.line, "- [ ] Task one");
    });

    it("should find task with due date", () => {
      const result = findTaskLine(fileContent, "Task two 📅 2024-01-15");
      assert.ok(result !== null);
      assert.strictEqual(result!.lineNumber, 1);
    });

    it("should find by display text", () => {
      const result = findTaskLine(fileContent, "Task three");
      assert.ok(result !== null);
      assert.strictEqual(result!.lineNumber, 2);
    });

    it("should return null for non-existent task", () => {
      const result = findTaskLine(fileContent, "Non existent");
      assert.strictEqual(result, null);
    });

    it("should throw AMBIGUOUS_MATCH for duplicate tasks", () => {
      const content = `- [ ] Duplicate task
- [ ] Duplicate task`;
      assert.throws(() => findTaskLine(content, "Duplicate task"), { message: "AMBIGUOUS_MATCH" });
    });
  });

  describe("replaceDateInLine", () => {
    it("should add due date to task without date", () => {
      const line = "- [ ] Task without date";
      const result = replaceDateInLine(line, "due", "2024-01-20");
      assert.strictEqual(result, "- [ ] Task without date 📅 2024-01-20");
    });

    it("should add scheduled date to task without date", () => {
      const line = "- [ ] Task without date";
      const result = replaceDateInLine(line, "scheduled", "2024-01-10");
      assert.strictEqual(result, "- [ ] Task without date ⏳ 2024-01-10");
    });

    it("should replace existing due date", () => {
      const line = "- [ ] Task 📅 2024-01-15";
      const result = replaceDateInLine(line, "due", "2024-01-20");
      assert.strictEqual(result, "- [ ] Task 📅 2024-01-20");
    });

    it("should replace existing scheduled date", () => {
      const line = "- [ ] Task ⏳ 2024-01-10";
      const result = replaceDateInLine(line, "scheduled", "2024-01-12");
      assert.strictEqual(result, "- [ ] Task ⏳ 2024-01-12");
    });

    it("should add due date when scheduled exists", () => {
      const line = "- [ ] Task ⏳ 2024-01-10";
      const result = replaceDateInLine(line, "due", "2024-01-20");
      assert.ok(result.includes("📅 2024-01-20"));
      assert.ok(result.includes("⏳ 2024-01-10"));
    });

    it("should throw INVALID_DATE for invalid format", () => {
      const line = "- [ ] Task";
      assert.throws(() => replaceDateInLine(line, "due", "invalid-date"), { message: "INVALID_DATE" });
      assert.throws(() => replaceDateInLine(line, "due", "2024/01/15"), { message: "INVALID_DATE" });
    });
  });

  describe("removeTaskLine", () => {
    it("should remove line at index", () => {
      const content = `Line 1
Line 2
Line 3`;
      const result = removeTaskLine(content, 1);
      assert.strictEqual(result, "Line 1\nLine 3");
    });

    it("should throw for invalid line number", () => {
      const content = "Line 1";
      assert.throws(() => removeTaskLine(content, -1), { message: "INVALID_LINE_NUMBER" });
      assert.throws(() => removeTaskLine(content, 5), { message: "INVALID_LINE_NUMBER" });
    });
  });

  describe("insertTaskLine", () => {
    it("should insert after reference line", () => {
      const content = `Line 1
Line 2
Line 3`;
      const result = insertTaskLine(content, 1, "New Line");
      assert.strictEqual(result, "Line 1\nLine 2\nNew Line\nLine 3");
    });

    it("should append at end of task list when no reference", () => {
      const content = `- [ ] Task 1
- [ ] Task 2
Some other text`;
      const result = insertTaskLine(content, null, "- [ ] New Task");
      assert.strictEqual(result, "- [ ] Task 1\n- [ ] Task 2\n- [ ] New Task\nSome other text");
    });

    it("should insert at end when no tasks exist", () => {
      const content = "Just some text";
      const result = insertTaskLine(content, null, "- [ ] New Task");
      assert.strictEqual(result, "Just some text\n- [ ] New Task");
    });

    it("should throw for invalid reference line", () => {
      const content = "Line 1";
      assert.throws(() => insertTaskLine(content, -1, "New"), { message: "INVALID_REFERENCE_LINE" });
      assert.throws(() => insertTaskLine(content, 5, "New"), { message: "INVALID_REFERENCE_LINE" });
    });
  });

  describe("validateDate", () => {
    it("should return true for valid YYYY-MM-DD", () => {
      assert.strictEqual(validateDate("2024-01-15"), true);
      assert.strictEqual(validateDate("2024-12-31"), true);
    });

    it("should return false for invalid formats", () => {
      assert.strictEqual(validateDate("2024/01/15"), false);
      assert.strictEqual(validateDate("15-01-2024"), false);
      assert.strictEqual(validateDate("invalid"), false);
      assert.strictEqual(validateDate(""), false);
    });
  });

  describe("validateDateType", () => {
    it("should return true for valid types", () => {
      assert.strictEqual(validateDateType("due"), true);
      assert.strictEqual(validateDateType("scheduled"), true);
    });

    it("should return false for invalid types", () => {
      assert.strictEqual(validateDateType("invalid"), false);
      assert.strictEqual(validateDateType(""), false);
      assert.strictEqual(validateDateType("done"), false);
    });
  });

  describe("generateTaskId", () => {
    it("should generate next ID in sequence", () => {
      const result = generateTaskId("US01-T01-test task", "new task");
      assert.strictEqual(result, "US01-T02-new task");
    });

    it("should handle different prefixes", () => {
      const result = generateTaskId("ABC-T05-task", "new");
      assert.strictEqual(result, "ABC-T06-new");
    });

    it("should return original text if no pattern match", () => {
      const result = generateTaskId("No pattern here", "new task");
      assert.strictEqual(result, "new task");
    });
  });
});