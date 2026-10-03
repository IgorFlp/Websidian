## ADDED Requirements

### Requirement: Temporary audio file storage with 10-message limit
The system SHALL store generated audio files in OS temp directory and maintain only the 10 most recent.

#### Scenario: File added to storage
- **WHEN** new AI audio is generated
- **THEN** file saved to `{tmpdir}/hermes-api-{id}.mp3`
- **THEN** entry added to in-memory index with metadata

#### Scenario: FIFO eviction on limit
- **WHEN** index exceeds 10 entries
- **THEN** oldest entry is removed from index
- **THEN** corresponding file is deleted from filesystem

#### Scenario: Startup cleanup
- **WHEN** service starts
- **THEN** orphaned `hermes-api-*.mp3` files in temp dir are deleted

### Requirement: Audio serving endpoint
The system SHALL serve audio files via GET /audio/:id.

#### Scenario: Audio served
- **WHEN** client requests GET /audio/a1b2c3d4
- **THEN** corresponding MP3 file is streamed with audio/mpeg content-type
- **THEN** response supports Range requests for seeking

#### Scenario: Missing audio returns 404
- **WHEN** client requests non-existent audio ID
- **THEN** response returns 404 Not Found