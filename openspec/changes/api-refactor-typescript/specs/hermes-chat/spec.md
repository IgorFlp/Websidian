## ADDED Requirements

### Requirement: Chat Initiation Endpoint
The system SHALL start chat session at `POST /chat` with text or audio input.

#### Scenario: Text input starts chat
- **WHEN** POST `/chat` with `{ input: "Hello" }`
- **THEN** response 200 with `{ sessionId, html, audio[], streaming: false }`

#### Scenario: Audio input starts chat
- **WHEN** POST `/chat` with `{ audio: "base64..." }`
- **THEN** audio saved, transcript sent to Hermes, response includes audio player HTML

#### Scenario: Continues existing session
- **WHEN** POST `/chat` with `{ input: "Hi", sessionId: "existing" }`
- **THEN** uses existing session, response includes sessionId

#### Scenario: Creates new session if none exists
- **WHEN** POST without sessionId and no sessions exist
- **THEN** creates new Hermes session, uses it

#### Scenario: Validates input required
- **WHEN** POST with empty/missing input and no audio
- **THEN** response 400 `{ error: "Input is required and must be a string" }`

#### Scenario: Handles Hermes 404
- **WHEN** Hermes returns 404 for session
- **THEN** response 404 `{ error: "Session not found" }`

#### Scenario: Handles Hermes 500
- **WHEN** Hermes returns 500
- **THEN** response 500 `{ error: "Hermes API error: ..." }`

### Requirement: Message Polling Endpoint
The system SHALL return current HTML for session at `GET /messages/:sessionId`.

#### Scenario: Returns HTML with streaming header
- **WHEN** GET `/messages/abc123`
- **THEN** response 200 `text/html` with `X-Streaming: true|false` header

#### Scenario: Builds HTML from Hermes messages
- **WHEN** session has messages
- **THEN** HTML includes rendered user/AI messages with formatting

#### Scenario: Handles missing session
- **WHEN** session not in repository
- **THEN** fetches from Hermes, builds HTML

#### Scenario: Returns placeholder for empty session
- **WHEN** session has no messages
- **THEN** response 200 with `<div class='message-block'>...Sem mensagens ainda...</div>`

### Requirement: Sessions List Endpoint
The system SHALL return HTML session list at `GET /sessions`.

#### Scenario: Returns paginated HTML
- **WHEN** GET `/sessions?limit=20&offset=0`
- **THEN** response 200 `text/html` with session list, pagination controls

#### Scenario: Each session shows title, time, message count
- **WHEN** rendering session item
- **THEN** includes session name, time ago, message count, session ID

### Requirement: Create Session Endpoint
The system SHALL create new Hermes session at `POST /sessions`.

#### Scenario: Creates session with timestamp title
- **WHEN** POST `/sessions` with optional `{ title }`
- **THEN** response 201 `{ sessionId, title, createdAt }`

#### Scenario: Uses provided title
- **WHEN** POST with `{ title: "Custom" }`
- **THEN** session created with custom title