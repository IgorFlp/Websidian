## ADDED Requirements

### Requirement: presets_list MCP tool
The system SHALL provide an MCP tool `presets_list` that calls `GET /api/presets` and returns all presets.

#### Scenario: List all presets
- **WHEN** MCP client calls `presets_list`
- **THEN** tool calls `GET /api/presets`
- **THEN** returns `{ presets: Preset[] }` with id, name, files, vaultIndex, order, createdAt

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header

### Requirement: preset_create MCP tool
The system SHALL provide an MCP tool `preset_create` that calls `POST /api/presets` with name, files, optional vaultIndex, and optional order.

#### Scenario: Create preset with files
- **WHEN** MCP client calls `preset_create` with `{ name: "My Preset", files: ["notes/a.md", "notes/b.md"], vaultIndex: 0 }`
- **THEN** tool calls `POST /api/presets` with same params
- **THEN** returns `{ preset: Preset }` with generated id and createdAt

#### Scenario: Create preset with custom order
- **WHEN** MCP client calls `preset_create` with `{ name: "My Preset", files: ["notes/a.md"], order: 5 }`
- **THEN** preset created with specified order

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header

### Requirement: preset_update MCP tool
The system SHALL provide an MCP tool `preset_update` that calls `PUT /api/presets/{id}` with optional name, vaultIndex, order.

#### Scenario: Update preset name
- **WHEN** MCP client calls `preset_update` with `{ id: "preset-123", name: "New Name" }`
- **THEN** tool calls `PUT /api/presets/preset-123` with `{ name: "New Name" }`
- **THEN** returns updated preset

#### Scenario: Update preset vaultIndex
- **WHEN** MCP client calls `preset_update` with `{ id: "preset-123", vaultIndex: 1 }`
- **THEN** preset vaultIndex updated

#### Scenario: Update preset order
- **WHEN** MCP client calls `preset_update` with `{ id: "preset-123", order: 10 }`
- **THEN** preset order updated

#### Scenario: Non-existent preset returns 404
- **WHEN** MCP client calls `preset_update` with invalid id
- **THEN** returns error "Preset not found"

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header

### Requirement: preset_delete MCP tool
The system SHALL provide an MCP tool `preset_delete` that calls `DELETE /api/presets/{id}`.

#### Scenario: Delete existing preset
- **WHEN** MCP client calls `preset_delete` with `{ id: "preset-123" }`
- **THEN** tool calls `DELETE /api/presets/preset-123`
- **THEN** returns `{ ok: true }`

#### Scenario: Delete non-existent preset returns 404
- **WHEN** MCP client calls `preset_delete` with invalid id
- **THEN** returns error "Preset not found"

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header

### Requirement: preset_reorder MCP tool
The system SHALL provide an MCP tool `preset_reorder` that calls `PUT /api/presets/reorder` with presetIds array.

#### Scenario: Reorder presets
- **WHEN** MCP client calls `preset_reorder` with `{ presetIds: ["preset-3", "preset-1", "preset-2"] }`
- **THEN** tool calls `PUT /api/presets/reorder` with same params
- **THEN** presets reordered, returns `{ ok: true }`

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header

### Requirement: preset_files_update MCP tool
The system SHALL provide an MCP tool `preset_files_update` that calls `PUT /api/presets/{id}/files` with files array of {path, order}.

#### Scenario: Update preset file order
- **WHEN** MCP client calls `preset_files_update` with `{ id: "preset-123", files: [{path: "notes/b.md", order: 0}, {path: "notes/a.md", order: 1}] }`
- **THEN** tool calls `PUT /api/presets/preset-123/files` with same params
- **THEN** returns updated preset

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header