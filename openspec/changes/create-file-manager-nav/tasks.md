## 1. Shared Types & API

- [ ] 1.1 Create `shared-types/file-types.js` with JSDoc typedefs for FileNode, FileTree, ApiFilesResponse
- [ ] 1.2 Update `server/api.js` `/api/files` endpoint to return `{ tree: FileNode[] }` hierarchical structure
- [ ] 1.3 Add `?flat=true` query param support for legacy flat array format
- [ ] 1.4 Update `server/api.js` to use JSDoc `@typedef` referencing shared types

## 2. Sidebar Component

- [ ] 2.1 Create `public/sidebar.html` with placeholder structure (folder tree container, toolbar)
- [ ] 2.2 Create `public/sidebar.css` with styles for: sidebar panel (max 80% width), folder tree, expand/collapse icons, file items, selection state, top toolbar
- [ ] 2.3 Create `public/sidebar.js` with: XHR load, recursive folder rendering, expand/collapse handlers (persist to localStorage `sidebar:folders`), long-press selection (500ms touch timer), toolbar show/hide, "Add to Task View" / "Open in Editor" actions
- [ ] 2.4 Add sidebar placeholder `<div id="sidebar-placeholder"></div>` to `index.html`, `scheduled.html`, `files.html`, `editor.html`
- [ ] 2.5 Update each page's JS to load sidebar via XHR on load (parallel with header)
- [ ] 2.6 Add sidebar toggle button to `header.html` (hamburger icon) and toggle logic in `sidebar.js`

## 3. Index Page Refactor

- [ ] 3.1 Update `public/index.html` to minimal container: `<div class="index-container"><h1>Websidian</h1></div>` + header + sidebar placeholders
- [ ] 3.2 Remove task sections (Hoje, Semanal, Indefinido) from index.html
- [ ] 3.3 Ensure `public/index.html` loads header + sidebar via XHR

## 4. Scheduled Page (Task View Move)

- [ ] 4.1 Create `public/scheduled.html` with three sections: Hoje, Esta Semana, Este Mês + header + sidebar placeholders
- [ ] 4.2 Create `public/scheduled.js`: load tasks from `/api/tasks`, filter into three date groups (existing app.js logic), render each section — **NO file filter**
- [ ] 4.3 Ensure scheduled page task toggle works via POST `/api/tasks/toggle` and reloads views

## 5. Files Page Integration

- [ ] 5.1 Update `public/files.html` to use sidebar for navigation (remove flat list rendering)
- [ ] 5.2 Update `public/files.js` to delegate file tree to sidebar; handle "Open in Editor" from sidebar toolbar
- [ ] 5.3 Ensure files page still works for direct file access (download, edit buttons)

## 6. Editor Page Integration

- [ ] 6.1 Update `public/editor.html` to include sidebar placeholder
- [ ] 6.2 Update `public/editor.js` to load sidebar via XHR
- [ ] 6.3 Ensure editor still loads file content from query param `?path=`

## 7. Header Consistency

- [ ] 7.1 Verify `header.html` loads via XHR on all four pages (index, scheduled, files, editor)
- [ ] 7.2 Add sidebar toggle button to header (if not in 2.6)
- [ ] 7.3 Ensure header click handlers work after dynamic load

## 8. Testing & Polish

- [ ] 8.1 Test on Android 4+ WebView (or Chrome devtools device toolbar emulation)
- [ ] 8.2 Verify touch targets ≥ 44px, long-press works, no horizontal scroll
- [ ] 8.3 Verify localStorage persistence: expand/collapse folders → navigate away → return → state restored
- [ ] 8.4 Verify sidebar expand/collapse persists via localStorage
- [ ] 8.5 Verify `?flat=true` legacy endpoint works for any external consumers
- [ ] 8.6 Clean up unused code in `files.js` (old flat list rendering)
- [ ] 8.7 Update `style.css` for any new shared classes (sidebar, toolbar, scheduled views)