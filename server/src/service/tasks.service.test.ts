import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { TasksService } from "./tasks.service.js";

describe("TasksService filterTasks", () => {
  let tasksService: TasksService;
  let mockTasks: any[];

  beforeEach(() => {
    tasksService = new TasksService(["/test/vault"]);
    mockTasks = [
      {
        text: "Task 1",
        done: true,
        due: null,
        scheduled: null,
        doneDate: "2024-01-15",
        tags: [],
        recurring: false,
        recurringRule: null,
        displayText: "Task 1",
        file: "notes/task1.md",
        line: 0,
        vaultIndex: 0,
      },
      {
        text: "Task 2",
        done: false,
        due: "2024-01-20",
        scheduled: "2024-01-10",
        doneDate: null,
        tags: [],
        recurring: false,
        recurringRule: null,
        displayText: "Task 2",
        file: "notes/task2.md",
        line: 1,
        vaultIndex: 0,
      },
      {
        text: "Task 3",
        done: false,
        due: "2024-02-01",
        scheduled: null,
        doneDate: null,
        tags: [],
        recurring: false,
        recurringRule: null,
        displayText: "Task 3",
        file: "notes/task3.md",
        line: 2,
        vaultIndex: 0,
      },
      {
        text: "Task 4",
        done: true,
        due: null,
        scheduled: "2024-01-05",
        doneDate: "2024-01-10",
        tags: [],
        recurring: false,
        recurringRule: null,
        displayText: "Task 4",
        file: "notes/task4.md",
        line: 3,
        vaultIndex: 0,
      },
      {
        text: "Task 5",
        done: false,
        due: null,
        scheduled: null,
        doneDate: null,
        tags: [],
        recurring: false,
        recurringRule: null,
        displayText: "Task 5",
        file: "notes/task5.md",
        line: 4,
        vaultIndex: 1,
      },
    ];
  });

  it("should return all tasks when filter is empty (defaults)", () => {
    const result = tasksService.filterTasks(mockTasks, {});
    assert.strictEqual(result.length, 5);
  });

  it("should filter by Done: false (exclude completed)", () => {
    const result = tasksService.filterTasks(mockTasks, { Done: false });
    assert.strictEqual(result.length, 3); // Tasks 2, 3, 5
    assert.ok(result.every((t) => t.done === false));
  });

  it("should filter by Scheduled: false (exclude scheduled)", () => {
    const result = tasksService.filterTasks(mockTasks, { Scheduled: false });
    assert.strictEqual(result.length, 3); // Tasks 1, 3, 5
    assert.ok(result.every((t) => !t.scheduled));
  });

  it("should filter by Due: false (exclude due dates)", () => {
    const result = tasksService.filterTasks(mockTasks, { Due: false });
    assert.strictEqual(result.length, 3); // Tasks 1, 4, 5
    assert.ok(result.every((t) => !t.due));
  });

  it("should filter by date range using scheduled date", () => {
    const result = tasksService.filterTasks(mockTasks, {
      startDate: "2024-01-01",
      finishDate: "2024-01-31",
    });
    // Task 1 has doneDate 2024-01-15, Task 2 has scheduled 2024-01-10, Task 4 has scheduled 2024-01-05 and doneDate 2024-01-10
    assert.strictEqual(result.length, 3);
    const texts = result.map((t) => t.text).sort();
    assert.deepStrictEqual(texts, ["Task 1", "Task 2", "Task 4"]);
  });

  it("should filter by date range using due date", () => {
    const result = tasksService.filterTasks(mockTasks, {
      startDate: "2024-01-15",
      finishDate: "2024-01-25",
    });
    // Task 1 has doneDate 2024-01-15, Task 2 has due 2024-01-20
    assert.strictEqual(result.length, 2);
    const texts = result.map((t) => t.text).sort();
    assert.deepStrictEqual(texts, ["Task 1", "Task 2"]);
  });

  it("should filter by date range using doneDate", () => {
    const result = tasksService.filterTasks(mockTasks, {
      startDate: "2024-01-10",
      finishDate: "2024-01-20",
    });
    // Task 1 has doneDate 2024-01-15, Task 4 has doneDate 2024-01-10, Task 2 has scheduled 2024-01-10
    assert.strictEqual(result.length, 3);
    const texts = result.map((t) => t.text).sort();
    assert.deepStrictEqual(texts, ["Task 1", "Task 2", "Task 4"]);
  });

  it("should not apply date range when only startDate provided", () => {
    const result = tasksService.filterTasks(mockTasks, {
      startDate: "2024-01-01",
    });
    assert.strictEqual(result.length, 5);
  });

  it("should not apply date range when only finishDate provided", () => {
    const result = tasksService.filterTasks(mockTasks, {
      finishDate: "2024-01-31",
    });
    assert.strictEqual(result.length, 5);
  });

  it("should combine date range with boolean flags", () => {
    const result = tasksService.filterTasks(mockTasks, {
      startDate: "2024-01-01",
      finishDate: "2024-01-31",
      Done: false,
    });
    // Task 2 has scheduled 2024-01-10 and done=false, Task 4 is done=true so excluded
    assert.strictEqual(result.length, 1);
    assert.ok(result[0]);
    assert.strictEqual(result[0]?.text, "Task 2");
  });

  it("should filter by vault", () => {
    const result = tasksService.filterTasks(mockTasks, { vault: 1 });
    assert.strictEqual(result.length, 1);
    assert.ok(result[0]);
    assert.strictEqual(result[0]?.text, "Task 5");
  });

  it("should filter by path prefix", () => {
    const tasksWithPaths = mockTasks.map((t, i) => ({
      ...t,
      file: i < 3 ? `notes/${t.file}` : `other/${t.file}`,
    }));
    const result = tasksService.filterTasks(tasksWithPaths, { path: "notes/" });
    assert.strictEqual(result.length, 3);
    assert.ok(result.every((t) => t.file.startsWith("notes/")));
  });

  it("should filter by specific files", () => {
    const result = tasksService.filterTasks(mockTasks, {
      files: ["notes/task1.md", "notes/task3.md"],
    });
    assert.strictEqual(result.length, 2);
    const texts = result.map((t) => t.text).sort();
    assert.deepStrictEqual(texts, ["Task 1", "Task 3"]);
  });
});