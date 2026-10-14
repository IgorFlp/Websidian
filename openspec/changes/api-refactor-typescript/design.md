## Context

The current `server/api.js` is a ~1750-line Express.js monolith containing all HTTP routes, middleware, business logic, and inline Swagger JSDoc annotations. Services (ChatService, SessionsService, ProfilesService, AudioFileManager, HTMLRenderer, HTMLRepository, HermesClient) exist in `src/` but are JavaScript with no type safety. Swagger documentation lives in `swagger.yaml` and `/api-docs` UI, manually maintained and prone to drift.

Constraints from requirements:
- Node 22 LTS, TypeScript ESM strict mode
- Use Fastify framework (replaces Express)
- Zod at HTTP boundaries (body, query, params, headers) via `fastify-zod`
- Layered architecture: `src/domain` (types + Zod, no IO), `src/service` (logic), `src/routes` (HTTP handlers)
- Domain errors as classes, translated at route boundary
- Auto-generated OpenAPI from Zod schemas via `fastify-swagger`
- Tests with `node:test` via `tsx`, co-located with implementation
- Dev server on localhost:9091 serving API + frontend static files
- No behavior changes — pure extraction and translation
- No modifications outside `/server`
- No main branch commits — work on `api-refactor-typescript` branch only

## Goals / Non-Goals

**Goals:**
- Full TypeScript strict-mode migration with zero `any` in domain/service layers
- Fastify server with typed request/response handling via `fastify-zod`
- Zod schemas for every external input, generating OpenAPI 3.1 automatically via `fastify-swagger`
- Clear layer boundaries: Route → Service → Domain (no skipping)
- Domain error classes with HTTP translation at route edge
- Test infrastructure with `node:test` + `tsx`, tests written with new logic
- Dev script: `npm run dev` starts API on :9091 + serves `public/` static files
- `npm run test` and `npm run typecheck` pass in CI
- Swagger UI at `/api-docs` fed by generated `/swagger.json` (via `@fastify/swagger-ui`)

**Non-Goals:**
- No changes to frontend templates, HTML, or SSR rendering
- No changes to HermesClient protocol or external API contracts
- No database or persistence layer changes (file-based presets remain)
- No authentication mechanism changes (session cookie remains)
- No modification of `main` branch
- No changes outside `/server` directory

## Decisions

### 1. HTTP Server: Fastify with Zod Integration

**Decision**: Use Fastify as the HTTP framework with `fastify-zod` for request validation and `fastify-swagger` for OpenAPI generation.

**Rationale**: Fastify provides high performance, built-in validation, serialization, and OpenAPI integration. `fastify-zod` enables type-safe request/response validation using Zod schemas directly. `fastify-swagger` generates OpenAPI 3.1 from Zod schemas automatically. This replaces the need for custom http wrappers, router, and manual OpenAPI generation.

**Alternatives considered**:
- Native `http` with custom wrappers — rejected (high maintenance, reinventing framework features)
- Express with `zod-express-middleware` — rejected (Express not preferred, less performant)
- Hono — rejected (less ecosystem for OpenAPI generation)

**Implementation**: 
- `src/bootstrap.ts`: Create Fastify instance, register plugins (`@fastify/cookie`, `@fastify/multipart`, `@fastify/static`, `fastify-zod`, `fastify-swagger`, `@fastify/swagger-ui`)
- Configure `fastify-zod` with global Zod schemas
- Configure `fastify-swagger` with OpenAPI 3.1 spec, expose at `/swagger.json`
- Register `@fastify/swagger-ui` at `/api-docs`
- Use Fastify's built-in routing: `fastify.get('/api/files', { schema: { querystring: GetFilesQuerySchema, response: { 200: GetFilesResponseSchema } } }, handler)`

### 2. Routing & Validation: Fastify Schema-Based with Zod

**Decision**: Use Fastify's native schema-based routing with Zod schemas via `fastify-zod`. Route registration includes `schema` object with `querystring`, `params`, `body`, `headers`, `response` validated automatically.

**Rationale**: Fastify's schema validation runs before handler, provides automatic 400 responses with detailed errors. `fastify-zod` bridges Zod schemas to Fastify's JSON Schema format. Type-safe handlers via `fastify-type-provider-zod`.

**Implementation**: 
- Install `fastify-type-provider-zod` for TypeScript inference
- Route pattern: `fastify.withTypeProvider<ZodTypeProvider>().get('/api/files', { schema: { querystring: GetFilesQuerySchema, response: { 200: GetFilesResponseSchema } } }, async (req, res) => { ... })`
- Request types inferred from schemas: `req.query` typed as `z.infer<typeof GetFilesQuerySchema>`
- Response serialization validated against `response` schema

