## ADDED Requirements

### Requirement: Node Test Runner with tsx
The system SHALL use Node.js native test runner (`node:test`) executed via `tsx` for TypeScript test execution.

#### Scenario: Tests run with npm test
- **WHEN** running `npm run test`
- **THEN** `tsx --test` executes all `*.test.ts` files and exits with code 0 on pass

#### Scenario: Test files co-located with implementation
- **WHEN** listing `src/**/*.test.ts`
- **THEN** test files exist alongside source files (e.g., `service/files.service.test.ts`)

### Requirement: Unit Tests for Services
Each service in `src/service/` SHALL have unit tests mocking dependencies, covering happy paths and error cases.

#### Scenario: FilesService tested
- **WHEN** running tests
- **THEN** `files.service.test.ts` covers `getFileTree`, `getFlatFiles`, `getFileContent`

#### Scenario: TasksService tested
- **WHEN** running tests
- **THEN** `tasks.service.test.ts` covers `scanTasks`, `parseTask`, `toggleTask`

#### Scenario: PresetsService tested
- **WHEN** running tests
- **THEN** `presets.service.test.ts` covers CRUD, reorder, file management

#### Scenario: ChatService tested
- **WHEN** running tests
- **THEN** `chat.service.test.ts` covers `processChat` (text, audio, streaming)

### Requirement: Integration Tests for Routes
Each route file in `src/routes/` SHALL have integration tests using test HTTP server, validating request/response contracts.

#### Scenario: Route tests validate Zod schemas
- **WHEN** sending invalid request to test server
- **THEN** response 400 with validation issues

#### Scenario: Route tests validate success responses
- **WHEN** sending valid request to test server
- **THEN** response matches response schema

#### Scenario: Route tests validate auth
- **WHEN** requesting protected endpoint without session
- **THEN** response 401

### Requirement: Schema Contract Tests
Zod schemas in `src/domain/schemas/` SHALL have tests validating parsing, serialization, and OpenAPI metadata.

#### Scenario: Schema parses valid input
- **WHEN** `Schema.parse(validData)`
- **THEN** returns typed output

#### Scenario: Schema rejects invalid input
- **WHEN** `Schema.parse(invalidData)`
- **THEN** throws ZodError with issues

#### Scenario: Schema has OpenAPI metadata
- **WHEN** inspecting `Schema._def.openapi`
- **THEN** metadata present with description/examples

### Requirement: Coverage Thresholds
Test coverage SHALL meet minimum thresholds: 80% lines, 80% branches, 80% functions for `src/service/` and `src/routes/`.

#### Scenario: Coverage reported
- **WHEN** running `npm run test -- --coverage`
- **THEN** coverage summary meets thresholds