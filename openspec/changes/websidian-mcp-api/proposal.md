## Why

The current Websidian API requires Hermes to use regex-based parsing of HTML/JSON responses to extract task data, consuming excessive context tokens. We need a dedicated MCP (Model Context Protocol) server that exposes structured API endpoints for tasks, notes, presets, and vaults, allowing Hermes to interact with Websidian programmatically with minimal context overhead. Additionally, the existing `GET /api/tasks` endpoint needs enhanced filtering capabilities (date ranges, boolean flags for done/scheduled/due) to support MCP tool requirements.

## What Changes

### API Changes (Breaking)
- **BREAKING**: Change `GET /api/tasks` to `POST /api/tasks/list` with `TaskFilter` body for advanced filtering
- Add `TaskFilter` schema with `startDate?`, `finishDate?`, `Done?:boolean=true`, `Scheduled?:boolean=true`, `Due?:boolean=true`
- Date range filtering: when startDate/finishDate provided, only return tasks with scheduled/due/done dates BETWEEN the range
- Boolean flags: when false, exclude tasks with those tags from response

### Authentication
- Add API_KEY authentication via environment variable for MCP access (no login required)
- MCP calls authenticate via `Authorization: Bearer <API_KEY>` header

### New MCP Tools
- **Tasks**: `tasks_list` (POST `/api/tasks/list`), `task_toggle` (POST `/api/tasks/toggle`)
- **Notes**: `note_create` (POST `/api/newNote`)
- **Presets**: `presets_list` (GET `/api/presets`), `preset_create` (POST `/api/presets`), `preset_update` (PUT `/api/presets/{id}`), `preset_delete` (DELETE `/api/presets/{id}`), `preset_reorder` (PUT `/api/presets/reorder`), `preset_files_update` (PUT `/api/presets/{id}/files`)
- **Vaults**: `vaults_list` (GET `/vaults`)

### Frontend Migration
- Update `public/tasks.js` and `public/scheduled.js` to use new `POST /api/tasks/list` endpoint
- Maintain Android 4 compatibility (ES5 polyfills, no arrow functions, no const/let)
- Provide backward compatibility layer during transition

### Excluded from MCP
- File ops (list, read, download) - Hermes uses filesystem directly
- Chat/Session endpoints - would cause loop (API already talks to Hermes Gateway)
- Voice/Audio (TTS, STT, upload) - User's API manages, not Hermes
- Terminal polling - being removed soon

## Capabilities

### New Capabilities
- `mcp-auth`: API_KEY-based authentication for MCP server access
- `task-filtering`: Advanced task filtering with date ranges and boolean flags
- `mcp-tools-tasks`: MCP tools for task listing and toggling
- `mcp-tools-notes`: MCP tool for note creation
- `mcp-tools-presets`: MCP tools for preset management (CRUD, reorder, file ordering)
- `mcp-tools-vaults`: MCP tool for vault listing

### Modified Capabilities
- `tasks-api`: Changing GET /api/tasks to POST /api/tasks/list with TaskFilter body (breaking change)
- `frontend-tasks`: Frontend migration to new tasks endpoint with backward compatibility

## Impact

### Backend
- `server/src/routes/tasks.ts` - Replace GET /api/tasks with POST /api/tasks/list
- `server/src/service/tasks.service.ts` - Add filterTasks method with TaskFilter logic
- `server/src/domain/schemas/tasks.ts` - Add TaskFilter schema
- `server/src/config/index.ts` - Add MCP_API_KEY environment variable
- `server/src/service/auth.service.ts` - Add API key validation method
- `server/src/routes/auth.ts` - Add MCP auth middleware or integrate into routes
- New MCP server entry point (separate process or integrated)

### Frontend
- `public/tasks.js` - Migrate loadTasks() to POST /api/tasks/list
- `public/scheduled.js` - Migrate loadTasks() to POST /api/tasks/list
- Maintain ES5 compatibility for Android 4

### Shared
- `shared-types/task.js` - Add TaskFilter type definition