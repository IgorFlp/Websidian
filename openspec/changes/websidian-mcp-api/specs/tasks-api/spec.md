## MODIFIED Requirements

### Requirement: Tasks API endpoint for listing tasks
The system SHALL provide a `POST /api/tasks/list` endpoint that accepts `TaskFilter` body and returns filtered tasks, replacing the deprecated `GET /api/tasks`.

#### Scenario: POST /api/tasks/list with TaskFilter
- **WHEN** client sends `POST /api/tasks/list` with `TaskFilter` body
- **THEN** server validates filter, scans tasks, applies filter, returns filtered array
- **THEN** response 200 with `Task[]`

#### Scenario: GET /api/tasks deprecated alias
- **WHEN** client sends `GET /api/tasks?vault=0&path=notes/`
- **THEN** server transforms query to TaskFilter, calls new endpoint internally
- **THEN** logs deprecation warning
- **THEN** returns same format as new endpoint

#### Scenario: TaskFilter date range filtering
- **WHEN** TaskFilter has `startDate` and `finishDate`
- **THEN** only tasks where ANY of (scheduled, due, doneDate) is within [startDate, finishDate] inclusive
- **THEN** tasks without any of these dates are excluded

#### Scenario: TaskFilter boolean exclusion
- **WHEN** TaskFilter has `Done: false`
- **THEN** tasks with `done: true` are excluded from results
- **WHEN** TaskFilter has `Scheduled: false`
- **THEN** tasks with `scheduled` date set are excluded
- **WHEN** TaskFilter has `Due: false`
- **THEN** tasks with `due` date set are excluded

#### Scenario: TaskFilter defaults
- **WHEN** TaskFilter omits `Done`, `Scheduled`, `Due`
- **THEN** defaults to `true` for all (include all tasks)

#### Scenario: Authentication
- **WHEN** request has valid session cookie
- **THEN** request proceeds
- **WHEN** request has valid `Authorization: Bearer <MCP_API_KEY>`
- **THEN** request proceeds
- **WHEN** request has neither
- **THEN** response 401

## REMOVED Requirements

### Requirement: GET /api/tasks with query parameters only
**Reason**: Replaced by POST /api/tasks/list with TaskFilter body for richer filtering
**Migration**: Use POST /api/tasks/list with TaskFilter; GET /api/tasks maintained as deprecated alias during transition