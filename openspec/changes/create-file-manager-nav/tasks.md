## 1. Shared Types & API

- [x] 1.1 Create `shared-types/file-types.js` with JSDoc typedefs for FileNode, FileTree, ApiFilesResponse
- [x] 1.2 Update `server/api.js` `/api/files` endpoint to return `{ tree: FileNode[] }` hierarchical structure
- [x] 1.3 Add `?flat=true` query param support for legacy flat array format
- [x] 1.4 Update `server/api.js` to use JSDoc `@typedef` referencing shared types

## 2. Sidebar Component

- [x] 2.1 Create `public/sidebar.html` with placeholder structure (folder tree container, toolbar)
- [x] 2.2 Create `public/sidebar.css` with styles for: sidebar panel (max 80% width), folder tree, expand/collapse icons, file items, selection state, top toolbar
- [x] 2.3 Create `public/sidebar.js` with: XHR load, recursive folder rendering, expand/collapse handlers (persist to localStorage `sidebar:folders`), long-press selection (500ms touch timer), toolbar show/hide, "Add to Task View" / "Open in Editor" actions
- [x] 2.4 Add sidebar placeholder `<div id="sidebar-placeholder"></div>` to `index.html`, `scheduled.html`, `files.html`, `editor.html`
- [x] 2.5 Update each page's JS to load sidebar via XHR on load (parallel with header)
- [x] 2.6 Add sidebar toggle button to `header.html` (hamburger icon) and toggle logic in `sidebar.js`

## 3. Index Page Refactor

- [x] 3.1 Update `public/index.html` to minimal container: `<div class="index-container"><h1>Websidian</h1></div>` + header + sidebar placeholders
- [x] 3.2 Remove task sections (Hoje, Semanal, Indefinido) from index.html
- [x] 3.3 Ensure `public/index.html` loads header + sidebar via XHR

## 4. Scheduled Page (Task View Move)

- [x] 4.1 Create `public/scheduled.html` with three sections: Hoje, Esta Semana, Este Mês + header + sidebar placeholders
- [x] 4.2 Create `public/scheduled.js`: load tasks from `/api/tasks`, filter into three date groups (existing app.js logic), render each section — **NO file filter**
- [x] 4.3 Ensure scheduled page task toggle works via POST `/api/tasks/toggle` and reloads views

## 5. Files Page Integration

- [x] 5.1 Update `public/files.html` to use sidebar for navigation (remove flat list rendering)
- [x] 5.2 Update `public/files.js` to delegate file tree to sidebar; handle "Open in Editor" from sidebar toolbar
- [x] 5.3 Ensure files page still works for direct file access (download, edit buttons)

## 6. Editor Page Integration

- [x] 6.1 Update `public/editor.html` to include sidebar placeholder
- [x] 6.2 Update `public/editor.js` to load sidebar via XHR
- [x] 6.3 Ensure editor still loads file content from query param `?path=`

## 7. Header Consistency

- [x] 7.1 Verify `header.html` loads via XHR on all four pages (index, scheduled, files, editor)
- [x] 7.2 Add sidebar toggle button to header (if not in 2.6)
- [x] 7.3 Ensure header click handlers work after dynamic load

## 8. Testing & Polish

- [x] 8.1 Test on Android 4+ WebView (or Chrome devtools device toolbar emulation)
- [x] 8.2 Verify touch targets ≥ 44px, long-press works, no horizontal scroll
- [x] 8.3 Verify localStorage persistence: expand/collapse folders → navigate away → return → state restored
- [x] 8.4 Verify sidebar expand/collapse persists via localStorage
- [x] 8.5 Verify `?flat=true` legacy endpoint works for any external consumers
- [x] 8.6 Clean up unused code in `files.js` (old flat list rendering)
- [x] 8.7 Update `style.css` for any new shared classes (sidebar, toolbar, scheduled views)