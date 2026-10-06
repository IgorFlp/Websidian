## ADDED Requirements

### Requirement: Delete Session Button
The system SHALL show a delete button on each session card (visible on hover/focus).

#### Scenario: Delete button visible on hover
- **WHEN** user hovers session card
- **THEN** delete button appears (trash icon)

#### Scenario: Delete button accessible via keyboard
- **WHEN** user tabs to session card
- **THEN** delete button is focusable and visible

### Requirement: Deletion Confirmation Modal
The system SHALL show a confirmation modal before deleting a session.

#### Scenario: Modal opens on delete click
- **WHEN** user clicks delete button
- **THEN** modal opens with session title, warning message, confirm/cancel buttons

#### Scenario: Cancel closes modal
- **WHEN** user clicks cancel or presses Escape
- **THEN** modal closes, no deletion occurs

#### Scenario: Confirm deletes session
- **WHEN** user clicks confirm
- **THEN** DELETE request sent to `/sessions/{id}`, modal closes, session list refreshes

### Requirement: DELETE API Integration
The system SHALL call the backend DELETE endpoint for session removal.

#### Scenario: Successful deletion
- **WHEN** DELETE `/sessions/{id}` returns 200
- **THEN** session removed from list, active session cleared if it was the deleted one

#### Scenario: Deletion error handling
- **WHEN** DELETE returns error
- **THEN** error message shown, modal stays open