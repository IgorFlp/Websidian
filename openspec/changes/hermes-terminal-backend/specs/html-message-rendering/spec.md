## ADDED Requirements

### Requirement: Server-side HTML message block rendering for chat
The system SHALL render complete message blocks as HTML strings on the server for chat messages.

#### Scenario: Message block structure
- **WHEN** rendering a chat message
- **THEN** output matches exact HTML structure with: header (agent indicator, name, elapsed time), body (message text), optional CLI snippet, audio player
- **THEN** AI messages have agent indicator "☤ Hermes", human messages have "● User"

#### Scenario: HTML escaping
- **WHEN** message contains special characters
- **THEN** content is HTML-escaped to prevent XSS
- **THEN** code blocks and markdown preserved as-is (client-side rendering)

#### Scenario: Elapsed time calculation
- **WHEN** rendering message header
- **THEN** elapsed time since message timestamp is calculated and formatted (e.g., "2m 34s")

### Requirement: Autoplay only on last AI audio
The system SHALL add `autoplay` attribute only to the audio player in the last AI message block of each chat response.

#### Scenario: Last AI block gets autoplay
- **WHEN** chat response contains new AI message
- **THEN** that message block's audio button has `autoplay` attribute
- **THEN** previous messages in history have no autoplay

### Requirement: Audio player component
The system SHALL render audio player with play button, metadata (title, duration, engine), and waveform visual indicator.

#### Scenario: Audio player rendered
- **WHEN** message has associated audio
- **THEN** player includes: play button (material icon), title "Síntese Vocal Agêntica", duration + "Hermes Neural Voxtral", 8-bar waveform visual

#### Scenario: No audio player for non-AI messages
- **WHEN** message is human/user (no TTS generated)
- **THEN** audio player section is omitted entirely

### Requirement: Sessions list HTML rendering
The system SHALL render session list as HTML fragment.

#### Scenario: Session list structure
- **WHEN** rendering sessions list
- **THEN** output is `<ul class="session-list">` with `<li class="session-item">` elements
- **THEN** each item shows: session title, last activity time, message preview, session ID
- **THEN** each item has `data-session-id` attribute
- **THEN** "New Session" button rendered at top