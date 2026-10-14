## ADDED Requirements

### Requirement: Profiles List Endpoint
The system SHALL return Hermes profiles at `GET /profiles`.

#### Scenario: Returns array of profile objects
- **WHEN** GET `/profiles` with valid session
- **THEN** response 200 with `Profile[]` where each has `name`, `modelName`, `endpoint`, `isDefault`

#### Scenario: Caches for 5 minutes
- **WHEN** two requests within 5 minutes
- **THEN** second request returns cached data

#### Scenario: Handles Hermes errors gracefully
- **WHEN** Hermes unavailable
- **THEN** returns cached data if available, else empty array

#### Scenario: Normalizes varied Hermes responses
- **WHEN** Hermes returns `{ data: [...] }`, `{ models: [...] }`, or raw array
- **THEN** all normalized to `Profile[]` format