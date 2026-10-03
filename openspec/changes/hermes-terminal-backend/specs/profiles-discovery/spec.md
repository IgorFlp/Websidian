## ADDED Requirements

### Requirement: Profiles discovery endpoint
The system SHALL provide GET /profiles endpoint that returns available Hermes profiles via multi-profile routing.

#### Scenario: Profiles list returned
- **WHEN** client GETs /profiles
- **THEN** system discovers profiles via Hermes multi-profile routing (`/p/<profile>/v1/models`)
- **THEN** response is JSON array of profiles: `[{ name, modelName, endpoint, isDefault }]`
- **THEN** default profile marked with `isDefault: true`

#### Scenario: Profile endpoint format
- **WHEN** returning profile list
- **THEN** each profile includes: `name` (profile slug), `modelName` (advertised model), `endpoint` (full API URL with `/p/<profile>/` prefix), `isDefault`
- **THEN** client can use endpoint for profile-specific API calls