### 3. Zod Schemas in `src/domain/schemas/`

**Decision**: One Zod schema file per capability (e.g., `files.ts`, `tasks.ts`, `presets.ts`, `chat.ts`, `audio.ts`, `auth.ts`, `terminal.ts`). Each exports:
- `*Request` — input validation (body/query/params/headers combined)
- `*Response` — output shape for OpenAPI generation
- `*Params` / `*Query` / `*Body` — granular schemas for route-level validation

**Rationale**: Co-locating request/response schemas per capability keeps related types together. Granular schemas enable route-level validation via Fastify schema.

**OpenAPI generation**: Use `fastify-swagger` which automatically extracts schemas from route definitions. Aggregate in `src/openapi/generator.ts` only if needed for custom extensions; otherwise `fastify-swagger` generates from registered routes.

### 4. Domain Types in `src/domain/types/`

**Decision**: Pure TypeScript interfaces/types (no Zod) for internal service contracts, derived from Zod schemas via `z.infer<typeof Schema>`.

**Rationale**: Separates validation concerns (Zod at boundary) from internal type safety. Services consume/produce `z.infer` types, never raw `unknown`.

**Files**: `vault.ts`, `file.ts`, `task.ts`, `preset.ts`, `note.ts`, `chat.ts`, `session.ts`, `profile.ts`, `audio.ts`, `terminal.ts`, `error.ts`.

### 5. Domain Errors in `src/domain/errors/`

**Decision**: Error classes extending `Error` with `statusCode` and `code` properties. Translated to HTTP in route layer via `handleError(err, res)`.

```typescript
// src/domain/errors/index.ts
export class DomainError extends Error {
  constructor(public readonly code: string, public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}

export class ValidationError extends DomainError {
  constructor(public readonly issues: z.ZodIssue[]) {
    super('VALIDATION_ERROR', 400, 'Invalid input');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor() {
    super('UNAUTHORIZED', 401, 'Unauthorized');
  }
}

export class ForbiddenError extends DomainError {
  constructor() {
    super('FORBIDDEN', 403, 'Forbidden');
  }
}

export class InternalError extends DomainError {
  constructor(cause?: Error) {
    super('INTERNAL_ERROR', 500, cause?.message ?? 'Internal server error');
    this.name = 'InternalError';
  }
}
```

**Rationale**: Typed errors enable exhaustive handling in routes. Translation at boundary keeps services HTTP-agnostic.

### 6. Service Layer in `src/service/`

**Decision**: Migrate existing service classes to TypeScript with strict typing. Each service:
- Depends only on `src/domain/types` and other services (injected via constructor)
- Throws `DomainError` subclasses for business rule violations
- Returns `z.infer<OutputSchema>` types
- No HTTP concerns (no `req`/`res`, no status codes)

**Files**:
- `chat.service.ts` → `ChatService` (wraps HermesClient, HTMLRepository, AudioFileManager)
- `sessions.service.ts` → `SessionsService`
- `profiles.service.ts` → `ProfilesService`
- `audio.service.ts` → `AudioFileManager` (rename from class to service)
- `files.service.ts` → `FilesService` (new, extracts file tree/content logic from api.js)
- `tasks.service.ts` → `TasksService` (new, extracts task scanning/parsing/toggle)
- `presets.service.ts` → `PresetsService` (new, extracts preset CRUD)
- `notes.service.ts` → `NotesService` (new, extracts daily note logic)
- `terminal.service.ts` → `TerminalService` (new, wraps terminalManager)
- `auth.service.ts` → `AuthService` (new, session validation)

### 7. Route Layer in `src/routes/`

**Decision**: One route file per capability, exporting `registerRoutes(router, services)`.

**Pattern**:
```typescript
// src/routes/files.ts
import { z } from 'zod';
import { router } from '../http/router';
import { FilesService } from '../service/files.service';
import { GetFilesQuerySchema, GetFilesResponseSchema } from '../domain/schemas/files';
import { handleError } from '../domain/errors';

export function registerFilesRoutes(router: Router, filesService: FilesService) {
  router.register('GET', '/api/files', async (req, res) => {
    const query = GetFilesQuerySchema.parse(parseQuery(req.url));
    const vaultIndex = query.vault ?? 0;
    const flat = query.flat === 'true';
    try {
      const result = flat
        ? await filesService.getFlatFiles(vaultIndex)
        : await filesService.getFileTree(vaultIndex);
      res.json(GetFilesResponseSchema.parse(result));
    } catch (err) {
      handleError(err, res);
    }
  });
}
```

**Rationale**: Thin routes = easy testing, clear separation. Validation at entry, domain errors caught at exit.

