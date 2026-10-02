## Why

The frontend needs a backend service that manages a persistent terminal session with the Hermes agent, exposing endpoints for text/audio input and polling-based output retrieval. The service must generate TTS audio for AI responses only (not human messages), manage temporary audio files with a 10-message limit, and serve pre-rendered HTML with only the latest audio button having autoplay.

## What Changes

- Create a new backend service (`hermes-terminal-backend`) that spawns and manages a terminal process running the Hermes agent
- Implement REST endpoints: `GET /terminal/poll?since=ts`, `POST /terminal/input`, `GET /audio/:id`
- Add TTS audio generation for AI responses
- Implement temporary audio file storage with cleanup (max 10 most recent messages)
- Server-side render HTML message blocks with ANSI-to-HTML conversion
- Only the last AI message block includes autoplay on its audio player

## Capabilities

### New Capabilities
- `hermes-terminal`: Core terminal session management with Hermes agent process
- `terminal-input`: Text and audio input endpoints for user interaction
- `terminal-polling`: Long-polling GET endpoint for terminal output with HTML rendering
- `tts-audio-generation`: TTS audio file generation for AI responses only
- `audio-file-management`: Temporary audio file storage with 10-message retention policy
- `html-message-rendering`: Server-side HTML rendering of terminal messages with ANSI conversion

### Modified Capabilities
- None (this is a new service)

## Impact

- New backend service (likely Node.js/TypeScript or Go) with terminal process management
- New REST API endpoints under `/terminal/*` and `/audio/*`
- Temporary file storage for audio files (cleanup on startup/shutdown/rotation)
- Dependency on Hermes agent CLI and TTS engine 
- ANSI-to-HTML conversion library for terminal output rendering
- No breaking changes to existing systems (new service)