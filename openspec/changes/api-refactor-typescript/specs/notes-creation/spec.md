## ADDED Requirements

### Requirement: Daily Note Creation Endpoint
The system SHALL create or append to daily notes at `POST /api/newNote`.

#### Scenario: Creates new note file
- **WHEN** POST `/api/newNote` with `{ noteName: "daily", timestamp: "2024-01-15 10:30", text: "Note content" }` and file doesn't exist
- **THEN** creates `VAULT/Dailynotes/daily.md` with `## 2024-01-15 10:30\nNote content`, response 200 `{ ok: "Arquivo criado com nova nota em daily.md" }`

#### Scenario: Appends to existing note
- **WHEN** POST with same `noteName` and file exists
- **THEN** appends `\n## timestamp\ntext\n`, response 200 `{ ok: "Adicionado a nota existente no arquivo daily.md" }`

#### Scenario: Sanitizes noteName
- **WHEN** noteName contains special chars `note@name!`
- **THEN** file created as `notenamed.md` (alphanumeric, hyphen, underscore, space only)

#### Scenario: Uses vault index
- **WHEN** vaultIndex provided (from session/context)
- **THEN** note created in that vault's Dailynotes folder

#### Scenario: Returns 500 on filesystem error
- **WHEN** vault not writable
- **THEN** response 500 `{ error: "Erro ao criar a nota" }`