## ADDED Requirements

### Requirement: Zod Schemas for All HTTP Boundaries via fastify-zod
The system SHALL validate all external HTTP inputs (request body, query parameters, path parameters, headers) using Zod schemas defined in `src/domain/schemas/` integrated via `fastify-zod` plugin.

#### Scenario: Request body validated
- **WHEN** POST/PUT/PATCH request received with JSON body
- **THEN** body parsed and validated against corresponding Zod schema before route handler executes via Fastify schema validation

#### Scenario: Query parameters validated
- **WHEN** GET request received with query string
- **THEN** query parsed and validated against Zod schema via Fastify schema

#### Scenario: Path parameters validated
- **WHEN** request matches route with path parameters (e.g., `/api/presets/:id`)
- **THEN** params extracted and validated against Zod schema via Fastify schema

#### Scenario: Headers validated
- **WHEN** request requires specific headers (e.g., `Cookie`, `Range`)
- **THEN** headers parsed and validated against Zod schema via Fastify schema

### Requirement: Granular Schema Organization
The system SHALL organize Zod schemas by capability in separate files under `src/domain/schemas/` (e.g., `auth.ts`, `files.ts`, `tasks.ts`, `presets.ts`, `notes.ts`, `chat.ts`, `sessions.ts`, `profiles.ts`, `audio.ts`, `terminal.ts`).

#### Scenario: Each capability has dedicated schema file
- **WHEN** listing `src/domain/schemas/`
- **THEN** files exist for all 10 capabilities

### Requirement: Request/Response Schema Pairs
Each capability schema file SHALL export paired request/response schemas with OpenAPI metadata via `.openapi()` for fastify-swagger consumption.

#### Scenario: Request schema validates input
- **WHEN** invalid input sent to endpoint
- **THEN** validation fails with detailed Zod issues (automatic 400 via Fastify)

#### Scenario: Response schema documents output
- **WHEN** generating OpenAPI spec via fastify-swagger
- **THEN** response schemas appear in components with examples

### Requirement: Validation Error Mapping
Validation failures SHALL be caught by Fastify schema validation and translated to HTTP 400 with structured error response matching `Error` schema.

#### Scenario: Invalid body returns 400
- **WHEN** POST `/api/presets` with missing `name`
- **THEN** response 400 with `{ error: "Validation error", issues: [...] }`

#### Scenario: Invalid query returns 400
- **WHEN** GET `/api/files?flat=invalid`
- **THEN** response 400 with validation issues