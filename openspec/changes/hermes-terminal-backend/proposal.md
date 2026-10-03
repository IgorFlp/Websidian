## Why

The frontend needs a backend service that consumes the official Hermes API server (OpenAI-compatible), exposing endpoints for chat interactions, session management, and profile discovery. The service must generate TTS audio for AI responses only (not human messages), manage temporary audio files with a 10-message limit, and serve pre-rendered HTML for both chat messages and session lists.

## What Changes

- Create a new backend service (`hermes-api-backend`) that consumes the Hermes API server
- Implement REST endpoints: `POST /chat` (using Hermes `/api/sessions/{id}/chat`), `GET /sessions` (proxy to Hermes `/api/sessions` returning HTML), `GET /profiles` (multi-profile routing discovery), `GET /audio/:id`
- Add TTS audio generation for AI responses using Hermes Neural Voxtral
- Implement temporary audio file storage with cleanup (max 10 most recent messages)
- Server-side render HTML message blocks for chat responses
- Server-side render HTML session list from Hermes sessions API
- Only the last AI message block includes autoplay on its audio player

## Capabilities

### New Capabilities
- `hermes-api-client`: Core Hermes API server communication (bearer auth, base URL config)
- `chat-session`: Session-aware chat using Hermes `/api/sessions/{id}/chat` endpoint
- `sessions-list`: Session listing endpoint proxying to Hermes `/api/sessions` with HTML rendering
- `profiles-discovery`: Profile discovery using Hermes multi-profile routing
- `tts-audio-generation`: TTS audio file generation for AI responses only
- `audio-file-management`: Temporary audio file storage with 10-message retention policy
- `html-message-rendering`: Server-side HTML rendering of chat messages

### Modified Capabilities
- None (this is a new service replacing hermes-terminal-backend)

## Impact

- New backend service (Node.js/TypeScript + Fastify/Express) consuming Hermes REST API
- New REST API endpoints under `/chat`, `/sessions`, `/profiles`, `/audio`
- Temporary file storage for audio files (cleanup on startup/shutdown/rotation)
- Dependency on Hermes API server (running on localhost:8642 or configured host/port)
- No terminal process management needed (no node-pty, no ANSI parsing)
- No breaking changes to existing systems (new service replacing old one)