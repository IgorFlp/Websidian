## ADDED Requirements

### Requirement: Terminal process spawning
The system SHALL spawn a persistent terminal process running the Hermes agent on service startup.

#### Scenario: Successful spawn
- **WHEN** service starts
- **THEN** a pseudo-terminal is created with Hermes agent process running inside

#### Scenario: Process restart on crash
- **WHEN** Hermes agent process exits unexpectedly
- **THEN** system restarts the process with exponential backoff (max 5 retries)

#### Scenario: Graceful shutdown
- **WHEN** service receives shutdown signal
- **THEN** terminal process is terminated gracefully before exit

### Requirement: Terminal output capture
The system SHALL capture all stdout/stderr from the terminal process in real-time.

#### Scenario: Output buffering
- **WHEN** terminal produces output
- **THEN** output is appended to an in-memory buffer with timestamps

#### Scenario: Buffer size limit
- **WHEN** buffer exceeds 10,000 lines
- **THEN** oldest lines are evicted (FIFO) to maintain memory bounds