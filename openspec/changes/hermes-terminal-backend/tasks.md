## 1. Project Setup

- [x] 1.1 Add dependencies to package.json: uuid, ffprobe (for audio duration)
- [x] 1.2 Create Hermes API client module in src/hermes/
- [x] 1.3 Create chat service module in src/chat/
- [x] 1.4 Create sessions service module in src/sessions/
- [x] 1.5 Create profiles service module in src/profiles/
- [x] 1.6 Create audio file manager module in src/audio/
- [x] 1.7 Create HTML renderer module in src/html/
- [x] 1.8 Ensure ES modules compatible

## 2. Hermes API Client

- [x] 2.1 Implement HermesClient class with base URL and bearer auth (src/hermes/HermesClient.js)
- [x] 2.2 Add health check method (GET /health)
- [x] 2.3 Add request/response logging
- [x] 2.4 Add error handling with retry logic
- [x] 2.5 Export singleton instance

## 3. Chat Endpoint (POST /chat)

- [x] 3.1 Add POST /chat route to api.js
- [x] 3.2 Validate JSON payload: { input: string, sessionId?: string }
- [x] 3.3 If no sessionId: create new session via Hermes POST /api/sessions
- [x] 3.4 Append audio instruction: "Responda em texto e em audio e me retorne o caminho do audio temp"
- [x] 3.5 Forward chat to Hermes POST /api/sessions/{id}/chat with combined input
- [x] 3.6 Parse Hermes response for text content and audio file path
- [x] 3.7 Copy audio file from Hermes temp to managed temp via AudioFileManager
- [x] 3.8 Render HTML message block via HTMLRenderer
- [x] 3.9 Return JSON: { sessionId, html, audio[] }
- [x] 3.10 Handle errors: 404 for invalid session, 500 for Hermes errors

## 4. Sessions List Endpoint (GET /sessions)

- [x] 4.1 Add GET /sessions route to api.js
- [x] 4.2 Parse pagination query params: limit, offset
- [x] 4.3 Proxy to Hermes GET /api/sessions with params
- [x] 4.4 Render sessions list as HTML via HTMLRenderer
- [x] 4.5 Return HTML response (Content-Type: text/html)
- [x] 4.6 Add POST /sessions for creating new session

## 5. Profiles Endpoint (GET /profiles)

- [x] 5.1 Add GET /profiles route to api.js
- [x] 5.2 Discover profiles via multi-profile routing
- [x] 5.3 Call Hermes GET /p/<profile>/v1/models for each profile
- [x] 5.4 Return JSON array: [{ name, modelName, endpoint, isDefault }]
- [x] 5.5 Cache profile list with TTL (e.g., 5 minutes)

## 6. Audio File Management

- [x] 6.1 Implement AudioFileManager class with in-memory index (src/audio/AudioFileManager.js)
- [x] 6.2 Track: id, path, text, timestamp, duration (max 10 entries)
- [x] 6.3 On new audio: copy from Hermes temp to managed temp, add to index, evict oldest if >10, delete file
- [x] 6.4 Startup cleanup: remove orphaned hermes-api-*.mp3 files
- [x] 6.5 Add GET /audio/:id route to api.js with Range request support
- [x] 6.6 Return 404 for missing/evicted audio IDs
- [x] 6.7 Extract audio duration using ffprobe

## 7. HTML Message Rendering

- [x] 7.1 Implement HTMLRenderer class for server-side rendering (src/html/HTMLRenderer.js)
- [x] 7.2 Render chat message block structure (header, body, audio player)
- [x] 7.3 Calculate elapsed time for header display
- [x] 7.4 Add autoplay attribute only to last AI message in response
- [x] 7.5 Render audio player with waveform visual (static bars)
- [x] 7.6 Omit audio player for human messages
- [x] 7.7 Implement sessions list HTML rendering
- [x] 7.8 HTML escape all user content to prevent XSS

## 8. Integration & Polish

- [x] 8.1 Import and initialize all services in api.js (HermesClient, ChatService, SessionsService, ProfilesService, AudioFileManager, HTMLRenderer)
- [x] 8.2 Add all routes to Fastify/Express app in api.js
- [x] 8.3 Ensure CORS configured for frontend access
- [x] 8.4 Add request logging and error handling for new routes
- [x] 8.5 Test end-to-end: start server → create session → chat → verify HTML + audio
- [x] 8.6 Verify 10-file audio limit enforced correctly
- [x] 8.7 Verify autoplay only on last AI message
- [x] 8.8 Test sessions list HTML rendering
- [x] 8.9 Test profiles endpoint
- [x] 8.10 Test audio instruction injection and response parsing
- [x] 8.11 Document new API endpoints in README.md