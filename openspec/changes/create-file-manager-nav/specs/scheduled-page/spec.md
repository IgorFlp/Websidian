## ADDED Requirements

### Requirement: Index page shows centered "Websidian" heading
The system SHALL replace task list with a centered container.

#### Scenario: Index page content
- **WHEN** user visits `/` (index.html)
- **THEN** page shows single container with centered `<h1>Websidian</h1>`
- **AND** no task sections (Hoje, Semanal, Indefinido) rendered

#### Scenario: Header still loads on index
- **WHEN** index page loads
- **THEN** header loads via XHR into `.header-placeholder` (existing behavior)

### Requirement: Scheduled page shows Today / This Week / This Month views
The system SHALL create scheduled.html with vault-wide scheduled views using existing logic.

#### Scenario: Three view sections rendered
- **WHEN** user visits scheduled page (scheduled.html)
- **THEN** page renders three sections: "Hoje" (Today), "Esta Semana" (This Week), "Este Mês" (This Month)

#### Scenario: All vault tasks shown (no file filter)
- **WHEN** scheduled page loads
- **THEN** all tasks from entire vault appear in appropriate view
- **AND** no file filtering applied (filter reserved for future task.html)

#### Scenario: Today view criteria
- **WHEN** task has `scheduled` or `due` date equal to today
- **OR** task is recurring with `scheduled` equal to today
- **OR** task `doneDate` equals today
- **THEN** task appears in "Hoje" section

#### Scenario: This Week view criteria
- **WHEN** task has `scheduled` or `due` date in current ISO week (Mon-Sun)
- **OR** task is recurring with `scheduled` in current week
- **THEN** task appears in "Esta Semana" section
- **AND** tasks tagged `#daily` excluded from This Week

#### Scenario: This Month view criteria
- **WHEN** task has `scheduled` or `due` date in current calendar month
- **OR** task is recurring with `scheduled` in current month
- **THEN** task appears in "Este Mês" section

#### Scenario: Task toggle persists and refreshes views
- **WHEN** user taps checkbox on task in any view
- **THEN** system sends toggle request and reloads all views on success

### Requirement: Touch-friendly task cards
The system SHALL maintain touch-first task card design.

#### Scenario: Checkbox toggle via touch
- **WHEN** user taps task checkbox
- **THEN** task toggles done/undone via POST `/api/tasks/toggle`

#### Scenario: Task text readable on small screens
- **WHEN** task renders
- **THEN** font-size ≥ 14px, tap target ≥ 44px height