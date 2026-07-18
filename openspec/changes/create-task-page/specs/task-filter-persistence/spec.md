## ADDED Requirements

### Requirement: localStorage persistence for selected file filters
The system SHALL store selected file paths in localStorage key `taskFilterFiles` as JSON array when user selects files in sidebar and clicks "Add to Task View".

#### Scenario: Save file selection to localStorage
- **WHEN** user selects files in sidebar and clicks "Add to Task View"
- **THEN** selected file paths saved to localStorage `taskFilterFiles` as JSON array

#### Scenario: Load file filters from localStorage on task page
- **WHEN** task page loads
- **THEN** page reads localStorage `taskFilterFiles` and uses those files for filtering

### Requirement: Persist Filters toggle in sidebar
The system SHALL provide a "Persist Filters" toggle in sidebar toolbar that controls whether `taskFilterFiles` survives sidebar close/clear.

#### Scenario: Persist Filters enabled
- **WHEN** "Persist Filters" toggle is ON and user closes sidebar
- **THEN** localStorage `taskFilterFiles` retained

#### Scenario: Persist Filters disabled
- **WHEN** "Persist Filters" toggle is OFF and user clicks "Clear Selection" in sidebar
- **THEN** localStorage `taskFilterFiles` cleared along with selection

### Requirement: Sync sidebar selection with taskFilterFiles
The system SHALL sync sidebar file selection with `taskFilterFiles` when "Add to Task View" is clicked.

#### Scenario: Add to Task View updates filter
- **WHEN** user selects files in sidebar and clicks "Add to Task View"
- **THEN** selected files written to localStorage `taskFilterFiles`, task page notified to refresh