## ADDED Requirements

### Requirement: Terminal Input Endpoint
The system SHALL accept terminal input at `POST /terminal/input`.

#### Scenario: Accepts text input
- **WHEN** POST `/terminal/input` with `{ type: "text", content: "ls\n" }`
- **THEN** writes to terminal manager, response 202 `{ accepted: true }`

#### Scenario: Rejects invalid type
- **WHEN** POST with `{ type: "invalid", content: "x" }`
- **THEN** response 400 `{ error: "Invalid payload: type must be 'text'" }`

#### Scenario: Rejects non-string content
- **WHEN** POST with `{ type: "text", content: 123 }`
- **THEN** response 400 `{ error: "Invalid payload: content must be a string" }`

### Requirement: Terminal Poll Endpoint
The system SHALL long-poll for terminal output at `GET /terminal/poll?since=<timestamp>`.

#### Scenario: Returns new output since timestamp
- **WHEN** GET `/terminal/poll?since=1234567890` and new output exists
- **THEN** response 200 `{ since: newTimestamp, html: "rendered HTML", audio: [] }`

#### Scenario: Waits up to 30s for new output
- **WHEN** GET with no new output
- **THEN** holds connection up to 30s, then returns `{ since: now, html: "", audio: [] }`

#### Scenario: Returns immediately on new data
- **WHEN** new terminal output arrives during poll
- **THEN** responds immediately with new data

#### Scenario: Rejects missing since parameter
- **WHEN** GET `/terminal/poll` without `since`
- **THEN** response 400 `{ error: "Missing 'since' query parameter" }`

#### Scenario: Rejects invalid since parameter
- **WHEN** GET `/terminal/poll?since=invalid`
- **THEN** response 400 `{ error: "Invalid 'since' parameter: must be a Unix timestamp in milliseconds" }`

#### Scenario: Parses terminal output to HTML blocks
- **WHEN** new terminal entries available
- **THEN** uses HTMLRenderer to parse blocks, render message HTML without audio players