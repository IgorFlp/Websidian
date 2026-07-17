## Why

Websidian needs a unified file navigation sidebar accessible from every page (Index, Scheduled, Files, Editor) to improve vault navigation on older Android tablets. The current index.html shows task views (Hoje/Semanal/Indefinido) but should be a landing page with just "Websidian" heading. The task views move to a new "Scheduled" page. The files page shows a flat list without folder tree navigation. A persistent sidebar with folder tree solves both problems while working on Android 4+ using only native HTML/CSS/JS and XMLHttpRequest.

## What Changes

### New Capabilities
- **file-manager-sidebar**: Persistent collapsible folder tree sidebar (up to 80% viewport width) with expand/collapse, file selection via long-press, and action toolbar for "Open in Editor"
- **scheduled-page**: New page showing "Today / This Week / This Month" views across entire vault (moved from index.html, existing logic preserved)
- **structured-file-api**: Enhanced `/api/files` endpoint returning hierarchical file tree with metadata (path, name, folder, extension, mtime) instead of flat string array
- **shared-file-types**: JSDoc `@typedef` definitions in `shared-types/file-types.js` for FileNode, FileTree, ApiFilesResponse

### Modified Capabilities
- **index-page**: Changed from task list to centered "Websidian" heading container
- **files-page**: Replaced flat list with sidebar-driven navigation
- **editor-page**: Add sidebar integration
- **header-component**: Shared header loaded via XMLHttpRequest on all pages (already exists, ensure consistent loading)
- **file-api**: `/api/files` response structure changed from `{files: string[]}` to `{tree: FileNode[]}` — **BREAKING**

### Removed
- `index.html` task list sections (Hoje/Semanal/Indefinido) → moved to scheduled.html
- `files.html` flat file list rendering logic

## Capabilities

### New Capabilities
- `file-manager-sidebar`: Persistent collapsible folder tree sidebar with file selection and editor integration
- `scheduled-page`: Vault-wide scheduled task views (Today/This Week/This Month) — existing logic, new page
- `structured-file-api`: Hierarchical file tree API with metadata
- `shared-file-types`: JSDoc type definitions for FileNode, FileTree, ApiFilesResponse

### Modified Capabilities
- `index-page`: Convert to centered "Websidian" heading container
- `scheduled-page`: New page using existing task view logic (no file filter)
- `files-page`: Integrate sidebar navigation
- `editor-page`: Integrate sidebar navigation
- `file-api`: **BREAKING** - Change `/api/files` response from `{files: string[]}` to `{tree: FileNode[]}`
- `header-component`: Ensure consistent XMLHttpRequest loading on all pages

## Impact

### Affected Code
- **New files**: `public/sidebar.html`, `public/sidebar.js`, `public/sidebar.css`, `public/scheduled.html`, `public/scheduled.js`, `shared-types/file-types.js`
- **Modified files**: 
  - `public/index.html` → centered h1 container + placeholders
  - `public/files.html` / `public/files.js` → sidebar integration
  - `public/editor.html` / `public/editor.js` → sidebar integration
  - `public/header.html` → sidebar toggle button
  - `server/api.js` → `/api/files` endpoint returns structured tree
- **New API types**: JSDoc typedefs in `shared-types/file-types.js`

### Dependencies
- No new dependencies (constraint: native only)
- Requires `localStorage` for sidebar state persistence (available on Android 4+)
- Requires `XMLHttpRequest` for all API calls (already used)
- Touch events for long-press selection (supported on Android 4+)

### Breaking Changes
- **BREAKING**: `/api/files` response structure changed — clients must update parsing logic
- **BREAKING**: `index.html` no longer shows task lists (moved to scheduled.html)
- **BREAKING**: `files.html` flat list replaced by sidebar tree