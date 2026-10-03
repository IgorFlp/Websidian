## ADDED Requirements

### Requirement: Sessions list endpoint with HTML rendering
The system SHALL provide GET /sessions endpoint that proxies to Hermes `/api/sessions` and returns server-rendered HTML.

#### Scenario: Sessions list returned
- **WHEN** client GETs /sessions
- **THEN** system calls Hermes `/api/sessions` with pagination params (limit, offset)
- **THEN** response is HTML fragment containing session list
- **THEN** each session shows: title, last activity, message count, session ID

#### Scenario: Pagination support
- **WHEN** client provides `?limit=20&offset=0` query params
- **THEN** params forwarded to Hermes API
- **THEN** HTML includes pagination controls if more sessions exist

#### Scenario: Session list HTML structure
- **WHEN** rendering session list
- **THEN** output is `<ul class="session-list">` with `<li class="session-item">` elements
- **THEN** each item has data-session-id attribute for client-side interaction
- **THEN** includes "New Session" button/link at top

### Requirement: Session creation endpoint
The system SHALL provide POST /sessions endpoint to create new empty sessions.

#### Scenario: New session created
- **WHEN** client POSTs `/sessions` with optional `{ "title": "My Chat" }`
- **THEN** system calls Hermes `/api/sessions` (POST)
- **THEN** returns created session metadata with sessionId