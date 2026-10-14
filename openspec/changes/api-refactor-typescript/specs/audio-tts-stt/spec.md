## ADDED Requirements

### Requirement: TTS Generation Endpoint
The system SHALL generate TTS audio via speaches API at `POST /api/tts`.

#### Scenario: Generates MP3 from text
- **WHEN** POST `/api/tts` with `{ text: "Hello", voice: "pm_alex", speed: 1 }`
- **THEN** calls speaches API, saves MP3 to `public/audio/tts-{messageId}.mp3`, response 200 `{ url: "/audio/tts-{messageId}.mp3", text: "Hello", messageId }`

#### Scenario: Uses defaults for optional params
- **WHEN** POST with only `{ text: "Hi" }`
- **THEN** uses `voice: "pm_alex"`, `speed: 1`, generates `tts-{timestamp}.mp3`

#### Scenario: Accepts messageId for deterministic filename
- **WHEN** POST with `{ text: "Hi", messageId: "msg-123" }`
- **THEN** saves as `tts-msg-123.mp3`

#### Scenario: Rejects empty text
- **WHEN** POST with `{ text: "" }`
- **THEN** response 400 `{ error: "Text is required" }`

#### Scenario: Handles speaches timeout (30s)
- **WHEN** speaches API exceeds 30s
- **THEN** response 504 `{ error: "TTS request timeout" }`

#### Scenario: Handles speaches unreachable
- **WHEN** speaches connection fails
- **THEN** response 502 `{ error: "TTS service unreachable" }`

#### Scenario: Handles speaches API error
- **WHEN** speaches returns non-2xx
- **THEN** response 502 `{ error: "TTS generation failed: <status>" }`

### Requirement: TTS Existence Check Endpoint
The system SHALL check if TTS exists for message at `GET /api/tts/:messageId`.

#### Scenario: Returns exists true with URL
- **WHEN** GET `/api/tts/msg-123` and file exists
- **THEN** response 200 `{ exists: true, url: "/audio/tts-msg-123.mp3" }`

#### Scenario: Returns exists false
- **WHEN** GET for non-existent messageId
- **THEN** response 200 `{ exists: false }`

### Requirement: STT Transcription Endpoint
The system SHALL transcribe audio via speaches API at `POST /api/stt` (multipart/form-data).

#### Scenario: Transcribes uploaded audio
- **WHEN** POST `/api/stt` with `audio` file, `model`, `language`, `response_format`, `temperature`, `vad_filter`
- **THEN** calls speaches `/v1/audio/transcriptions`, response 200 `{ text, segments[] }`

#### Scenario: Uses defaults for optional params
- **WHEN** POST with only audio file
- **THEN** uses `model: "Systran/faster-whisper-large-v3"`, `language: "pt"`, `response_format: "json"`, `temperature: 0.3`, `vad_filter: true`

#### Scenario: Rejects missing audio
- **WHEN** POST without audio file
- **THEN** response 400

#### Scenario: Handles speaches errors
- **WHEN** speaches returns error
- **THEN** response 500

### Requirement: Audio Upload Endpoint
The system SHALL upload recorded audio at `POST /api/upload-audio` (multipart/form-data).

#### Scenario: Saves audio and transcribes
- **WHEN** POST `/api/upload-audio` with audio file
- **THEN** saves to `public/recordings/`, transcribes via STT, response 200 `{ audioPath, fileName, size, mimetype, transcript, segments[] }`

#### Scenario: Rejects missing audio
- **WHEN** POST without audio
- **THEN** response 400

### Requirement: Audio File Serving with Range Support
The system SHALL serve audio files at `GET /audio/:id` with Range header support.

#### Scenario: Full file served without Range
- **WHEN** GET `/audio/abc123`
- **THEN** response 200 `audio/mpeg` with `Accept-Ranges: bytes`, `Content-Length`, stream

#### Scenario: Partial content with Range
- **WHEN** GET `/audio/abc123` with `Range: bytes=0-1023`
- **THEN** response 206 with `Content-Range: bytes 0-1023/total`, `Content-Length: 1024`, partial stream

#### Scenario: Returns 404 for missing/evicted audio
- **WHEN** GET `/audio/missing` or file deleted
- **THEN** response 404 `{ error: "Audio not found" }`

#### Scenario: Cleans up evicted audio from index
- **WHEN** audio file missing on disk
- **THEN** removed from audioFileManager index, 404 returned