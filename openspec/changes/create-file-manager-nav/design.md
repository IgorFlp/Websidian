## Context

Websidian runs on old hardware (Android 4+ tablets) in localhost environments. Current architecture:
- Server: Node.js/Express (`server/api.js`) serving static files + REST API
- Client: Plain HTML/CSS/JS (no frameworks), `XMLHttpRequest` for all API calls
- Pages: `index.html` (tasks: Hoje/Semanal/Indefinido), `files.html` (file browser), `editor.html` (markdown editor)
- Shared: `header.html` loaded via XHR into `.header-placeholder`, `style.css` for all pages
- API `/api/files` returns `{ files: string[] }` — flat array of relative paths
- localStorage available on target devices (Android 4.0+)

Constraints from `docs/Constraints.md`:
- Touch-first for old Android tablets
- No libraries/frameworks — native HTML/CSS/JS only
- No modern CSS features (no Grid, Flexbox OK, no CSS custom properties, no `clamp()`, etc.)
- `XMLHttpRequest` only for API calls
- Old browser compatibility (Android 4 WebView ~ Chrome 30-40)

## Goals / Non-Goals

**Goals:**
- Persistent collapsible folder tree sidebar on ALL pages (index, scheduled, files, editor)
- Sidebar width up to 80% viewport, toggleable
- Folder expand/collapse with touch-friendly hit targets
- Long-press (500ms) on file to select → show top toolbar with "Add to Task View" / "Open in Editor"
- Index page becomes landing page with centered "Websidian" heading
- Scheduled page (`scheduled.html`) shows vault-wide Today / This Week / This Month (existing logic unchanged)
- File filter for task view NOT implemented in this change (future `task.html`)
- `/api/files` returns hierarchical tree with metadata (path, name, folder, extension, mtime)
- JSDoc typedefs in `shared-types/file-types.js` for FileNode, FileTree
- Shared header loaded via XHR on every page (already works, ensure consistency)

**Non-Goals:**
- Drag-and-drop reordering (touch complexity on old Android)
- File create/delete/rename in sidebar (editor handles creation)
- Multi-select (single file selection only)
- Search/filter in sidebar (future enhancement)
- Server-side file watching (polling not needed for localhost vault)
- File filter on Scheduled page (future `task.html`)

## Decisions

### 1. Sidebar Architecture: Separate HTML/JS/CSS loaded via XHR

**Decision**: Create `sidebar.html`, `sidebar.js`, `sidebar.css` loaded into a `<div id="sidebar-placeholder">` on each page via `XMLHttpRequest`, same pattern as `header.html`.

**Rationale**: 
- Consistent with existing header loading pattern
- No framework — each page includes sidebar with single XHR call
- Keeps sidebar logic isolated from page-specific logic
- Works on Android 4 WebView (XHR supported)

**Alternative considered**: Inline sidebar HTML in each page — rejected (duplication, maintenance burden).

### 2. Sidebar State: CSS Classes + localStorage

**Decision**: 
- Sidebar open/closed: CSS class `.sidebar-open` on `<body>`
- Folder expand/collapse: CSS class `.folder-open` on folder `<li>` + `localStorage` key `sidebar:folders` storing expanded folder paths
- Selected file: CSS class `.file-selected` + `localStorage` key `sidebar:selectedFile`
- Task filter files: NOT in this change (future `task.html`)

**Rationale**: 
- No JS state management library — CSS classes + localStorage = persistent, no-framework state
- localStorage survives page navigation
- CSS classes enable instant visual feedback without re-render

