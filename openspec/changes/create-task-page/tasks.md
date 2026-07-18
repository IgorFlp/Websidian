## 1. Backend: Presets API and Tasks Route

- [x] 1.1 Add `PRESETS_FILE` constant and load/save helpers in `server/api.js`
- [x] 1.2 Implement `GET /api/presets` endpoint returning `{ presets: [...] }`
- [x] 1.3 Implement `POST /api/presets` endpoint accepting `{ name, files }`, saving to `data/presets.json`
- [x] 1.4 Implement `DELETE /api/presets/:id` endpoint removing preset by ID
- [x] 1.5 Add `/tasks` route serving `public/tasks.html` with `authPage` middleware
- [x] 1.6 Ensure `data/` directory exists on server start

## 2. Frontend: Task Page (tasks.html, tasks.js, tasks.css)

- [x] 2.1 Create `public/tasks.html` with header placeholder, sidebar placeholder, main container for task sections
- [x] 2.2 Create `public/tasks.css` with `.task-container` (max-height 400px, overflow-y auto), `.task-section` styling matching `scheduled.html`, `.task-item` styling, skeleton loader styles
- [x] 2.3 Create `public/tasks.js` with `httpGet` (XMLHttpRequest), task sorting (doneDate desc, then scheduled/due asc), render functions
- [x] 2.4 Implement `loadTasks()` fetching `/api/tasks`, filtering by `localStorage.taskFilterFiles`, grouping by file
- [x] 2.5 Implement `renderFileContainer(filePath, tasks)` creating scrollable container with max 10 visible tasks
- [x] 2.6 Implement scroll-to-last-checked: find last checked task, `scrollTop` to its position
- [x] 2.7 Implement checkbox toggle calling `/api/tasks/toggle` and re-sorting container
- [x] 2.8 Implement `loadPresets()` fetching `/api/presets` and populating "Load Preset" dropdown
- [x] 2.9 Implement "Load Preset" dropdown change: save preset files to localStorage, reload task view
- [x] 2.10 Implement "Clear Filters" button: clear `localStorage.taskFilterFiles`, show empty state
- [x] 2.11 Implement "Save Preset" button: prompt for name, POST to `/api/presets` with current `taskFilterFiles`
- [x] 2.12 Load header and sidebar via `httpGet` like `scheduled.js`

## 3. Sidebar Integration

- [x] 3.1 Update `public/sidebar.html`: add "Task Page" button in header, "Add to Task View" button in toolbar
- [x] 3.2 Update `public/sidebar.js`: handle "Task Page" button click → navigate to `/tasks`
- [x] 3.3 Implement "Add to Task View" button: save selected files to `localStorage.taskFilterFiles`, notify task page to refresh
- [x] 3.4 On sidebar init, restore `selectedFiles` from `localStorage.taskFilterFiles` if exists

## 4. Polish & Testing

- [x] 4.1 Test task page loads on Android 4 browser (or Chrome dev tools device toolbar)
- [x] 4.2 Test scroll container shows max 10 tasks, scrolls for more
- [x] 4.3 Test last checked task scrolls into view on container load
- [x] 4.4 Test checkbox toggle updates task and re-sorts container
- [x] 4.5 Test "Clear Filters" clears localStorage and shows empty state
- [x] 4.6 Test "Save Preset" creates preset, "Load Preset" dropdown shows it, loading applies filters
- [x] 4.7 Test "Add to Task View" in sidebar saves selection to localStorage and task page refreshes
- [x] 4.8 Test preset delete (optional: add delete button in load preset dropdown)
- [x] 4.9 Verify no fetch/axios usage - only XMLHttpRequest
- [x] 4.10 Verify CSS uses only Android 4 compatible properties