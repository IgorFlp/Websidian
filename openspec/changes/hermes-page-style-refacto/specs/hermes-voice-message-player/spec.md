## ADDED Requirements

### Requirement: Voice Message Detection
The system SHALL detect when a user message was originally voice input (has audio metadata).

#### Scenario: Message has audio metadata
- **WHEN** backend returns user message with `audio` property (id, url, text, duration)
- **THEN** message is rendered as voice message type

#### Scenario: Message without audio is standard
- **WHEN** backend returns user message without `audio` property
- **THEN** message renders as standard text message

### Requirement: Inline Audio Player Component
The system SHALL render an inline audio player in voice user messages alongside the transcript.

#### Scenario: Player shows play button
- **WHEN** voice message renders
- **THEN** circular play button (32x32px, primary background, on-primary icon) appears

#### Scenario: Player shows waveform
- **WHEN** voice message renders
- **THEN** static waveform indicator (8 bars, varying heights, primary colors) appears

#### Scenario: Player shows transcript
- **WHEN** voice message renders
- **THEN** transcript text appears next to player in body font

#### Scenario: Player shows duration
- **WHEN** voice message renders
- **THEN** duration label (e.g., "0:24") appears in label-sm monospace

### Requirement: Audio Playback
The system SHALL play audio when play button is clicked.

#### Scenario: Play starts audio
- **WHEN** user clicks play button
- **THEN** audio loads from `/audio/{id}` and plays, button changes to pause icon

#### Scenario: Pause stops audio
- **WHEN** user clicks pause button
- **THEN** audio pauses, button changes to play icon

#### Scenario: Auto-stop on new playback
- **WHEN** another audio starts playing
- **THEN** previous audio stops

#### Scenario: Audio ends resets button
- **WHEN** audio finishes naturally
- **THEN** button returns to play state

### Requirement: Visual Consistency with Agent TTS Player
The system SHALL match the agent TTS player visual design.

#### Scenario: Same color scheme
- **WHEN** voice player renders
- **THEN** uses same primary violet, surface containers, border colors

#### Scenario: Same waveform style
- **WHEN** waveform renders
- **THEN** matches agent TTS player bar style and colors