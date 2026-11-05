## ADDED Requirements

### Requirement: tasks_list MCP tool
The system SHALL provide an MCP tool `tasks_list` that calls `POST /api/tasks/list` with `TaskFilter` and returns filtered tasks.

#### Scenario: List all tasks (no filter)
- **WHEN** MCP client calls `tasks_list` with `{}`
- **THEN** tool calls `POST /api/tasks/list` with `{}`
- **THEN** returns all tasks (Done, Scheduled, Due default to true)

#### Scenario: List tasks with date range
- **WHEN** MCP client calls `tasks_list` with `{ startDate: "2024-01-01", finishDate: "2024-01-31" }`
- **THEN** tool calls `POST /api/tasks/list` with date range
- **THEN** returns tasks with scheduled/due/doneDate in range

#### Scenario: List tasks excluding done
- **WHEN** MCP client calls `tasks_list` with `{ Done: false }`
- **THEN** tool calls `POST /api/tasks/list` with `Done: false`
- **THEN** returns only incomplete tasks

#### Scenario: List tasks with vault and path
- **WHEN** MCP client calls `tasks_list` with `{ vault: 1, path: "projects/" }`
- **THEN** tool includes vault and path in filter
- **THEN** returns tasks from vault 1 under projects/ path

### Requirement: task_toggle MCP tool
The system SHALL provide an MCP tool `task_toggle` that calls `POST /api/tasks/toggle` with file, line, and optional vault.

#### Scenario: Toggle task completion
- **WHEN** MCP client calls `task_toggle` with `{ file: "notes/tasks.md", line: 5, vault: 0 }`
- **THEN** tool calls `POST /api/tasks/toggle` with same params
- **THEN** returns `{ ok: true, task: Task }` with updated task

#### Scenario: Toggle non-existent task returns error
- **WHEN** MCP client calls `task_toggle` with invalid file/line
- **THEN** tool returns error "Task not found" or "File not found"

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header