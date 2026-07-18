## MODIFIED Requirements

### Modified Capability: sidebar

#### Requirement: Task Page button in sidebar header
The sidebar header SHALL include a "Task Page" button that navigates to `/tasks`.

#### Scenario: Click Task Page button
- **WHEN** user clicks "Task Page" button in sidebar header
- **THEN** navigate to `/tasks` page

#### Requirement: Add to Task View button in sidebar toolbar
The sidebar toolbar SHALL include an "Add to Task View" button (visible when files selected) that adds selected files to task filter via localStorage.

#### Scenario: Add to Task View button visible
- **WHEN** files selected in sidebar
- **THEN** "Add to Task View" button shown in toolbar

#### Scenario: Click Add to Task View
- **WHEN** user clicks "Add to Task View"
- **THEN** selected file paths saved to localStorage `taskFilterFiles` as JSON array, task page notified to refresh