## ADDED Requirements

### Requirement: Server-side HTML message block rendering
The system SHALL render complete message blocks as HTML strings on the server, following the specified component structure.

#### Scenario: Message block structure
- **WHEN** rendering a terminal message
- **THEN** output matches the exact HTML structure with: header (agent indicator, name, elapsed time), body (ANSI-converted text), optional CLI snippet, audio player

#### Scenario: ANSI to HTML conversion
- **WHEN** terminal output contains ANSI escape codes
- **THEN** codes are converted to equivalent HTML/CSS (colors, bold, etc.)
- **THEN** output is HTML-escaped to prevent XSS

#### Scenario: Elapsed time calculation
- **WHEN** rendering message header
- **THEN** elapsed time since message timestamp is calculated and formatted (e.g., "2m 34s")

### Requirement: Autoplay only on last AI audio
The system SHALL add `autoplay` attribute only to the audio player in the last message block of each poll response batch.

#### Scenario: Last block gets autoplay
- **WHEN** poll response contains multiple new AI messages
- **THEN** only the final message block's audio button has `autoplay` attribute
- **THEN** previous blocks have no autoplay

#### Scenario: Single block gets autoplay
- **WHEN** poll response contains one new AI message
- **THEN** that block's audio button has `autoplay` attribute

### Requirement: Audio player component
The system SHALL render audio player with play button, metadata (title, duration, engine), and waveform visual indicator.

#### Scenario: Audio player rendered
- **WHEN** message has associated audio
- **THEN** player includes: play button (material icon), title "Síntese Vocal Agêntica", duration + "Hermes Neural Voxtral", 8-bar waveform visual

#### Scenario: No audio player for non-AI messages
- **WHEN** message is human/system (no TTS generated)
- **THEN** audio player section is omitted entirely