## Context

Websidian currently exposes a REST API used by its own frontend (ES5-compatible for Android 4) and potentially by external clients. The `GET /api/tasks` endpoint accepts only `path` and `vault` query parameters and returns all tasks, requiring clients to filter locally. Hermes currently parses HTML/JSON responses using regex, consuming excessive context tokens.

We need to:
1. Replace `GET /api/tasks` with `POST /api/tasks/list` accepting a `TaskFilter` body for server-side filtering
2. Add API_KEY authentication for MCP access (bypassing session-based login)
3. Create an MCP server exposing structured tools for tasks, notes, presets, and vaults
4. Migrate frontend to new endpoint while maintaining Android 4 compatibility

## Goals / Non-Goals

**Goals:**
- Server-side task filtering by date range (startDate/finishDate) and boolean flags (Done, Scheduled, Due)
- API_KEY authentication for programmatic MCP access
- MCP server with 12 tools covering tasks, notes, presets, vaults
- Frontend migration with zero breaking changes for end users
- Maintain ES5/ES3 compatibility for Android 4 stock browser

**Non-Goals:**
- File operations (list, read, download) - Hermes accesses filesystem directly
- Chat/session endpoints - would create circular dependency with Hermes Gateway
- Voice/audio endpoints - managed by user's API, not Hermes
- Terminal polling - slated for removal
- OAuth/JWT - simple API_KEY is sufficient for trusted MCP client

## Decisions

### 1. Task Filtering Implementation
**Decision**: Add `filterTasks` method to `TasksService` that accepts `TaskFilter` and applies filtering after scanning.

**Rationale**: Keeps scanning logic separate from filtering logic. Scanning is I/O heavy; filtering is in-memory and fast.

**Alternatives considered**:
- Filter during scan: Would complicate scanner with filter logic, harder to test
- Database/index: Overkill for markdown-based task storage

### 2. API_KEY Authentication
**Decision**: Add `MCP_API_KEY` to config. Create `validateApiKey(key)` in `AuthService`. Apply via Fastify hook on MCP routes.

**Rationale**: Simple, stateless, no session overhead. Environment variable configuration matches existing pattern.

**Alternatives considered**:
- JWT: Requires key rotation, more complex
- Separate auth service: Overhead for single key validation

### 3. MCP Server Architecture
**Decision**: Create standalone MCP server (`server/src/mcp/index.ts`) that imports existing services (TasksService, NotesService, PresetsService) and exposes tools via MCP protocol (stdio or HTTP).

**Rationale**: Reuses existing business logic. Can run as separate process or embedded. stdio transport is standard for MCP.

**Alternatives considered**:
- Integrate into main Fastify app: Would complicate auth (session vs API_KEY mixed)
- Separate repo: Harder to share services/types

### 4. Frontend Migration Strategy
**Decision**: Dual-endpoint support during transition. New `POST /api/tasks/list` for MCP/frontend. Keep `GET /api/tasks` as deprecated alias that transforms query params to TaskFilter and calls new endpoint.

**Rationale**: Zero-downtime migration. Frontend can migrate incrementally. Android 4 polyfills already exist in `tasks.js`.

**Alternatives considered**:
- Hard cutover: Risk of breaking Android 4 clients
- Separate versioned API: More complex routing

### 5. Date Filtering Logic
**Decision**: When `startDate` AND `finishDate` provided, include task if ANY of (scheduled, due, doneDate) falls within [startDate, finishDate]. When boolean flags (Done/Scheduled/Due) are false, exclude tasks with those properties set.

**Rationale**: Matches user requirement: "tasks que estão com scheduled, due, done nas datas ENTRE inicio e fim"

**Alternatives considered**:
- Require ALL dates in range: Too restrictive
- Separate date fields per property: More complex API

### 6. TaskFilter Defaults
**Decision**: `Done: true`, `Scheduled: true`, `Due: true` - all included by default. Only explicit `false` excludes.

**Rationale**: Backward compatible - existing behavior returns all tasks.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking change for external API consumers | Deprecation period with `GET /api/tasks` alias; log warnings |
| Android 4 fetch/POST issues | Use existing `httpPost` polyfill (XHR-based), test on Android 4 emulator |
| MCP server auth bypass | API_KEY required on all MCP tool endpoints; rate limiting |
| Date parsing inconsistencies | Use ISO 8601 (YYYY-MM-DD) exclusively; parse in service layer |
| Frontend localStorage filter mismatch | Frontend sends `files` array in TaskFilter; server ignores unknown fields |
| Concurrent task toggles | File-based locking not feasible; accept last-write-wins (low risk) |

## Migration Plan

### Phase 1: Backend API Changes
1. Add `TaskFilter` schema to `server/src/domain/schemas/tasks.ts`
2. Add `filterTasks` method to `TasksService`
3. Add `POST /api/tasks/list` endpoint in `tasks.ts` routes
4. Add `GET /api/tasks` deprecated alias (transforms query → TaskFilter → calls new endpoint)
5. Add `MCP_API_KEY` to config and `AuthService.validateApiKey()`
6. Add API_KEY auth hook for `/api/tasks/list` and future MCP endpoints

### Phase 2: Frontend Migration
1. Update `public/tasks.js` `loadTasks()` to use `httpPost("/api/tasks/list", filter)`
2. Update `public/scheduled.js` `loadTasks()` to use `httpPost("/api/tasks/list", filter)`
3. Build TaskFilter from localStorage (filterFiles, date ranges if added to UI)
4. Test on Android 4 emulator

### Phase 3: MCP Server
1. Create `server/src/mcp/index.ts` with MCP server setup (stdio transport)
2. Register tools: `tasks_list`, `task_toggle`, `note_create`, `presets_list`, `preset_create`, `preset_update`, `preset_delete`, `preset_reorder`, `preset_files_update`, `vaults_list`
3. Each tool calls existing services with API_KEY auth
4. Add `mcp:start` script to package.json

### Phase 4: Cleanup
1. Remove deprecated `GET /api/tasks` after verification period
2. Document MCP configuration (MCP_API_KEY env var)

## Open Questions

1. **MCP Transport**: stdio only, or also HTTP/SSE for remote access?
stdio
2. **Rate Limiting**: Should MCP endpoints have rate limits separate from main API?
Yes
3. **Vault Selection**: MCP tools accept `vaultIndex` optional (default 0). Should `vaults_list` be called first?
Yes, MCP is action based, if any API call needs a info from another endpoint MCP action should do it first só the agent calls only 1 action.
4. **Preset Files Update**: Current `PUT /api/presets/:id/files` expects `{path, order}[]`. MCP tool `preset_files_update` matches this.

5. **Error Handling**: Standardize MCP tool errors (MCP error codes vs HTTP status codes)?
MCP error codes.