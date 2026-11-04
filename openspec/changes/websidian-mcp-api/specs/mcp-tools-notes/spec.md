## ADDED Requirements

### Requirement: note_create MCP tool
The system SHALL provide an MCP tool `note_create` that calls `POST /api/newNote` with noteName, timestamp, text, and optional vault.

#### Scenario: Create new note
- **WHEN** MCP client calls `note_create` with `{ noteName: "meeting-notes", timestamp: "2024-01-15T10:30:00.000Z", text: "Meeting content", vault: 0 }`
- **THEN** tool calls `POST /api/newNote` with same params
- **THEN** returns `{ ok: "ok", path: "notes/meeting-notes.md" }`

#### Scenario: Create note with default vault
- **WHEN** MCP client calls `note_create` without vault parameter
- **THEN** tool uses vault 0 as default
- **THEN** note created in default vault

#### Scenario: Create note with special characters in name
- **WHEN** MCP client calls `note_create` with `noteName: "meeting notes (1)"`
- **THEN** service sanitizes filename appropriately
- **THEN** note created successfully

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header