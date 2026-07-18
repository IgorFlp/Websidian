## 1. Backend: Presets API and Tasks Route

- [ ] 1.1 Add `PRESETS_FILE` constant and load/save helpers in `server/api.js`
- [ ] 1.2 Implement `GET /api/presets` endpoint returning `{ presets: [...] }`
- [ ] 1.3 Implement `POST /api/presets` endpoint accepting `{ name, files }`, saving to `data/presets.json`
- [ ] 1.4 Implement `DELETE /api/presets/:id` endpoint removing preset by ID
- [ ] 1.5 Add `/tasks` route serving `public/tasks.html` with `authPage` middleware
- [ ] 1.6 Ensure `data/` directory exists on server start

## 2. Frontend: Task Page (tasks.html, tasks.js, tasks.css)

- [ ] 2.1 Create `public/tasks.html` with header placeholder, sidebar placeholder, main container for task sections
- [ ] 2.2 Create `public/tasks.css` with `.task-container` (max-height 400px, overflow-y auto), `.task-section` styling matching `scheduled.html`, `.task-item` styling, skeleton loader styles
- [ ] 2.3 Create `public/tasks.js` with `httpGet` (XMLHttpRequest), task sorting (doneDate desc, then scheduled/due asc), render functions
- [ ] 2.4 Implement `loadTasks()` fetching `/api/tasks`, filtering by `localStorage.taskFilterFiles`, grouping by file
- [ ] 2.5 Implement `renderFileContainer(filePath, tasks)` creating scrollable container with max 10 visible tasks
- [ ] 2.6 Implement scroll-to-last-checked: find last checked task, `scrollTop` to its position
- [ ] 2.7 Implement checkbox toggle calling `/api/tasks/toggle` and re-sorting container
- [ ] 2.8 Implement `loadPresets()` fetching `/api/presets` and populating "Load Preset" dropdown
- [ ] 2.9 Implement "Load Preset" dropdown change: save preset files to localStorage, reload task view
- [ ] 2.10 Implement "Clear Filters" button: clear `localStorage.taskFilterFiles`, show empty state
- [ ] 2.11 Load header and sidebar via `httpGet` like `scheduled.js`

## 3. Sidebar Integration

- [ ] 3.1 Update `public/sidebar.html`: add "Task Page" button in header, "Save Preset" button in toolbar, "Persist Filters" toggle (checkbox) in toolbar
- [ ] 3.2 Update `public/sidebar.js`: handle "Task Page" button click → navigate to `/tasks`
- [ ] 3.3 Implement "Save Preset" button: prompt for name, POST to `/api/presets` with current `selectedFiles`
- [ ] 3.4 Implement "Persist Filters" toggle: when enabled, save `selectedFiles` to `localStorage.taskFilterFiles` on change; when disabled, only keep in memory
- [ ] 3.5 On sidebar init, if "Persist Filters" was enabled, restore `selectedFiles` from `localStorage.taskFilterFiles`

## 4. Polish & Testing

- [ ] 4.1 Test task page loads on Android 4 browser (or Chrome dev tools device toolbar)
- [ ] 4.2 Test scroll container shows max 10 tasks, scrolls for more
- [ ] 4.3 Test last checked task scrolls into view on container load
- [ ] 4.4 Test checkbox toggle updates task and re-sorts container
- [ ] 4.5 Test "Clear Filters" clears localStorage and shows empty state
- [ ] 4.6 Test "Save Preset" creates preset, "Load Preset" dropdown shows it, loading applies filters
- [ ] 4.7 Test "Persist Filters" toggle persists selection across page reloads
- [ ] 4.8 Test preset delete (optional: add delete button in load preset dropdown)
- [ ] 4.9 Verify no fetch/axios usage - only XMLHttpRequest
- [ ] 4.10 Verify CSS uses only Android 4 compatible properties