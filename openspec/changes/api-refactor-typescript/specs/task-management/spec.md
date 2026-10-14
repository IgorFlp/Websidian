## ADDED Requirements

### Requirement: Task Scanning Endpoint
The system SHALL scan all `.md` files in vault and return parsed tasks at `GET /api/tasks`.

#### Scenario: Returns array of task objects
- **WHEN** GET `/api/tasks` with valid session
- **THEN** response 200 with `Task[]` where each has `text`, `done`, `due?`, `scheduled?`, `doneDate?`, `tags[]`, `recurring`, `recurringRule?`, `file`, `line`, `vaultIndex`

#### Scenario: Vault index parameter
- **WHEN** GET `/api/tasks?vault=1`
- **THEN** scans second vault path

#### Scenario: Parses checkbox syntax
- **WHEN** vault contains `- [ ] task` and `- [x] done task`
- **THEN** returns tasks with `done: false` and `done: true`

#### Scenario: Parses metadata emojis
- **WHEN** task line contains `📅 2024-01-15 ⏳ 2024-01-10 🔁 every day #tag`
- **THEN** task has `due`, `scheduled`, `recurring: true`, `recurringRule`, `tags: ["#tag"]`

#### Scenario: Ignored directories skipped
- **WHEN** vault has `.obsidian/tasks.md`
- **THEN** tasks from ignored dirs not included

### Requirement: Task Toggle Endpoint
The system SHALL toggle task completion at `POST /api/tasks/toggle`.

#### Scenario: Toggles unchecked to checked
- **WHEN** POST `/api/tasks/toggle` with `{ file, line, vaultIndex }` for `- [ ] task`
- **THEN** file updated to `- [x] task ✅ YYYY-MM-DD`, response 200 `{ ok: true }`

#### Scenario: Toggles checked to unchecked
- **WHEN** POST `/api/tasks/toggle` for `- [x] task ✅ 2024-01-15`
- **THEN** file updated to `- [ ] task`, response 200 `{ ok: true }`

#### Scenario: Recurring task creates next occurrence
- **WHEN** toggling recurring task `- [x] task 🔁 every day 📅 2024-01-15`
- **THEN** original line becomes checked, new line appended with next date

#### Scenario: Invalid line returns error
- **WHEN** POST with line not containing checkbox
- **THEN** response 500 (preserved behavior)