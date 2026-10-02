## ADDED Requirements

### Requirement: Text input endpoint
The system SHALL accept text input via POST /terminal/input and forward it to the terminal process.

#### Scenario: Text input forwarded
- **WHEN** client POSTs `{ "type": "text", "content": "hello" }` to /terminal/input
- **THEN** "hello\n" is written to terminal stdin
- **THEN** response returns 202 Accepted

#### Scenario: Invalid payload rejected
- **WHEN** client POSTs invalid JSON or missing fields
- **THEN** response returns 400 Bad Request with error details

### Requirement: Audio input endpoint (future)
The system SHALL accept audio input via POST /terminal/input for future STT processing.

#### Scenario: Audio input accepted
- **WHEN** client POSTs multipart/form-data with audio file
- **THEN** audio is queued for STT processing (not implemented in v1)
- **THEN** response returns 202 Accepted