**Alternative considered**: Single global JS state object — rejected (doesn't persist across page loads without localStorage anyway).

### 3. File Tree Data Structure: Hierarchical FileNode Array

**Decision**: `/api/files` returns `{ tree: FileNode[] }` where:

```js
/**
 * @typedef {Object} FileNode
 * @property {string} name - "notes.md"
 * @property {string} path - "folder/notes.md" (relative to vault)
 * @property {boolean} isDirectory
 * @property {FileNode[]} [children] - only for directories
 * @property {number} mtime - Unix ms for sorting
 * @property {string} [extension] - "md" for files
 */
```

**Rationale**:
- Hierarchical structure enables recursive folder rendering
- `mtime` allows sorting (folders first, then by name)
- `extension` enables file-type icons later
- Flat array → tree conversion on server (single scan, no client recursion)

**Alternative considered**: Flat array with `parentPath` — rejected (client-side tree building slower on old devices).

### 4. Long-Press Selection: Touch Events with 500ms Timer

**Decision**: 
- `touchstart` → start 500ms timer
- `touchend` / `touchmove` > 10px → cancel timer
- Timer fires → add `.file-selected`, show toolbar
- Toolbar: fixed top bar with "Add to Task View" / "Open in Editor" buttons

**Rationale**:
- `touchstart`/`touchend`/`touchmove` supported on Android 4+
- 500ms distinguishes tap (open) from long-press (select)
- 10px movement tolerance prevents accidental selection during scroll
- Fixed toolbar avoids layout shift

**Alternative considered**: `contextmenu` event — rejected (inconsistent on Android WebView).

### 5. Scheduled Page Views: Existing Logic Unchanged

**Decision**: 
- `/api/tasks` returns all tasks with `scheduled`/`due` dates (already implemented)
- Client filters into three views: Today (date === today), This Week (date in current ISO week), This Month (date in current month)
- **No file filter** — shows all vault tasks (filter reserved for future `task.html`)

**Rationale**:
- Existing `app.js` logic works correctly for vault-wide views
- No changes needed to task rendering logic
- Simpler implementation, less risk

**Alternative considered**: Add file filter now — rejected (out of scope per user).

### 6. Index Page: Minimal Landing Container

**Decision**: `index.html` becomes:
```html
<div class="index-container">
  <h1>Websidian</h1>
</div>
```
Plus header + sidebar placeholders.

**Rationale**: 
- Landing page, not task dashboard
- Centered heading per requirement
- Sidebar provides navigation

### 7. Scheduled Page: New `scheduled.html` + `scheduled.js`

**Decision**: Create `scheduled.html` and `scheduled.js` with the existing task view logic from current `index.html`/`app.js`. The three views (Hoje/Esta Semana/Este Mês) remain unchanged.

**Rationale**: 
- Separates landing page from task dashboard
- Keeps existing working logic
- Future `task.html` can be built separately

### 8. Shared Types Location: `shared-types/file-types.js` (JSDoc)

**Decision**: Create `shared-types/file-types.js` with JSDoc `@typedef` for FileNode, FileTree. No TypeScript — plain JS project.

**Rationale**:
- Single source of truth for API contract
- Server uses JSDoc for IDE support
- Client JS has no build step — JSDoc serves as documentation

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| localStorage unavailable (private browsing) | Fallback to in-memory; warn user |
| Android 4 WebView touch event quirks | Test `touchstart`/`touchend` only; avoid `pointer` events |
| Sidebar 80% width on small screens | Cap at `min(80%, 320px)` via CSS `max-width` |
| `/api/files` breaking existing `files.js` | Update `files.js` in same change; no external consumers |
| Folder tree deep nesting → slow render | Flatten render: only render expanded folders; virtualize not needed (vault < 1000 files) |
| XHR race condition (sidebar + header + page) | Load sidebar first, then page init; or parallel with callback counter |

## Migration Plan

1. Create `shared-types/file-types.js` with JSDoc typedefs
2. Update `server/api.js` `/api/files` to return `{ tree: FileNode[] }`
3. Create `public/sidebar.html`, `public/sidebar.css`, `public/sidebar.js`
4. Create `public/scheduled.html`, `public/scheduled.js` (from current index/app.js logic)
5. Update `public/index.html` → minimal container + placeholders
6. Update `public/files.html` / `public/files.js` → sidebar integration
7. Update `public/editor.html` / `public/editor.js` → sidebar integration
8. Verify `header.html` loading consistent on all pages
9. Test on target device (Android 4+ WebView)

Rollback: Revert `api.js` and HTML/JS files; no database migration needed.

## Open Questions

1. **Sidebar toggle button location**: Header? Floating button? — **Header first icon on the left**
2. **Folder icons**: Unicode (▼/▶) or inline SVG? — **Unicode, also use unicode for edit/filter button icon**
3. **Task filter persistence scope**: Per-user? Per-vault? — **Per-vault, local app, 1 user, login only for privacy**
4. **Keyboard accessibility**: Tab order for sidebar? — **Nice to have**