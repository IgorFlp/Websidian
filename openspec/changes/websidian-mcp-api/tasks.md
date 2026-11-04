## 1. Backend: TaskFilter Schema and Types

- [ ] 1.1 Add TaskFilter schema to `server/src/domain/schemas/tasks.ts`
- [ ] 1.2 Export TaskFilter type from `server/src/domain/types/tasks.ts`
- [ ] 1.3 Add TaskFilter to shared-types/task.js for frontend

## 2. Backend: TasksService Filtering Logic

- [ ] 2.1 Add `filterTasks(tasks: Task[], filter: TaskFilter): Task[]` method to `TasksService`
- [ ] 2.2 Implement date range filtering (startDate + finishDate required)
- [ ] 2.3 Implement boolean flag filtering (Done, Scheduled, Due)
- [ ] 2.4 Handle default values (Done/Scheduled/Due default to true)
- [ ] 2.5 Add unit tests for filter logic in `server/src/service/tasks.service.test.ts`

## 3. Backend: New Tasks Endpoint

- [ ] 3.1 Add `POST /api/tasks/list` endpoint in `server/src/routes/tasks.ts`
- [ ] 3.2 Validate TaskFilter body with Zod schema
- [ ] 3.3 Call `tasksService.scanTasks()` then `tasksService.filterTasks()`
- [ ] 3.4 Return filtered tasks array
- [ ] 3.5 Add authentication check (session OR API_KEY)

## 4. Backend: Deprecated GET /api/tasks Alias

- [ ] 4.1 Keep `GET /api/tasks` endpoint in `tasks.ts`
- [ ] 4.2 Transform query params (vault, path) to minimal TaskFilter
- [ ] 4.3 Call new POST endpoint internally (or reuse service methods)
- [ ] 4.4 Log deprecation warning on each call
- [ ] 4.5 Maintain same response format

## 5. Backend: API_KEY Authentication

- [ ] 5.1 Add `MCP_API_KEY` to `server/src/config/index.ts` (optional env var)
- [ ] 5.2 Add `validateApiKey(key: string): boolean` to `AuthService`
- [ ] 5.3 Create Fastify hook `requireApiKeyOrSession` for MCP endpoints
- [ ] 5.4 Apply hook to `/api/tasks/list` and future MCP routes
- [ ] 5.5 Return 401 for missing/invalid key; 503 if MCP_API_KEY not configured

## 6. Frontend: tasks.js Migration

- [ ] 6.1 Update `loadTasks()` to build TaskFilter from localStorage
- [ ] 6.2 Change `httpGet("/api/tasks...")` to `httpPost("/api/tasks/list", filter, callback)`
- [ ] 6.3 Ensure TaskFilter includes `vault` and `files` (from taskFilterFiles)
- [ ] 6.4 Test on Android 4 emulator (ES5 polyfills work)
- [ ] 6.5 Verify error handling (401 redirect, 500 alert) still works

## 7. Frontend: scheduled.js Migration

- [ ] 7.1 Update `loadTasks()` to use `POST /api/tasks/list` per vault
- [ ] 7.2 Build TaskFilter with vault for each vault request
- [ ] 7.3 Aggregate responses same as before
- [ ] 7.4 Test on Android 4 emulator
- [ ] 7.5 Verify 30s auto-refresh still works

## 8. MCP Server: Core Setup

- [ ] 8.1 Create `server/src/mcp/index.ts` with MCP server (stdio transport)
- [ ] 8.2 Import existing services (TasksService, NotesService, PresetsService)
- [ ] 8.3 Add API_KEY validation middleware for MCP tools
- [ ] 8.4 Register all 10 MCP tools with handlers
- [ ] 8.5 Add `mcp:start` script to `server/package.json`

## 9. MCP Tools: Tasks

- [ ] 9.1 Implement `tasks_list` tool → calls `POST /api/tasks/list`
- [ ] 9.2 Implement `task_toggle` tool → calls `POST /api/tasks/toggle`
- [ ] 9.3 Handle API_KEY auth in tool requests
- [ ] 9.4 Map MCP tool errors to standard MCP error format

## 10. MCP Tools: Notes

- [ ] 10.1 Implement `note_create` tool → calls `POST /api/newNote`
- [ ] 10.2 Handle API_KEY auth
- [ ] 10.3 Map response to MCP tool result

## 11. MCP Tools: Presets

- [ ] 11.1 Implement `presets_list` tool → calls `GET /api/presets`
- [ ] 11.2 Implement `preset_create` tool → calls `POST /api/presets`
- [ ] 11.3 Implement `preset_update` tool → calls `PUT /api/presets/{id}`
- [ ] 11.4 Implement `preset_delete` tool → calls `DELETE /api/presets/{id}`
- [ ] 11.5 Implement `preset_reorder` tool → calls `PUT /api/presets/reorder`
- [ ] 11.6 Implement `preset_files_update` tool → calls `PUT /api/presets/{id}/files`
- [ ] 11.7 Handle API_KEY auth for all preset tools

## 12. MCP Tools: Vaults

- [ ] 12.1 Implement `vaults_list` tool → calls `GET /vaults`
- [ ] 12.2 Handle API_KEY auth

## 13. Configuration and Documentation

- [ ] 13.1 Document MCP_API_KEY in `.env.example`
- [ ] 13.2 Add MCP server startup instructions to README
- [ ] 13.3 Verify all endpoints work with both session and API_KEY auth

## 14. Testing and Verification

- [ ] 14.1 Test TaskFilter date range with various task date combinations
- [ ] 14.2 Test TaskFilter boolean exclusions (Done=false, Scheduled=false, Due=false)
- [ ] 14.3 Test deprecated GET /api/tasks still works for frontend
- [ ] 14.4 Test MCP server starts and responds to tool calls
- [ ] 14.5 Test frontend on Android 4 emulator (or compatible browser)
- [ ] 14.6 Run existing test suite to ensure no regressions