### 8. Session/Authentication

**Decision**: Use `@fastify/cookie` plugin for session cookie parsing. Create `AuthService` with `validateSession(request)` returning `SessionData | null`. Route middleware: `withAuth` hook wraps handler, injects `session` into request context via `request.session`.

**Rationale**: `@fastify/cookie` provides signed cookie parsing compatible with `express-session` format. Fastify hooks allow clean authentication middleware.

**Implementation**: Register `@fastify/cookie` with secret from config. Session store remains in-memory (compatible with `express-session` memory store). Hook `onRequest` validates session for protected routes.

### 9. Static File Serving & Frontend

**Decision**: Use `@fastify/static` plugin to serve `public/` directory. SPA fallback: root route `/` serves `index.html` if authenticated, else redirects to `/login`.

**Rationale**: `@fastify/static` provides efficient static file serving with etag, caching, compression. Integrates natively with Fastify.

**Implementation**: Register `@fastify/static` with `root: path.join(__dirname, '..', 'public')`. Add root route handler for SPA fallback with auth check.

### 10. Multipart/Form-Data (Audio Upload, STT)

**Decision**: Use `@fastify/multipart` plugin for streaming multipart parsing. Zod schema validates parsed fields/files via `fastify-zod`.

**Rationale**: `@fastify/multipart` handles file uploads natively with streaming, integrates with Fastify schema validation.

**Implementation**: Register `@fastify/multipart` with limits. Route schema includes `body` as Zod schema with `file` field. Handler receives parsed `req.body` with files.

### 11. Audio File Serving with Range Requests

**Decision**: Implement custom route for `/audio/:id` with Range header support. Use Fastify's `reply.send(fileStream)` with manual Range parsing for 206 Partial Content.

**Rationale**: Existing implementation in api.js lines 1516-1561 must be preserved exactly. `@fastify/static` doesn't support dynamic Range handling for managed audio files.

**Implementation**: Route handler parses `Range` header, creates `fs.createReadStream` with `{ start, end }`, sets `Content-Range`, `Accept-Ranges`, `Content-Length` headers, returns 200 or 206.

### 12. Long-Polling for Terminal (`/terminal/poll`)

**Decision**: Keep async generator pattern with 30s timeout. Route holds response open until data or timeout using Fastify's `reply.raw` for low-level control.

**Rationale**: Existing behavior (api.js lines 1391-1439) must be preserved.

**Implementation**: Route handler uses `setTimeout` and polling loop. On data, `reply.send({ since, html, audio })`. On timeout, `reply.send({ since: Date.now(), html: '', audio: [] })`.

### 13. Swagger/OpenAPI Generation: fastify-swagger

**Decision**: Use `fastify-swagger` plugin to generate OpenAPI 3.1 from route schemas. Serve `/swagger.json` via plugin. Swagger UI at `/api-docs` via `@fastify/swagger-ui` plugin.

**Rationale**: `fastify-swagger` automatically extracts schemas from registered routes (which use Zod via `fastify-zod`). Zero-maintenance OpenAPI generation — docs always match implementation.

**Implementation**: 
- Register `fastify-swagger` with `openapi: { info: { title: 'Websidian API', version: '1.0.0' }, components: { securitySchemes: { sessionAuth: { type: 'apiKey', in: 'cookie', name: 'connect.sid' } } } }`
- Register `@fastify/swagger-ui` with `routePrefix: '/api-docs'`, `uiConfig: { docExpansion: 'list' }`, `uiHooks: { onRequest: (request, reply, next) => next() }`
- Route schemas defined via `fastify-zod` automatically included
- `/swagger.json` served automatically by `fastify-swagger`

### 14. Configuration/Environment

**Decision**: No `.env` reading in code (requirement). Config via `process.env` accessed only in `src/config/index.ts` which exports typed `Config` object. Services receive config via constructor injection. Fastify plugins receive config via options.

**Rationale**: "NUNCA commitar segredos, nem ler .env" — config centralized, testable via injection.

### 15. Testing Strategy

**Decision**: 
- Unit tests: `src/service/*.test.ts` testing services with mocked dependencies
- Integration tests: `src/routes/*.test.ts` testing full request/response via Fastify test server (`fastify.inject()`)
- Contract tests: Zod schema validation tests in `src/domain/schemas/*.test.ts`
- Run via `tsx --test` (Node 22 native test runner)

**Coverage**: Minimum 80% lines/branches/functions for service/route layers.

