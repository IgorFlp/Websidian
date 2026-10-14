## ADDED Requirements

### Requirement: Session-Based Authentication
The system SHALL authenticate users via session cookie (`connect.sid`) managed by `express-session` compatible middleware, with login/logout endpoints.

#### Scenario: Login with valid credentials
- **WHEN** POST `/login` with `{ user: "admin", pass: "secret" }` matching env vars
- **THEN** response 302 redirect to `/` with `Set-Cookie: connect.sid=...`

#### Scenario: Login with invalid credentials
- **WHEN** POST `/login` with wrong credentials
- **THEN** response 302 redirect to `/login?error=1`

#### Scenario: Logout destroys session
- **WHEN** GET `/logout` with valid session
- **THEN** response 302 redirect to `/login` with `Set-Cookie: connect.sid=; Max-Age=0`

#### Scenario: Protected route rejects unauthenticated
- **WHEN** GET `/api/files` without session cookie
- **THEN** response 401 with `{ error: "unauthorized" }`

#### Scenario: Login page accessible unauthenticated
- **WHEN** GET `/login` without session
- **THEN** response 200 with login HTML

#### Scenario: Root redirects to login when unauthenticated
- **WHEN** GET `/` without session
- **THEN** response 302 redirect to `/login`

### Requirement: Session Cookie Parsing Without Express
The system SHALL parse `Cookie` header manually using `cookie` package to extract `connect.sid` and validate session.

#### Scenario: Valid session cookie accepted
- **WHEN** request includes valid `connect.sid`
- **THEN** `AuthService.validateSession()` returns session data

#### Scenario: Invalid/expired session rejected
- **WHEN** request includes expired `connect.sid`
- **THEN** `AuthService.validateSession()` returns null