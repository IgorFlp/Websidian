## ADDED Requirements

### Requirement: TypeScript Strict Mode Compilation
The system SHALL compile all source files under `server/src/` using TypeScript 5.x in strict mode with ESM modules targeting Node 22 LTS.

#### Scenario: Successful typecheck
- **WHEN** running `npm run typecheck`
- **THEN** TypeScript compiler exits with code 0 and zero errors

#### Scenario: Strict mode enforced
- **WHEN** code uses `any`, implicit `any`, or unchecked nullish access
- **THEN** TypeScript compiler reports errors

### Requirement: Fastify HTTP Server
The system SHALL use Fastify framework for all HTTP handling (no Express, no native http module).

#### Scenario: Server starts on port 9091
- **WHEN** running `npm run dev`
- **THEN** Fastify server listens on `localhost:9091`

#### Scenario: Request/response handling via Fastify
- **WHEN** HTTP request received
- **THEN** request parsed and response sent using Fastify APIs

### Requirement: ESM Module System
The system SHALL use ECMAScript Modules (ESM) exclusively — no CommonJS `require()`.

#### Scenario: All imports use ESM syntax
- **WHEN** importing modules
- **THEN** all imports use `import ... from ...` syntax

### Requirement: Layered Architecture Enforcement
The system SHALL enforce three-layer architecture: `src/domain` (types/Zod, no IO) → `src/service` (business logic) → `src/routes` (HTTP handlers). Layers MUST NOT skip.

#### Scenario: Route calls service, not domain directly
- **WHEN** route handler executes
- **THEN** it calls service methods, never imports from `src/domain` for logic

#### Scenario: Service uses domain types only
- **WHEN** service method executes
- **THEN** it uses only `src/domain/types` and `src/domain/errors`, no HTTP types

#### Scenario: Domain has zero IO dependencies
- **WHEN** inspecting `src/domain/**/*.ts`
- **THEN** no imports of `fs`, `http`, `net`, or other IO modules