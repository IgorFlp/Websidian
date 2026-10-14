## Why

The current API is implemented as a single monolithic `api.js` file (~1750 lines) using Express.js, JavaScript, and manual Swagger annotations. This creates maintenance challenges: no type safety, difficult testing, tightly coupled concerns, and Swagger docs that drift from implementation. The refactor to TypeScript ESM with strict typing, Zod validation at boundaries, Fastify framework, and auto-generated OpenAPI from Zod schemas via fastify-swagger will provide type safety, testability, clear layer separation, and guaranteed documentation accuracy.

## What Changes

- **BREAKING**: Replace Express.js with Fastify for HTTP handling
- **BREAKING**: Migrate from JavaScript (ESM) to TypeScript (ESM, strict mode)
- **BREAKING**: Restructure from single `api.js` to layered architecture: `src/domain` (types + Zod schemas, no IO), `src/service` (business logic), `src/routes` (HTTP handlers)
- **BREAKING**: Add Zod validation at all HTTP boundaries (request body, query, params, headers) via `fastify-zod`
- **NEW**: Domain errors as classes translated to HTTP responses at route boundary
- **NEW**: Auto-generate OpenAPI/Swagger from Zod schemas using `fastify-swagger` plugin
- **NEW**: Tests using `node:test` via `tsx` runner alongside implementation
- **NEW**: Dev scripts: `dev` (API on localhost:9091 + frontend static serve), `test`, `typecheck`
- **PRESERVED**: All existing API endpoints, behaviors, authentication, session handling, and Swagger UI at `/api-docs`
- **PRESERVED**: All existing service classes (ChatService, SessionsService, ProfilesService, AudioFileManager, HTMLRenderer, HTMLRepository, HermesClient)

## Capabilities

### New Capabilities

- `typescript-api-core`: TypeScript strict-mode API foundation with Fastify, request/response typing, and error handling
- `zod-validation-layer`: Zod schemas for all external inputs (body, query, params, headers) with automatic OpenAPI generation via `fastify-zod`
- `domain-error-handling`: Domain error classes with HTTP translation at route boundary
- `auto-openapi-generation`: OpenAPI 3.1 spec generated from Zod schemas via `fastify-swagger`, served at `/swagger.json` and `/api-docs`
- `test-infrastructure`: Node test runner with tsx, test utilities, and coverage thresholds

### Modified Capabilities

- `authentication`: Session-based auth migrated to new route structure with Zod-validated login credentials
- `vault-management`: Vault listing endpoint restructured with typed responses
- `file-operations`: File tree, content, and download endpoints with Zod validation
- `task-management`: Task scanning, parsing, and toggle endpoints with typed schemas
- `preset-management`: CRUD + reorder + file management for presets with Zod validation
- `notes-creation`: Daily note creation/append with typed request/response
- `hermes-chat`: Streaming chat, message polling, session management with typed contracts
- `profile-management`: Hermes profile listing with typed response
- `audio-tts-stt`: TTS generation, STT transcription, audio file serving with Range support
- `terminal-io`: Terminal input/output with long-polling, typed request/response

## Impact

**Affected code (server/ only):**
- `api.js` → decomposed into `src/routes/*.ts`, `src/service/*.ts`, `src/domain/*.ts`
- `bootstrap.js` → rewritten as TypeScript entry point with Fastify server
- `package.json` → new dependencies: `typescript`, `tsx`, `zod`, `fastify`, `fastify-swagger`, `fastify-zod`, `@fastify/swagger-ui`, `@types/node`; devDependencies for test/typecheck; scripts for dev/test/typecheck
- `swagger.yaml` → replaced by auto-generated OpenAPI from Zod schemas via fastify-swagger
- All service files in `src/` → migrated to TypeScript with strict typing
- New test files alongside implementation (`*.test.ts`)

**Dependencies:**
- Remove: `express`, `express-session`, `swagger-ui-express`, `yaml`, `multer`, `body-parser`
- Add: `typescript`, `tsx`, `zod`, `fastify`, `fastify-swagger`, `fastify-zod`, `@fastify/swagger-ui`, `@types/node`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/static`

**Systems:** No external system changes. Internal service classes (HermesClient, AudioFileManager, etc.) retain behavior but gain TypeScript types.