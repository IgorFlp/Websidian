## ADDED Requirements

### Requirement: Sidebar displays hierarchical folder tree from API
The system SHALL render a collapsible folder tree using the structured tree data from `/api/files`.

#### Scenario: Folder tree renders on sidebar open
- **WHEN** sidebar opens
- **THEN** system fetches `/api/files` and renders root folders as expandable items

#### Scenario: Expand folder shows children
- **WHEN** user taps folder expand icon (▶/▼)
- **THEN** system reveals child folders and files without refetching

#### Scenario: Collapse folder hides children
- **WHEN** user taps expanded folder collapse icon (▼/▶)
- **THEN** system hides child items

#### Scenario: File items display name and actions
- **WHEN** file item renders
- **THEN** system shows file name, edit button (opens editor), and download button

### Requirement: Click-and-hold selects file for batch actions
The system SHALL support long-press (touch) or click-and-hold (mouse) to select files.

#### Scenario: Long press selects single file
- **WHEN** user presses and holds file item for 500ms
- **THEN** system highlights file and shows selection toolbar at top of sidebar

#### Scenario: Multiple files selected
- **WHEN** user long-presses additional files
- **THEN** system adds to selection, toolbar shows count

#### Scenario: Clear selection
- **WHEN** user taps toolbar clear button or clicks empty sidebar area
- **THEN** system clears all selections and hides toolbar

### Requirement: Selection toolbar provides "Open in Editor"
The system SHALL show action buttons when files are selected.

#### Scenario: Open in Editor navigates to editor page with first selected file
- **WHEN** user taps "Open in Editor" with files selected
- **THEN** system navigates to `/editor.html?path=<firstSelectedFile>`

### Requirement: Sidebar responsive width up to 80% viewport
The system SHALL allow sidebar to expand up to 80% of screen width on touch drag.

#### Scenario: Sidebar drag resize
- **WHEN** user drags sidebar right edge
- **THEN** sidebar width changes up to `min(80vw, 320px)` maximum

#### Scenario: Sidebar close button
- **WHEN** user taps close button or backdrop
- **THEN** sidebar collapses to 0 width

#### Scenario: Sidebar toggle button in header
- **WHEN** user taps sidebar toggle in header
- **THEN** sidebar opens/closes with smooth transition