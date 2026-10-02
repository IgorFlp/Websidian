## 1. Project Setup (Extend Existing Express API)

- [ ] 1.1 Add dependencies to existing package.json: node-pty, ansi-to-html, uuid
- [ ] 1.2 Create terminal service modules in src/terminal/ (importable by api.js)
- [ ] 1.3 Create TTS service module in src/tts/
- [ ] 1.4 Create audio file manager module in src/audio/
- [ ] 1.5 Create HTML renderer module in src/html/
- [ ] 1.6 Ensure ES modules compatible (api.js uses import/export)

## 2. Terminal Process Management

- [ ] 2.1 Implement TerminalManager class using node-pty (src/terminal/TerminalManager.js)
- [ ] 2.2 Spawn Hermes agent process on startup
- [ ] 2.3 Capture stdout/stderr streams with timestamps
- [ ] 2.4 Implement in-memory output buffer with 10k line limit
- [ ] 2.5 Add process crash detection and exponential backoff restart
- [ ] 2.6 Implement graceful shutdown (SIGTERM handling)
- [ ] 2.7 Export singleton instance for use in api.js routes

## 3. Input Endpoints (Add to api.js)

- [ ] 3.1 Add POST /terminal/input route to api.js
- [ ] 3.2 Validate JSON payload: { type: "text", content: string }
- [ ] 3.3 Forward text input to terminal stdin with newline via TerminalManager
- [ ] 3.4 Return 202 Accepted on success, 400 on invalid payload
- [ ] 3.5 Add multipart support for future audio input (placeholder)

## 4. Polling Endpoint (Add to api.js)

- [ ] 4.1 Add GET /terminal/poll?since=<timestamp> route to api.js
- [ ] 4.2 Parse and validate `since` query parameter (Unix ms)
- [ ] 4.3 Implement long-poll: hold request up to 30s for new output
- [ ] 4.4 Filter terminal buffer for lines after `since` timestamp
- [ ] 4.5 Parse terminal output into message blocks (AI vs human detection)
- [ ] 4.6 Return JSON: { since, html, audio[] } schema
- [ ] 4.7 Integrate HTMLRenderer and AudioFileManager for response

## 5. TTS Audio Generation

- [ ] 5.1 Research Hermes Neural Voxtral CLI/API for TTS generation
- [ ] 5.2 Implement TTSService class with generate(text) method (src/tts/TTSService.js)
- [ ] 5.3 Execute Voxtral CLI to produce MP3 file
- [ ] 5.4 Extract audio duration from generated file (ffprobe or metadata)
- [ ] 5.5 Save MP3 to temp directory with UUID filename
- [ ] 5.6 Only trigger TTS for detected AI agent responses

## 6. Audio File Management

- [ ] 6.1 Implement AudioFileManager class with in-memory index (src/audio/AudioFileManager.js)
- [ ] 6.2 Track: id, path, text, timestamp, duration (max 10 entries)
- [ ] 6.3 On new audio: add to index, evict oldest if >10, delete file
- [ ] 6.4 Startup cleanup: remove orphaned hermes-terminal-*.mp3 files
- [ ] 6.5 Add GET /audio/:id route to api.js with Range request support
- [ ] 6.6 Return 404 for missing/evicted audio IDs

## 7. HTML Message Rendering

- [ ] 7.1 Implement HTMLRenderer class for server-side rendering (src/html/HTMLRenderer.js)
- [ ] 7.2 Convert ANSI codes to HTML using ansi-to-html library
- [ ] 7.3 Render message block structure per spec (header, body, CLI snippet, audio)
- [ ] 7.4 Calculate elapsed time for header display
- [ ] 7.5 Parse CLI snippets from terminal output (optional)
- [ ] 7.6 Add autoplay attribute only to last AI message in batch
- [ ] 7.7 Render audio player with waveform visual (static bars)
- [ ] 7.8 Omit audio player for non-AI messages

## 8. Integration & Polish

- [ ] 8.1 Import and initialize all services in api.js (TerminalManager, TTSService, AudioFileManager, HTMLRenderer)
- [ ] 8.2 Add terminal routes to existing Express app in api.js
- [ ] 8.3 Ensure CORS configured for frontend access (already in Express)
- [ ] 8.4 Add request logging and error handling for new routes
- [ ] 8.5 Test end-to-end: start server → poll → input → verify HTML + audio
- [ ] 8.6 Verify 10-file audio limit enforced correctly
- [ ] 8.7 Verify autoplay only on last AI message
- [ ] 8.8 Document new API endpoints in README.md