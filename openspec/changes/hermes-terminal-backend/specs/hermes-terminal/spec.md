## ADDED Requirements

### Requirement: Hermes API client initialization
The system SHALL initialize a Hermes API client with base URL and bearer token authentication on service startup.

#### Scenario: Client configured
- **WHEN** service starts
- **THEN** client is configured with `HERMES_API_URL` (default: http://localhost:8642) and `HERMES_API_KEY`
- **THEN** client includes bearer auth header on all requests

#### Scenario: Health check
- **WHEN** service starts
- **THEN** client verifies Hermes API server is reachable via `/health` endpoint
- **THEN** service fails fast if Hermes API server is unavailable

### Requirement: Multi-profile routing discovery
The system SHALL discover available Hermes profiles via multi-profile routing.

#### Scenario: Profile list retrieved
- **WHEN** client queries profile discovery
- **THEN** system returns list of profiles with their names and API endpoint prefixes
- **THEN** each profile includes its own bearer token for authentication