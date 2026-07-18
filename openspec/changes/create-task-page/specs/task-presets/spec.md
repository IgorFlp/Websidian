## ADDED Requirements

### Requirement: Preset storage backend
The system SHALL store presets in `data/presets.json` with structure `{ presets: [{ id, name, files: string[], createdAt }] }`.

#### Scenario: Presets file exists on server start
- **WHEN** server starts
- **THEN** `data/presets.json` read or created with empty presets array

#### Scenario: Preset saved to file
- **WHEN** `POST /api/presets` called
- **THEN** new preset appended to `data/presets.json` with unique id and timestamp

#### Scenario: Preset deleted from file
- **WHEN** `DELETE /api/presets/:id` called
- **THEN** preset removed from `data/presets.json`

### Requirement: GET /api/presets endpoint
The system SHALL return all presets via `GET /api/presets` with auth protection.

#### Scenario: Fetch presets authenticated
- **WHEN** authenticated request to `GET /api/presets`
- **THEN** returns `{ presets: [...] }` with 200

#### Scenario: Fetch presets unauthenticated
- **WHEN** unauthenticated request to `GET /api/presets`
- **THEN** returns 401

### Requirement: POST /api/presets endpoint
The system SHALL create new preset via `POST /api/presets` with body `{ name, files }`.

#### Scenario: Create preset authenticated
- **WHEN** authenticated `POST /api/presets` with valid body
- **THEN** returns `{ preset: {...} }` with 201, preset saved to file

#### Scenario: Create preset missing name
- **WHEN** `POST /api/presets` without name
- **THEN** returns 400 error

#### Scenario: Create preset unauthenticated
- **WHEN** unauthenticated `POST /api/presets`
- **THEN** returns 401

### Requirement: DELETE /api/presets/:id endpoint
The system SHALL delete preset via `DELETE /api/presets/:id`.

#### Scenario: Delete preset authenticated
- **WHEN** authenticated `DELETE /api/presets/:id` with valid id
- **THEN** returns `{ ok: true }` with 200, preset removed

#### Scenario: Delete preset not found
- **WHEN** `DELETE /api/presets/:id` with invalid id
- **THEN** returns 404

#### Scenario: Delete preset unauthenticated
- **WHEN** unauthenticated `DELETE /api/presets/:id`
- **THEN** returns 401

### Requirement: Save Preset button in sidebar
The system SHALL provide "Save Preset" button in sidebar toolbar that prompts for name and saves current `taskFilterFiles` as preset.

#### Scenario: Click Save Preset
- **WHEN** user clicks "Save Preset" in sidebar
- **THEN** prompt for name, POST to `/api/presets` with current file filters

#### Scenario: Save Preset success
- **WHEN** preset saved successfully
- **THEN** show confirmation, update Load Preset dropdown on task page

### Requirement: Load Preset dropdown on task page
The system SHALL provide "Load Preset" dropdown on task page populated from `GET /api/presets`.

#### Scenario: Load preset applies file filters
- **WHEN** user selects preset from dropdown
- **THEN** preset's files written to localStorage `taskFilterFiles`, page re-renders