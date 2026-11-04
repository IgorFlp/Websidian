## ADDED Requirements

### Requirement: API_KEY authentication for MCP access
The system SHALL accept an `Authorization: Bearer <API_KEY>` header on MCP-enabled endpoints and validate it against the `MCP_API_KEY` environment variable.

#### Scenario: Valid API_KEY grants access
- **WHEN** request includes `Authorization: Bearer correct-key` header and `MCP_API_KEY=correct-key`
- **THEN** request proceeds to handler

#### Scenario: Missing API_KEY returns 401
- **WHEN** request lacks `Authorization` header
- **THEN** response status is 401 with error "API key required"

#### Scenario: Invalid API_KEY returns 401
- **WHEN** request includes `Authorization: Bearer wrong-key` and `MCP_API_KEY=correct-key`
- **THEN** response status is 401 with error "Invalid API key"

#### Scenario: Empty API_KEY in env disables MCP auth
- **WHEN** `MCP_API_KEY` is not set or empty
- **THEN** MCP endpoints return 503 with error "MCP not configured"