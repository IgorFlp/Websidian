## Context

This is a new backend service (`hermes-terminal-backend`) that manages a persistent terminal session running the Hermes agent. The frontend will poll for terminal output and send user input (text or audio). The service must generate TTS audio for AI responses only, manage temporary audio files (max 10), and server-side render HTML with ANSI-to-HTML conversion.

## Goals / Non-Goals

**Goals:**
- Spawn and manage a persistent terminal process running Hermes agent
- Expose REST endpoints: `GET /terminal/poll?since=ts`, `POST /terminal/input`, `GET /audio/:id`
- Generate TTS audio for AI responses
- Store audio files temporarily with 10-message retention (FIFO cleanup)
- Server-side render HTML message blocks with ANSI-to-HTML conversion
- Only the last AI message block has autoplay on audio player
- Return JSON with `since`, `html`, and `audio[]` array

**Non-Goals:**
- WebSocket support (polling only)
- Multi-user/terminal session support (single terminal instance)
- Audio input processing (STT) - only text input for now
- Persistent message history across restarts
- Authentication/authorization

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language/Framework | Node.js + TypeScript + Fastify | Native terminal process management, good ANSI libraries, Fastify for performance |
| Terminal Management | `node-pty` or `pty.js` | Cross-platform pseudo-terminal support for spawning Hermes agent |
| ANSI to HTML | `ansi-to-html` or `ansi-up` | Mature libraries for converting terminal ANSI codes to HTML |
| TTS Engine | Ask on prompt and let hermes try | Specified in requirements |
| Audio Format | MP3 | Broad browser support, good compression |
| Temp File Storage | OS temp directory (`os.tmpdir()`) with in-memory index | Simple, automatic cleanup on reboot, 10-file limit enforced in memory |
| Polling Strategy | Long-poll with `since` timestamp | Simple, works with CDN/load balancers, no WebSocket complexity |
| Process Management | Single child process, restart on crash | Simplicity; Hermes agent maintains its own session state |

### Audio File Management
- In-memory array tracking last 10 audio files: `{ id, path, text, timestamp, duration }`
- On new AI response: generate TTS → save to temp → add to array → if length > 10, delete oldest file
- Cleanup on startup: remove orphaned temp files matching pattern

### HTML Rendering
- Server renders complete message blocks as HTML strings
- Each block: header (agent name, timestamp, elapsed), body (ANSI-converted text), optional CLI snippet, audio player
- Only last block in batch gets `autoplay` attribute on audio element
- Audio player includes waveform visual (static bars)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Terminal process crashes | Auto-restart with exponential backoff; log errors |
| Audio file accumulation | Strict 10-file limit + startup cleanup |
| ANSI parsing edge cases | Use battle-tested library; fallback to raw text |
| TTS generation latency | Async generation; return HTML immediately, audio URLs in response |
| Polling overhead | Long-poll with 30s timeout; client handles reconnection |
| Single terminal instance | Document limitation; future work for multi-session |

## Migration Plan

1. Create service skeleton with Fastify
2. Implement terminal process management
3. Add input endpoint (text first, audio later)
4. Implement polling endpoint with HTML rendering
5. Add TTS integration and audio file management
6. Add audio serving endpoint
7. Test end-to-end with frontend

## Open Questions

- How does Hermes agent indicate AI vs human messages in output? (Need parsing strategy)
────────────────────────────────────────
● Hello old friend
Initializing agent...
────────────────────────────────────────


┌─ Reasoning ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
The user says "Hello old friend". I need to respond in Portuguese as per the rules
. I should be polite, but also critical/objective/organized. Since it's a greeting
, I'll respond briefly in Portuguese, acknowledging and perhaps reminding of the wake
 word or asking how I can help. However, I must not use filler like "Great question". Just
 a direct response.

I'll say something like: "Oi Igor. Como posso ajudar hoje?" That's polite, in Portuguese, and
 direct. No filler. Let's respond.
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

╭─ ☤ Hermes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
Oi Igor. Como posso ajudar hoje?
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

────────────────────────────────────────
● só estou fazendo um teste
────────────────────────────────────────


┌─ Reasoning ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
Okay, the user is just testing the connection. They said "só estou fazendo um teste" which
 means "I'm just doing a test" in Portuguese.

Looking at the instructions, I need to be direct and match the reply to the weight of the
 ask. Since this is a simple test, a one-line response is appropriate. The user expects
 me to respond in Portuguese, as per their personal configuration.

I should avoid any filler or restating the request. Just a simple acknowledgment in Portuguese.
 Since they're testing, I'll keep it minimal but polite.

The system says: "Be direct: match the length of your reply to the weight of the ask — a
 one-line question gets a one-line answer"

So for a test message, a short confirmation is best. Something like "Teste recebido. T
udo funcionando." would work.

I need to make sure it's in Portuguese, no extra fluff. Let me go with that.
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

╭─ ☤ Hermes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
Teste recebido. Tudo funcionando.
╰──────────────────────────────────────

User messages has this ●, hermes message is wrapped with its named after the reasoning, put reasoning on a colapsed arrow down so i can read if needed, never TTS reasoning or code blocks, only the ai conversational response.

- Exact CLI command to start Hermes?
No needed add "Responda em audio e salve sua resposta em mp3 em pasta temp e retorne o caminho do audio" to every prompt sent to hermes, it will do automaticaly
- Audio duration metadata from TTS engine?
Yes please
- Should CLI snippet parsing be configurable?
Yes?

- Should terminal be configurable?
Yes, add env variables for how much messages the get terminal should return, threshold of temporary audio, model name, hermes optional args for terminal, hermes TTS provider and voice ID (add a setup call with hermes config set {env}
   hermes config set {env}  before starting hermes process)

   