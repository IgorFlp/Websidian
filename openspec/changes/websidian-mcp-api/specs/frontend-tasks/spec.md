## MODIFIED Requirements

### Requirement: Frontend task loading uses POST /api/tasks/list
The system SHALL update frontend JavaScript to call `POST /api/tasks/list` with `TaskFilter` instead of `GET /api/tasks`.

#### Scenario: tasks.js loadTasks uses POST endpoint
- **WHEN** `loadTasks()` called in tasks.js
- **THEN** builds `TaskFilter` from localStorage (filterFiles, vault)
- **THEN** calls `httpPost("/api/tasks/list", taskFilter, callback)`
- **THEN** processes response same as before

#### Scenario: scheduled.js loadTasks uses POST endpoint
- **WHEN** `loadTasks()` called in scheduled.js
- **THEN** builds `TaskFilter` for each vault
- **THEN** calls `httpPost("/api/tasks/list", taskFilter, callback)` per vault
- **THEN** aggregates and renders same as before

#### Scenario: TaskFilter includes file filter from localStorage
- **WHEN** frontend has `taskFilterFiles` in localStorage
- **THEN** TaskFilter includes `files: string[]` (server ignores unknown fields)
- **THEN** server returns all tasks, frontend filters client-side (transitional)

#### Scenario: Android 4 compatibility maintained
- **WHEN** code runs on Android 4 stock browser
- **THEN** uses existing `httpPost` XHR polyfill (no fetch, no arrow functions)
- **THEN** uses `var` not `const`/`let`
- **THEN** no `Array.prototype.find`/`filter` without polyfill (already present)

#### Scenario: Error handling preserved
- **WHEN** POST returns 401
- **THEN** redirects to /login (existing behavior)
- **WHEN** POST returns 500
- **THEN** shows "Erro de rede" alert (existing behavior)

## ADDED Requirements

### Requirement: Frontend TaskFilter builder utility
The system SHALL provide a helper to build TaskFilter from frontend state.

#### Scenario: Build filter from preset data
- **WHEN** preset loaded with files and vaultIndex
- **THEN** filter = `{ vault: vaultIndex, files: filePaths }`
- **THEN** optional date ranges if UI adds date pickers