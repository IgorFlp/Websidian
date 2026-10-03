## Context

This is a new backend service (`hermes-api-backend`) that consumes the official Hermes API server (OpenAI-compatible). The frontend will use session-aware chat via Hermes `/api/sessions/{id}/chat`, list sessions via `/api/sessions`, and discover profiles via multi-profile routing. Every prompt sent to Hermes must include "Responda em texto e em audio e me retorne o caminho do audio temp". The chat endpoint parses Hermes' response to separate text content and audio file path, manages temporary audio files (max 10), and server-side renders HTML for both chat messages and session lists.

## Goals / Non-Goals

**Goals:**
- Consume Hermes API server endpoints (chat, sessions, profiles)
- Expose REST endpoints: `POST /chat`, `GET /sessions` (HTML), `GET /profiles`, `GET /audio/:id`
- Inject audio instruction into every Hermes prompt: "Responda em texto e em audio e me retorne o caminho do audio temp"
- Parse Hermes response to extract text content and audio file path
- Store audio files temporarily with 10-message retention (FIFO cleanup)
- Server-side render HTML message blocks for chat responses
- Server-side render HTML session list from Hermes sessions API
- Only the last AI message block has autoplay on audio player
- Return JSON with message HTML and audio array from chat endpoint

**Non-Goals:**
- Terminal process management (replaced by Hermes API server)
- WebSocket support (polling/HTTP only)
- Audio input processing (STT) - only text input for now
- Persistent message history across restarts (handled by Hermes)
- Authentication/authorization (handled by Hermes API server bearer token)
- Local TTS generation (Hermes handles audio generation and returns temp file path)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language/Framework | Node.js + TypeScript + Fastify | Good HTTP client support, Fastify for performance |
| Hermes API Client | Native `fetch` with bearer auth | Simple, no extra dependencies |
| Chat Endpoint | `/api/sessions/{id}/chat` (session-aware) | Server-side conversation history, multi-turn context |
| Sessions Endpoint | Proxy to `/api/sessions` with HTML rendering | Direct proxy, Websidian renders HTML |
| Profiles Endpoint | Multi-profile routing discovery | List all configured profiles with their endpoints |
| Audio Generation | Hermes returns temp audio file path | Hermes handles TTS internally per instruction |
| Audio Format | MP3 (as returned by Hermes) | Broad browser support |
| Temp File Storage | OS temp directory (`os.tmpdir()`) with in-memory index | Simple, automatic cleanup on reboot, 10-file limit enforced in memory |
| HTML Rendering | Server-side template strings | No template engine needed, simple and fast |
| Response Parsing | Extract text + audio path from Hermes output | Hermes returns both in structured response |

### Audio File Management
- In-memory array tracking last 10 audio files: `{ id, path, text, timestamp, duration }`
- On new AI response: extract audio path from Hermes response → copy/move to managed temp → add to array → if length > 10, delete oldest file
- Cleanup on startup: remove orphaned temp files matching pattern

### HTML Rendering - Chat Messages
- Server renders complete message blocks as HTML strings
- Each block: header (agent name, timestamp, elapsed), body (message text), optional CLI snippet, audio player
- Only last block in batch gets `autoplay` attribute on audio element
- Audio player includes waveform visual (static bars)

### HTML Rendering - Sessions List
- Server renders session list as HTML (ul/li or table)
- Each session: title, last activity timestamp, message count, action buttons
- Uses data from Hermes `/api/sessions` response

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hermes API server unavailable | Health check endpoint; graceful error responses |
| Audio file accumulation | Strict 10-file limit + startup cleanup |
| Hermes not returning audio path | Fallback: no audio player; log warning |
| Session continuity | Use Hermes session IDs; client tracks active session |
| Multi-profile routing complexity | Discover profiles at startup; cache with TTL |
| API version changes | Pin Hermes API version; integration tests |

## Migration Plan

1. Create service skeleton with Fastify
2. Implement Hermes API client with bearer auth
3. Implement chat endpoint using `/api/sessions/{id}/chat` with audio instruction injection
4. Implement response parsing to extract text and audio path
5. Implement sessions list endpoint proxying to `/api/sessions` with HTML rendering
6. Implement profiles endpoint using multi-profile routing
7. Add audio file management (copy from Hermes temp to managed temp)
8. Add audio serving endpoint
9. Test end-to-end with frontend

## Open Questions

- How does Hermes API indicate AI vs human messages in `/api/sessions/{id}/chat` response? (Need parsing strategy)
- Exact format of Hermes response with audio path? (Need to inspect actual response)
- Should session list HTML be a full page fragment or just a list component?
- Profile discovery: poll periodically or on-demand?
- Does Hermes return absolute or relative audio path?