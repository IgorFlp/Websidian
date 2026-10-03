## 1. Project Setup

- [ ] 1.1 Add dependencies to package.json: uuid, ffprobe (for audio duration)
- [ ] 1.2 Create Hermes API client module in src/hermes/
- [ ] 1.3 Create chat service module in src/chat/
- [ ] 1.4 Create sessions service module in src/sessions/
- [ ] 1.5 Create profiles service module in src/profiles/
- [ ] 1.6 Create audio file manager module in src/audio/
- [ ] 1.7 Create HTML renderer module in src/html/
- [ ] 1.8 Ensure ES modules compatible

## 2. Hermes API Client

- [ ] 2.1 Implement HermesClient class with base URL and bearer auth (src/hermes/HermesClient.js)
- [ ] 2.2 Add health check method (GET /health)
- [ ] 2.3 Add request/response logging
- [ ] 2.4 Add error handling with retry logic
- [ ] 2.5 Export singleton instance

## 3. Chat Endpoint (POST /chat)

- [ ] 3.1 Add POST /chat route to api.js
- [ ] 3.2 Validate JSON payload: { input: string, sessionId?: string }
- [ ] 3.3 If no sessionId: create new session via Hermes POST /api/sessions
- [ ] 3.4 Append audio instruction: "Responda em texto e em audio e me retorne o caminho do audio temp"
- [ ] 3.5 Forward chat to Hermes POST /api/sessions/{id}/chat with combined input
- [ ] 3.6 Parse Hermes response for text content and audio file path
- [ ] 3.7 Copy audio file from Hermes temp to managed temp via AudioFileManager
- [ ] 3.8 Render HTML message block via HTMLRenderer
- [ ] 3.9 Return JSON: { sessionId, html, audio[] }
- [ ] 3.10 Handle errors: 404 for invalid session, 500 for Hermes errors

## 4. Sessions List Endpoint (GET /sessions)

- [ ] 4.1 Add GET /sessions route to api.js
- [ ] 4.2 Parse pagination query params: limit, offset
- [ ] 4.3 Proxy to Hermes GET /api/sessions with params
- [ ] 4.4 Render sessions list as HTML via HTMLRenderer
- [ ] 4.5 Return HTML response (Content-Type: text/html)
- [ ] 4.6 Add POST /sessions for creating new session

## 5. Profiles Endpoint (GET /profiles)

- [ ] 5.1 Add GET /profiles route to api.js
- [ ] 5.2 Discover profiles via multi-profile routing
- [ ] 5.3 Call Hermes GET /p/<profile>/v1/models for each profile
- [ ] 5.4 Return JSON array: [{ name, modelName, endpoint, isDefault }]
- [ ] 5.5 Cache profile list with TTL (e.g., 5 minutes)

## 6. Audio File Management

- [ ] 6.1 Implement AudioFileManager class with in-memory index (src/audio/AudioFileManager.js)
- [ ] 6.2 Track: id, path, text, timestamp, duration (max 10 entries)
- [ ] 6.3 On new audio: copy from Hermes temp to managed temp, add to index, evict oldest if >10, delete file
- [ ] 6.4 Startup cleanup: remove orphaned hermes-api-*.mp3 files
- [ ] 6.5 Add GET /audio/:id route to api.js with Range request support
- [ ] 6.6 Return 404 for missing/evicted audio IDs
- [ ] 6.7 Extract audio duration using ffprobe

## 7. HTML Message Rendering

- [ ] 7.1 Implement HTMLRenderer class for server-side rendering (src/html/HTMLRenderer.js)
- [ ] 7.2 Render chat message block structure (header, body, audio player)
- [ ] 7.3 Calculate elapsed time for header display
- [ ] 7.4 Add autoplay attribute only to last AI message in response
- [ ] 7.5 Render audio player with waveform visual (static bars)
- [ ] 7.6 Omit audio player for human messages
- [ ] 7.7 Implement sessions list HTML rendering
- [ ] 7.8 HTML escape all user content to prevent XSS

## 8. Integration & Polish

- [ ] 8.1 Import and initialize all services in api.js (HermesClient, ChatService, SessionsService, ProfilesService, AudioFileManager, HTMLRenderer)
- [ ] 8.2 Add all routes to Fastify/Express app in api.js
- [ ] 8.3 Ensure CORS configured for frontend access
- [ ] 8.4 Add request logging and error handling for new routes
- [ ] 8.5 Test end-to-end: start server → create session → chat → verify HTML + audio
- [ ] 8.6 Verify 10-file audio limit enforced correctly
- [ ] 8.7 Verify autoplay only on last AI message
- [ ] 8.8 Test sessions list HTML rendering
- [ ] 8.9 Test profiles endpoint
- [ ] 8.10 Test audio instruction injection and response parsing
- [ ] 8.11 Document new API endpoints in README.md