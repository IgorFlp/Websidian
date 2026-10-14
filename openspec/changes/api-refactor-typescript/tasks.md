## 1. Project Setup & Configuration

- [x] 1.1 Create `api-refactor-typescript` branch from current HEAD
- [x] 1.2 Update `server/package.json`: add dependencies (`typescript`, `tsx`, `zod`, `fastify`, `fastify-swagger`, `fastify-zod`, `fastify-type-provider-zod`, `@fastify/swagger-ui`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/static`, `@types/node`), devDependencies, scripts (`dev`, `test`, `typecheck`), remove `express`, `express-session`, `swagger-ui-express`, `yaml`, `multer`, `body-parser`
- [x] 1.3 Create `server/tsconfig.json` (strict, ESM, target ES2022, module NodeNext, outDir `dist`, rootDir `src`)
- [x] 1.4 Create `server/.gitignore` for `dist/`, `node_modules/`, `.env`
- [x] 1.5 Verify `npm run typecheck` passes on empty project

## 2. Domain Layer: Errors & Config

- [x] 2.1 Create `src/domain/errors/index.ts`: `DomainError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `InternalError`, `handleError(err, reply)`
- [x] 2.2 Create `src/domain/errors/error-schemas.ts`: Zod schemas for error responses (matching swagger `Error` schema)
- [x] 2.3 Create `src/config/index.ts`: typed `Config` object from `process.env` with validation, no `.env` reading
- [x] 2.4 Write tests for error classes and `handleError` translation

## 3. Domain Layer: Zod Schemas (per capability)

- [x] 3.1 Create `src/domain/schemas/auth.ts`: `LoginRequestSchema`, `LoginResponseSchema` (redirect), `SessionSchema`
- [x] 3.2 Create `src/domain/schemas/vaults.ts`: `VaultSchema`, `ListVaultsResponseSchema`
- [x] 3.3 Create `src/domain/schemas/files.ts`: `FileNodeSchema`, `ApiFilesResponseSchema`, `GetFilesQuerySchema`, `FileContentQuerySchema`, `FileContentResponseSchema`, `DownloadQuerySchema`
- [x] 3.4 Create `src/domain/schemas/tasks.ts`: `TaskSchema`, `TaskToggleRequestSchema`, `TaskToggleResponseSchema`, `ScanTasksQuerySchema`
- [x] 3.5 Create `src/domain/schemas/presets.ts`: `PresetSchema`, `PresetsResponseSchema`, `CreatePresetRequestSchema`, `UpdatePresetRequestSchema`, `ReorderPresetsRequestSchema`, `PresetFilesRequestSchema`
- [x] 3.6 Create `src/domain/schemas/notes.ts`: `NewNoteRequestSchema`, `NewNoteResponseSchema`
- [x] 3.7 Create `src/domain/schemas/chat.ts`: `ChatRequestSchema`, `ChatResponseSchema`, `MessagesParamsSchema`, `SessionsQuerySchema`, `SessionSchema`, `CreateSessionRequestSchema`
- [x] 3.8 Create `src/domain/schemas/profiles.ts`: `ProfileSchema`, `ProfilesResponseSchema`
- [x] 3.9 Create `src/domain/schemas/audio.ts`: `TTSRequestSchema`, `TTSResponseSchema`, `TTSCheckParamsSchema`, `TTSCheckResponseSchema`, `STTRequestSchema`, `STTResponseSchema`, `UploadAudioResponseSchema`, `AudioParamsSchema`
- [x] 3.10 Create `src/domain/schemas/terminal.ts`: `TerminalInputRequestSchema`, `TerminalInputResponseSchema`, `TerminalPollQuerySchema`, `TerminalPollResponseSchema`
- [x] 3.11 Add `.openapi({ description, examples })` metadata to all schemas for fastify-swagger
- [x] 3.12 Write contract tests for each schema (parse valid, reject invalid, metadata present)

## 4. Domain Layer: TypeScript Types

- [x] 4.1 Create `src/domain/types/index.ts`: re-export all `z.infer<typeof Schema>` types
- [x] 4.2 Create capability-specific type files: `auth.ts`, `vaults.ts`, `files.ts`, `tasks.ts`, `presets.ts`, `notes.ts`, `chat.ts`, `sessions.ts`, `profiles.ts`, `audio.ts`, `terminal.ts`

## 5. Service Layer: Core Services Migration

- [x] 5.1 Migrate `src/hermes/HermesClient.js` → `src/service/hermes.client.ts` (TypeScript, strict types, inject config)
- [x] 5.2 Migrate `src/html/HTMLRenderer.js` → `src/service/html.renderer.ts`
- [x] 5.3 Migrate `src/html/HTMLRepository.js` → `src/service/html.repository.ts`
- [x] 5.4 Migrate `src/audio/AudioFileManager.js` → `src/service/audio.service.ts`
- [x] 5.5 Migrate `src/chat/ChatService.js` → `src/service/chat.service.ts`
- [x] 5.6 Migrate `src/sessions/SessionsService.js` → `src/service/sessions.service.ts`
- [x] 5.7 Migrate `src/profiles/ProfilesService.js` → `src/service/profiles.service.ts`
- [x] 5.8 Create `src/service/files.service.ts` (extract file tree/content logic from api.js)
- [x] 5.9 Create `src/service/tasks.service.ts` (extract task scanning/parsing/toggle from api.js)
- [x] 5.10 Create `src/service/presets.service.ts` (extract preset CRUD from api.js)
- [x] 5.11 Create `src/service/notes.service.ts` (extract daily note logic from api.js)
- [x] 5.12 Create `src/service/terminal.service.ts` (wrap terminalManager from api.js)
- [x] 5.13 Create `src/service/auth.service.ts` (session validation, login/logout logic)
- [x] 5.14 Write unit tests for each service (mock dependencies, test happy paths + errors)

## 6. Route Layer: Capability Routes (Fastify + Zod)

- [x] 6.1 Create `src/routes/auth.ts`: `POST /login`, `GET /logout`, `GET /vaults`, `GET /login` (page), `GET /` (redirect) with Fastify schema
- [x] 6.2 Create `src/routes/files.ts`: `GET /api/files`, `GET /api/file-content`, `GET /download` with Fastify schema
- [x] 6.3 Create `src/routes/tasks.ts`: `GET /api/tasks`, `POST /api/tasks/toggle` with Fastify schema
- [x] 6.4 Create `src/routes/presets.ts`: `GET/POST /api/presets`, `PUT/DELETE /api/presets/:id`, `PUT /api/presets/reorder`, `PUT /api/presets/:id/files` with Fastify schema
- [x] 6.5 Create `src/routes/notes.ts`: `POST /api/newNote` with Fastify schema
- [x] 6.6 Create `src/routes/chat.ts`: `POST /chat`, `GET /messages/:sessionId`, `GET /sessions`, `POST /sessions` with Fastify schema
- [x] 6.7 Create `src/routes/profiles.ts`: `GET /profiles` with Fastify schema
- [x] 6.8 Create `src/routes/audio.ts`: `POST /api/tts`, `GET /api/tts/:messageId`, `POST /api/stt`, `POST /api/upload-audio`, `GET /audio/:id` with Fastify schema
- [x] 6.9 Create `src/routes/terminal.ts`: `POST /terminal/input`, `GET /terminal/poll` with Fastify schema
- [x] 6.10 Create `src/routes/static.ts`: SPA fallback for `/`, serve HTML pages with auth
- [x] 6.11 Create `src/routes/index.ts`: register all route groups with Fastify instance
- [ ] 6.12 Write integration tests for each route group using `fastify.inject()`

## 7. Fastify Plugins & OpenAPI

- [x] 7.1 Create `src/plugins/index.ts`: register plugins in order: `@fastify/cookie`, `@fastify/multipart`, `@fastify/static`, `fastify-zod`, `fastify-swagger`, `@fastify/swagger-ui`
- [x] 7.2 Configure `fastify-swagger`: OpenAPI 3.1 info, securitySchemes (sessionAuth), components
- [x] 7.3 Configure `@fastify/swagger-ui`: routePrefix `/api-docs`, uiConfig
- [ ] 7.4 Verify `/swagger.json` served by fastify-swagger matches original `swagger.yaml`
- [ ] 7.5 Verify `/api-docs` Swagger UI loads with "Try it out" functional

## 8. Bootstrap & Dev Server

- [x] 8.1 Create `src/bootstrap.ts`: initialize config, create Fastify instance, register plugins, routes, start server on :9091
- [x] 8.2 Add startup cleanup (audio dirs, temp files) matching api.js behavior
- [x] 8.3 Add `dev` script: `tsx watch src/bootstrap.ts`
- [ ] 8.4 Verify `npm run dev` starts API + serves frontend on :9091

## 9. TTS Config Endpoint

- [ ] 9.1 Implement `GET /api/tts-config` returning `{ url, autoPlay }` from env

## 10. Test Infrastructure & Coverage

- [ ] 10.1 Configure `tsx --test` with `--coverage` in `package.json`
- [ ] 10.2 Add coverage thresholds (80% lines/branches/functions for service/routes)
- [ ] 10.3 Run full test suite, verify all pass

## 11. Validation & Cleanup

- [ ] 11.1 Run `npm run typecheck` — zero errors
- [ ] 11.2 Run `npm run test` — all tests pass, coverage thresholds met
- [ ] 11.3 Manual smoke test via Swagger UI at `/api-docs` (all endpoints documented, try-it-out works)
- [ ] 11.4 Compare generated `/swagger.json` with original `swagger.yaml` for completeness
- [ ] 11.5 Verify no behavior changes: login, file ops, tasks, presets, notes, chat, sessions, profiles, audio, terminal all work identically
- [ ] 11.6 Delete `server/api.js`, `server/swagger.yaml`, `server/bootstrap.js` (replaced by `src/bootstrap.ts`)
- [ ] 11.7 Update `server/package.json` `main` to `dist/bootstrap.js`
- [ ] 11.8 Final commit on `api-refactor-typescript` branch