## MODIFIED Requirements

### Modified Capability: sidebar

#### Requirement: Task Page button in sidebar header
The sidebar header SHALL include a "Task Page" button that navigates to `/tasks`.

#### Scenario: Click Task Page button
- **WHEN** user clicks "Task Page" button in sidebar header
- **THEN** navigate to `/tasks` page

#### Requirement: Save Preset button in sidebar toolbar
The sidebar toolbar SHALL include a "Save Preset" button (visible when files selected) that saves current selection as preset.

#### Scenario: Save Preset button visible
- **WHEN** files selected in sidebar
- **THEN** "Save Preset" button shown in toolbar

#### Scenario: Click Save Preset
- **WHEN** user clicks "Save Preset"
- **THEN** prompt for name, save preset via `POST /api/presets`

#### Requirement: Persist Filters toggle in sidebar toolbar
The sidebar toolbar SHALL include a "Persist Filters" toggle switch controlling whether `taskFilterFiles` survives clear/close.

#### Scenario: Persist Filters toggle ON
- **WHEN** toggle is ON
- **THEN** `taskFilterFiles` retained on sidebar close/clear selection

#### Scenario: Persist Filters toggle OFF
- **WHEN** toggle is OFF and user clicks "Clear Selection"
- **THEN** `taskFilterFiles` cleared along with selection