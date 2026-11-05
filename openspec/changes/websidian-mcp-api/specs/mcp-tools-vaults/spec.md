## ADDED Requirements

### Requirement: vaults_list MCP tool
The system SHALL provide an MCP tool `vaults_list` that calls `GET /vaults` and returns available vaults.

#### Scenario: List all vaults
- **WHEN** MCP client calls `vaults_list`
- **THEN** tool calls `GET /vaults`
- **THEN** returns array of `{ id: number, name: string, fullPath: string }`

#### Scenario: Authentication via API_KEY
- **WHEN** MCP tool makes request
- **THEN** includes `Authorization: Bearer <MCP_API_KEY>` header