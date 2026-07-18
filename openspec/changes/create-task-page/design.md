## Context

Websidian is a localhost-first note/task app for old hardware (Android 4+). Current architecture: Express backend (`server/api.js`) serving static files from `public/`, with a sidebar (`sidebar.html` + `sidebar.js`) for file browsing and selection. Tasks are parsed from markdown files via `/api/tasks` endpoint. The `scheduled.html` page shows tasks grouped by date using `.tasks-section` CSS. No dedicated multi-file task view exists.

Constraints: XMLHttpRequest only (no fetch), no external libraries, CSS compatible with Android 4 stock browser, touch-first UI.

## Goals / Non-Goals

**Goals:**
- Create `/tasks` page showing tasks grouped by selected files in scrollable containers (max 10 visible, scroll for rest)
- Each container loads with last checked task as first visible item
- localStorage persistence for file filter selection with "Clear Filters" button
- Backend preset system: save/load file filter sets via `/api/presets` (GET/POST/DELETE)
- "Save Preset" button on task page, "Load Preset" dropdown on task page
- Fetch presets on task page load
- "Add to Task View" button in sidebar toolbar to send selected files to task page

**Non-Goals:**
- Task editing/creation on task page (read-only view with checkbox toggle via existing `/api/tasks/toggle`)
- Real-time sync across devices
- Advanced filter UI (tags, dates) - only file-based filtering

## Decisions

### 1. File Filter Storage: localStorage key `taskFilterFiles`
**Rationale**: Simple, persistent across sessions, works offline. Alternative (sessionStorage) loses data on tab close. Backend presets handle cross-session sharing.

### 2. Preset Storage: JSON file in server directory (`data/presets.json`)
**Rationale**: No database dependency, simple file I/O, fits localhost constraints. Alternative (SQLite) adds complexity. File format: `{ presets: [{ id, name, files: string[], createdAt }] }`.

### 3. Task Container Scroll: CSS `max-height` + `overflow-y: auto`
**Rationale**: Native scrolling, works on Android 4. Max 10 visible tasks ≈ 400px height. Alternative (JS virtual scrolling) over-engineered for old devices.

### 4. Last Checked Task First: Sort tasks by `doneDate` desc, then `scheduled`/`due` asc
**Rationale**: Most recently completed tasks shown first. Unchecked tasks sorted by date. Simple client-side sort after fetch.

### 5. Task Page Route: `/tasks` serving `tasks.html`
**Rationale**: Consistent with `/scheduled` and `/files` routes. Auth protected via existing `authPage` middleware.

### 6. Sidebar Integration: Add "Task Page" button in header, "Add to Task View" in toolbar
**Rationale**: Keeps file selection workflow in sidebar. "Add to Task View" sends selected files to localStorage for task page.

### 7. API Endpoints for Presets:
- `GET /api/presets` → `{ presets: [...] }`
- `POST /api/presets` body `{ name, files }` → `{ preset: {...} }`
- `DELETE /api/presets/:id` → `{ ok: true }`
**Rationale**: RESTful, minimal surface. Uses existing auth middleware.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| localStorage quota exceeded on old Android | Store only file paths (strings), max ~50 files = ~5KB |
| CSS overflow scroll not smooth on Android 4 | Accept native scroll; avoid JS scroll libraries |
| Preset file corruption on concurrent writes | Low risk (localhost single-user); use `fs.writeFileSync` atomic write |
| Task list flicker on load | Show skeleton containers while fetching |
| Checkbox toggle doesn't update "last checked" sort | Re-sort container after toggle via existing `/api/tasks/toggle` |