## ADDED Requirements

### Requirement: Audio file handling from Hermes response
The system SHALL handle audio files returned by Hermes (Hermes generates audio and returns temp file path).

#### Scenario: Audio path returned by Hermes
- **WHEN** chat response contains audio file path from Hermes
- **THEN** system copies/moves audio file to managed temp storage
- **THEN** audio metadata stored: id, path, text, timestamp, duration

#### Scenario: No audio path returned
- **WHEN** Hermes response doesn't contain audio path
- **THEN** no audio file created
- **THEN** no audio player in rendered HTML

### Requirement: Audio file format and metadata
The system SHALL manage MP3 audio files with associated metadata.

#### Scenario: Audio file managed
- **WHEN** audio file copied to managed storage
- **THEN** MP3 file saved with unique ID (e.g., "a1b2c3d4.mp3")
- **THEN** metadata stored: id, path, text, timestamp, duration

#### Scenario: Audio duration tracked
- **WHEN** audio file managed
- **THEN** duration in seconds extracted (ffprobe) and stored for UI display