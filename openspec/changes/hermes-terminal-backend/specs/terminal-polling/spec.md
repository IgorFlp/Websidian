## ADDED Requirements

### Requirement: Polling endpoint with since parameter
The system SHALL provide GET /terminal/poll?since=<timestamp> endpoint that returns new terminal output since the given timestamp.

#### Scenario: New output returned
- **WHEN** client polls with `since=1730522400000`
- **THEN** response includes all terminal lines after that timestamp
- **THEN** response JSON contains `since` (new timestamp), `html` (rendered blocks), `audio[]` (new AI audio)

#### Scenario: Long-poll behavior
- **WHEN** no new output since timestamp
- **THEN** request holds for up to 30 seconds waiting for new output
- **THEN** returns empty batch if timeout expires

#### Scenario: Since parameter validation
- **WHEN** client omits or provides invalid `since`
- **THEN** response returns 400 Bad Request

### Requirement: Response schema compliance
The system SHALL return JSON matching the exact schema specified.

#### Scenario: Response structure
- **WHEN** polling returns new content
- **THEN** `since` is Unix timestamp in milliseconds for next poll
- **THEN** `html` is concatenated string of one or more message blocks
- **THEN** `audio` is array of objects with `id`, `url`, `text` for each new AI response