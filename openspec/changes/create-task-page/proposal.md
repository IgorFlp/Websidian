## Why

Users need a dedicated Task Page to view and manage tasks from multiple selected files in one place. Currently users can select files in the sidebar but there's no dedicated view to see all tasks from those files together. This feature adds a Task Page with file-based task containers, scrollable task lists (max 10 visible), localStorage persistence for file filters, and backend presets for saving/loading file filter sets.

## What Changes

- **New Page**: Create `/tasks` route serving new `tasks.html` page
- **New Capability: Task Page** - Dedicated page showing tasks grouped by file in scrollable containers (max 10 visible tasks per container, scroll for rest)
- **New Capability: Task Filter Persistence** - localStorage persistence for selected file filters with "Clear Filters" button
- **New Capability: Preset Management** - Save/Load presets to backend JSON storage (save preset button in sidebar, load preset button on task page, fetch presets on page load)
- **API Changes**: Add `/api/presets` GET (list), POST (save), DELETE (delete) endpoints
- **UI Changes**: Add "Task Page" button in sidebar header, "Save Preset" button in sidebar toolbar, "Load Preset" dropdown on task page, "Clear Filters" button on task page

## Capabilities

### New Capabilities

- `task-page`: Dedicated page displaying tasks grouped by file in scrollable containers (max 10 visible, scrollable), loads with last checked task first, uses `.task-section` design from `scheduled.html`
- `task-filter-persistence`: localStorage persistence for selected file filters with "Clear Filters" button on task page and "Persist Filters" button in sidebar
- `task-presets`: Backend JSON storage for saving/loading file filter presets (save preset in sidebar, load preset dropdown on task page, fetch presets on page load)

### Modified Capabilities

- `sidebar`: Add "Task Page" button in header, "Save Preset" button in toolbar, "Persist Filters" toggle in toolbar

## Impact

- **New Files**: `public/tasks.html`, `public/tasks.js`, `public/tasks.css`
- **Modified Files**: `server/api.js` (add `/api/presets` endpoints, add `/tasks` route), `public/sidebar.html` (add Task Page button, Save Preset button, Persist Filters toggle), `public/sidebar.js` (handle new buttons, preset save/load logic)
- **Dependencies**: Uses existing `/api/tasks` endpoint, `shared-types/task.js` Task type, `.task-section` CSS from `style.css`
- **Constraints**: Must use XMLHttpRequest (no fetch), compatible with Android 4 browsers, touch-first UI, no external libraries