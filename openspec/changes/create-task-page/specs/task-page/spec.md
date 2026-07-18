## ADDED Requirements

### Requirement: Task page route and page structure
The system SHALL serve a `/tasks` route that returns `tasks.html` with auth protection.

#### Scenario: Access task page authenticated
- **WHEN** authenticated user navigates to `/tasks`
- **THEN** server returns `tasks.html` with 200 status

#### Scenario: Access task page unauthenticated
- **WHEN** unauthenticated user navigates to `/tasks`
- **THEN** server redirects to `/login`

### Requirement: Task page fetches and displays tasks grouped by file
The system SHALL fetch all tasks via `/api/tasks`, filter by selected files from localStorage, group by file, and render each file as a container with max 10 visible tasks (scrollable).

#### Scenario: Task page loads with file filters
- **WHEN** task page loads and localStorage `taskFilterFiles` contains file paths
- **THEN** page fetches `/api/tasks`, filters to selected files, groups by file, renders containers

#### Scenario: Task page loads without file filters
- **WHEN** task page loads and localStorage `taskFilterFiles` is empty or missing
- **THEN** page shows empty state with instruction to select files in sidebar

#### Scenario: Task container shows max 10 tasks with scroll
- **WHEN** a file has more than 10 tasks
- **THEN** container shows first 10 tasks with vertical scroll for remaining

#### Scenario: Task container uses .task-section design
- **WHEN** rendering task containers
- **THEN** each container uses `.tasks-section` CSS class from `style.css`

### Requirement: Task sort order - last checked task first
The system SHALL sort tasks within each container with checked tasks first (most recent `doneDate` first), then unchecked tasks by `scheduled`/`due` date ascending.

#### Scenario: Checked tasks appear first sorted by doneDate desc
- **WHEN** rendering tasks for a file
- **THEN** checked tasks sorted by `doneDate` descending appear before unchecked tasks

#### Scenario: Unchecked tasks sorted by scheduled/due date asc
- **WHEN** rendering unchecked tasks for a file
- **THEN** tasks sorted by `scheduled` then `due` ascending

### Requirement: Checkbox toggle updates task and re-sorts container
The system SHALL call `/api/tasks/toggle` on checkbox click, then re-fetch and re-render the affected container with updated sort order.

#### Scenario: Toggle task checkbox
- **WHEN** user clicks checkbox on task item
- **THEN** POST to `/api/tasks/toggle` with task file and line, then re-render container

### Requirement: Clear Filters button on task page
The system SHALL provide a "Clear Filters" button that clears localStorage `taskFilterFiles` and re-renders empty state.

#### Scenario: Click Clear Filters
- **WHEN** user clicks "Clear Filters" button
- **THEN** localStorage `taskFilterFiles` cleared, page shows empty state

### Requirement: Load Preset dropdown on task page
The system SHALL fetch presets via `GET /api/presets` on page load and populate a "Load Preset" dropdown.

#### Scenario: Load Preset dropdown populated
- **WHEN** task page loads
- **THEN** `GET /api/presets` called, dropdown shows preset names

#### Scenario: Select preset loads file filters
- **WHEN** user selects preset from dropdown
- **THEN** preset's file list saved to localStorage `taskFilterFiles`, page re-renders with those files