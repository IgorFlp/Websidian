## ADDED Requirements

### Requirement: TTS generation for AI responses only
The system SHALL generate TTS audio using Hermes Neural Voxtral for AI agent responses only, not for human/user messages.

#### Scenario: AI response triggers TTS
- **WHEN** terminal output contains a new AI agent message (detected via parsing)
- **THEN** TTS is generated for the AI response text
- **THEN** audio file is saved to temporary storage

#### Scenario: Human message skipped
- **WHEN** terminal output contains user input or system messages
- **THEN** no TTS is generated
- **THEN** no audio file is created

### Requirement: Audio file format and metadata
The system SHALL generate MP3 audio files with associated metadata.

#### Scenario: Audio file created
- **WHEN** TTS generation completes
- **THEN** MP3 file is saved with unique ID (e.g., "a1b2c3d4.mp3")
- **THEN** metadata stored: id, path, text, timestamp, duration

#### Scenario: Audio duration tracked
- **WHEN** TTS generates audio
- **THEN** duration in seconds is extracted and stored for UI display