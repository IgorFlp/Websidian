## ADDED Requirements

### Requirement: TaskFilter schema for advanced task filtering
The system SHALL accept a `TaskFilter` object with optional `startDate`, `finishDate`, `Done`, `Scheduled`, `Due` fields for filtering tasks server-side.

#### Scenario: TaskFilter with all defaults
- **WHEN** `TaskFilter` is empty object `{}`
- **THEN** filter behaves as `{ Done: true, Scheduled: true, Due: true }` (all tasks included)

#### Scenario: TaskFilter with explicit boolean false
- **WHEN** `TaskFilter` has `Done: false`
- **THEN** tasks with `done: true` are excluded from results

#### Scenario: TaskFilter with date range
- **WHEN** `TaskFilter` has `startDate: "2024-01-01"` and `finishDate: "2024-01-31"`
- **THEN** only tasks where ANY of (scheduled, due, doneDate) falls within [2024-01-01, 2024-01-31] are returned

#### Scenario: TaskFilter with date range and boolean flags
- **WHEN** `TaskFilter` has `startDate: "2024-01-01"`, `finishDate: "2024-01-31"`, `Done: false`
- **THEN** tasks with doneDate in range are excluded; tasks with scheduled/due in range are included

#### Scenario: TaskFilter with only startDate
- **WHEN** `TaskFilter` has only `startDate: "2024-01-01"` (no finishDate)
- **THEN** date range filter is not applied (requires both dates)

#### Scenario: TaskFilter with only finishDate
- **WHEN** `TaskFilter` has only `finishDate: "2024-01-31"` (no startDate)
- **THEN** date range filter is not applied (requires both dates)

#### Scenario: Date parsing uses ISO 8601
- **WHEN** dates provided in `TaskFilter`
- **THEN** dates MUST be in YYYY-MM-DD format; invalid formats return 400 error

### Requirement: POST /api/tasks/list endpoint with TaskFilter body
The system SHALL expose `POST /api/tasks/list` accepting `TaskFilter` in request body and returning filtered tasks.

#### Scenario: Successful task list with filter
- **WHEN** POST `/api/tasks/list` with valid `TaskFilter`
- **THEN** response 200 with array of filtered Task objects

#### Scenario: Invalid TaskFilter returns 400
- **WHEN** POST `/api/tasks/list` with malformed JSON or invalid fields
- **THEN** response 400 with validation error details

#### Scenario: Authentication required
- **WHEN** POST `/api/tasks/list` without valid auth (session or API_KEY)
- **THEN** response 401

### Requirement: Deprecated GET /api/tasks endpoint for backward compatibility
The system SHALL maintain `GET /api/tasks` that transforms query parameters to `TaskFilter` and delegates to new endpoint.

#### Scenario: GET /api/tasks with vault and path
- **WHEN** GET `/api/tasks?vault=0&path=notes/`
- **THEN** internally calls POST `/api/tasks/list` with `{ vault: 0, path: "notes/" }` (transformed to TaskFilter)
- **THEN** response matches new endpoint format

#### Scenario: GET /api/tasks logs deprecation warning
- **WHEN** GET `/api/tasks` is called
- **THEN** server logs warning "GET /api/tasks deprecated, use POST /api/tasks/list"