**Fastify Testing**: Use `fastify.inject({ method, url, payload, headers, cookies })` for fast in-memory integration tests without network overhead.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Fastify schema validation differs from Express middleware | Use `fastify-zod` + `fastify-type-provider-zod` for type-safe validation; test thoroughly |
| Zod-to-JSON-Schema conversion via fastify-swagger may not cover all OpenAPI features | Current swagger.yaml uses standard REST — compatible; test generated spec |
| Session parsing with @fastify/cookie vs express-session | Validate cookie format compatibility; test login/logout flow end-to-end |
| Multipart parsing with @fastify/multipart | Test file upload + transcription flow; configure limits appropriately |
| Large refactor surface (~1750 lines → ~30 files) | Incremental extraction per capability; run tests after each |
| TypeScript strict mode on legacy JS code | Enable strict gradually; use `@ts-expect-error` sparingly during migration |
| Swagger UI via @fastify/swagger-ui | Configure routePrefix `/api-docs`; test "Try it out" functionality |
| Terminal long-polling with Fastify | Preserve exact timeout/logic from api.js; use `reply.raw` for low-level control; test under load |
| Audio Range requests with custom handler | Port existing implementation 1:1; add integration test |
| Fastify plugin registration order matters | Document plugin order: cookie → multipart → static → zod → swagger → swagger-ui |

## Migration Plan

1. **Setup** (Day 1):
   - Create `api-refactor-typescript` branch
   - Add `package.json` with TypeScript, tsx, zod, fastify, fastify-swagger, fastify-zod, fastify-type-provider-zod, @fastify/swagger-ui, @fastify/cookie, @fastify/multipart, @fastify/static, @types/node
   - Add `tsconfig.json` (strict, ESM, node22)
   - Add `src/config/`, `src/domain/errors/`
   - Verify `npm run typecheck` passes on empty project

2. **Domain Schemas & Types** (Day 1-2):
   - Extract Zod schemas from swagger.yaml → `src/domain/schemas/*.ts`
   - Create `src/domain/types/*.ts` with `z.infer` exports
   - Add `.openapi()` metadata to schemas for fastify-swagger extensions
   - Create `src/openapi/generator.ts` (optional, for custom extensions only)

3. **Services Extraction** (Day 2-4, per capability):
   - For each capability: create service in `src/service/*.ts`, migrate logic from api.js + existing `src/` classes
   - Add unit tests (`*.test.ts`) for each service
   - Run `npm run test` after each

4. **Routes Extraction** (Day 3-5, per capability):
   - Create route files in `src/routes/*.ts` using Fastify schema-based routing with Zod
   - Register routes with `fastify.withTypeProvider<ZodTypeProvider>()`
   - Wire Zod validation (automatic via schema), service calls, error handling
   - Register in `src/routes/index.ts`
   - Add integration tests using `fastify.inject()`

5. **Auth & Session** (Day 3):
   - Register `@fastify/cookie` plugin
   - `AuthService` + `withAuth` hook
   - Migrate `/login`, `/logout`, `/vaults`

6. **Static Files & Frontend** (Day 4):
   - Register `@fastify/static` for `public/` directory
   - SPA fallback + auth redirect for `/`
   - Serve `/files`, `/scheduled`, `/tasks` HTML pages with auth
   - Serve `/download` for vault Downloads folder with auth

7. **OpenAPI & Swagger UI** (Day 4):
   - Register `fastify-swagger` plugin with OpenAPI config
   - Register `@fastify/swagger-ui` at `/api-docs`
   - Verify `/swagger.json` and `/api-docs` work

8. **Bootstrap & Dev Server** (Day 5):
   - `bootstrap.ts` entry point: create Fastify, register plugins, routes, start server
   - Add startup cleanup (audio dirs, temp files) matching api.js behavior
   - Add `dev` script: `tsx watch src/bootstrap.ts`
   - Verify `npm run dev` starts API + serves frontend on :9091

9. **Test & Typecheck Hardening** (Day 5):
   - Full test suite pass
   - Typecheck clean
   - Coverage thresholds met

10. **Validation** (Day 5):
    - Manual smoke test via Swagger UI at `/api-docs`
    - Compare generated `/swagger.json` with original `swagger.yaml`
    - Verify no behavior changes

## Open Questions

1. **Session store**: Current `express-session` uses memory store. Keep in-memory or migrate to file-backed for persistence across restarts?
2. **Terminal manager**: `terminalManager` referenced in api.js but not in `src/` — where is it defined? Need to locate and migrate.
3. **WebSocket/SSE**: Current chat uses polling (`/messages/:sessionId`). Future: consider SSE for streaming? (Non-goal for now)
4. **HTTPS/HTTP2**: Dev server HTTP only? Production termination at reverse proxy?
5. **Rate limiting**: Not in current API. Add as separate capability later?