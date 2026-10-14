## ADDED Requirements

### Requirement: Presets Storage
The system SHALL persist presets to `data/presets.json` with structure `{ presets: Preset[] }`.

#### Scenario: File created on first write
- **WHEN** first preset created and `data/presets.json` missing
- **THEN** file created with `{ presets: [] }` then preset added

### Requirement: List Presets Endpoint
The system SHALL return all presets at `GET /api/presets`.

#### Scenario: Returns presets array
- **WHEN** GET `/api/presets` with valid session
- **THEN** response 200 with `{ presets: Preset[] }` where `Preset` has `id`, `name`, `files[]`, `vaultIndex`, `order`, `createdAt`

### Requirement: Create Preset Endpoint
The system SHALL create preset at `POST /api/presets`.

#### Scenario: Creates with required name
- **WHEN** POST `/api/presets` with `{ name: "My Preset" }`
- **THEN** response 201 with `{ preset: Preset }` including generated `id`, `createdAt`, default `order`

#### Scenario: Accepts optional files, vaultIndex, order
- **WHEN** POST with full payload
- **THEN** preset includes provided values

#### Scenario: Rejects empty name
- **WHEN** POST with `{ name: "" }`
- **THEN** response 400 with `{ error: "Name is required" }`

### Requirement: Update Preset Endpoint
The system SHALL update preset at `PUT /api/presets/:id`.

#### Scenario: Updates name, vaultIndex, order
- **WHEN** PUT `/api/presets/abc` with `{ name: "New", order: 5 }`
- **THEN** response 200 with updated preset

#### Scenario: Returns 404 for missing preset
- **WHEN** PUT `/api/presets/missing` 
- **THEN** response 404 with `{ error: "Preset not found" }`

### Requirement: Delete Preset Endpoint
The system SHALL delete preset at `DELETE /api/presets/:id`.

#### Scenario: Deletes existing preset
- **WHEN** DELETE `/api/presets/abc`
- **THEN** response 200 `{ ok: true }`, preset removed from file

#### Scenario: Returns 404 for missing
- **WHEN** DELETE `/api/presets/missing`
- **THEN** response 404 `{ error: "Preset not found" }`

### Requirement: Reorder Presets Endpoint
The system SHALL bulk update order at `PUT /api/presets/reorder`.

#### Scenario: Reorders by presetIds array
- **WHEN** PUT `/api/presets/reorder` with `{ presetIds: ["id3", "id1", "id2"] }`
- **THEN** presets order updated to 0,1,2 matching array

#### Scenario: Rejects non-array
- **WHEN** PUT with `{ presetIds: "not-array" }`
- **THEN** response 400 `{ error: "presetIds array required" }`

### Requirement: Update Preset Files Endpoint
The system SHALL replace preset files at `PUT /api/presets/:id/files`.

#### Scenario: Replaces files array
- **WHEN** PUT `/api/presets/abc/files` with `{ files: [{ path: "a.md", order: 0 }] }`
- **THEN** preset files replaced, response 200 with updated preset

#### Scenario: Accepts string paths (converted to objects)
- **WHEN** PUT with `{ files: ["a.md", "b.md"] }`
- **THEN** converted to `{ path, order }` objects

#### Scenario: Rejects non-array
- **WHEN** PUT with `{ files: "not-array" }`
- **THEN** response 400 `{ error: "files array required" }`

#### Scenario: Returns 404 for missing preset
- **WHEN** PUT `/api/presets/missing/files`
- **THEN** response 404