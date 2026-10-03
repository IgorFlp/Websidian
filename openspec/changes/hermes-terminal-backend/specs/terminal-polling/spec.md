## ADDED Requirements

### Requirement: Chat endpoint with audio instruction injection
The system SHALL provide POST /chat endpoint that forwards requests to Hermes `/api/sessions/{id}/chat` with audio instruction appended, parses response for text and audio path, and returns rendered HTML with audio.

#### Scenario: New session chat with audio instruction
- **WHEN** client POSTs `{ "input": "hello", "sessionId": null }` to /chat
- **THEN** system creates new session via Hermes POST /api/sessions
- **THEN** system forwards chat to Hermes `/api/sessions/{newId}/chat` with input appended: "Responda em texto e em audio e me retorne o caminho do audio temp"
- **THEN** Hermes returns response containing both text and audio file path
- **THEN** system parses response to extract text content and audio path
- **THEN** system copies audio file to managed temp storage
- **THEN** response includes `sessionId`, `html` (rendered message), `audio[]` (new AI audio metadata)

#### Scenario: Existing session chat
- **WHEN** client POSTs `{ "input": "hello", "sessionId": "abc123" }` to /chat
- **THEN** system forwards to Hermes `/api/sessions/abc123/chat` with audio instruction appended
- **THEN** response includes `sessionId`, `html`, `audio[]`

#### Scenario: Session not found
- **WHEN** client provides invalid sessionId
- **THEN** response returns 404 with error

#### Scenario: Response structure
- **WHEN** chat completes successfully
- **THEN** response JSON: `{ sessionId, html, audio: [{ id, url, text, duration }] }`
- **THEN** `html` contains server-rendered message block(s)
- **THEN** `audio` array contains new AI response audio metadata (empty for human messages)

### Requirement: Audio instruction injection
The system SHALL append "Responda em texto e em audio e me retorne o caminho do audio temp" to every user input sent to Hermes.

#### Scenario: Instruction appended
- **WHEN** sending chat request to Hermes
- **THEN** user input is concatenated with audio instruction
- **THEN** combined string sent as input to Hermes

### Requirement: Response parsing for text and audio path
The system SHALL parse Hermes response to separate text content from audio file path.

#### Scenario: Text and audio extracted
- **WHEN** Hermes returns response with audio path
- **THEN** system extracts text content (without audio path reference)
- **THEN** system extracts audio file path
- **THEN** both used for HTML rendering and audio management