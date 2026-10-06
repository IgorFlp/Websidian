## Context

The Hermes page (`public/hermes.html`, `public/hermes.css`, `public/hermes.js`) currently has a functional but basic implementation using a light color theme, simple flexbox layout, and standard click-based microphone recording. The design reference (`docs/design-reference/hermes page/DESIGN.md` and `code.html`) specifies a sophisticated "Obsidian Terminal" dark theme with purple/violet accents, fixed viewport layout, advanced microphone interactions, and specific component designs.

Current state:
- Light theme with basic colors
- Standard flexbox layout without fixed viewport
- Click-to-record microphone (no press-and-hold, no visual feedback during recording)
- No session deletion
- No message animations
- No audio player for voice messages in chat
- Basic typography (Segoe UI)
- Works on modern browsers but not tested on Android 4

## Goals / Non-Goals

**Goals:**
- Full visual redesign matching the design reference exactly
- Fixed viewport height (`height: 100vh` / `h-screen`) with internally scrollable sidebar and terminal stream
- Responsive layout: mobile (<768px) single column, tablet (768-1024px) with sidebar, desktop (>1024px) multi-pane
- Circular microphone button (36x36px) with press-and-hold recording:
  - Grow animation (scale up) while holding
  - Color change to primary violet (#8B5CF6) with pulse glow during recording
  - Seconds counter appearing next to button during recording
- Session deletion with confirmation modal
- Slide-in animation (from bottom, fade + translateY) for new AI messages (only the last message added)
- Audio player component in user messages when input was voice (show player + transcript text)
- Complete color system from design reference (CSS custom properties)
- Typography hierarchy: Space Grotesk (headlines), Geist (body), JetBrains Mono (code/telemetry)
- Android 4 compatibility with polyfills (no CSS Grid, no modern Flexbox gaps, no `clamp()`, no `min()/max()`)

**Non-Goals:**
- Backend API changes (existing endpoints sufficient)
- Server-side rendering changes (HTMLRenderer.js updates only if message structure changes)
- WebSocket/streaming implementation (keep existing polling)
- New session creation flow changes (keep existing)
- Profile selector functionality changes (visual only)
- TTS backend changes

## Decisions

### 1. CSS Architecture: Custom Properties + Utility Classes
**Decision**: Use CSS custom properties for the complete color system and spacing scale, combined with utility classes similar to the current approach but expanded.
**Rationale**: 
- Design reference uses a comprehensive token system that maps directly to CSS custom properties
- Utility classes allow rapid HTML composition without writing custom CSS for each component
- Maintains Android 4 compatibility (custom properties work with polyfill or fallback)
- Avoids Tailwind/CDN dependency (design reference uses Tailwind but we need self-contained)

**Alternatives considered**:
- Tailwind CDN: Rejected - adds external dependency, doesn't work offline, larger bundle
- CSS Modules: Rejected - adds build step complexity
- Plain CSS with BEM: Rejected - too verbose for the utility-first approach needed

### 2. Layout: Fixed Viewport with Flexbox
**Decision**: Use `height: 100vh` on root container with `flex-column` and `overflow: hidden`, then internal `overflow-y: auto` on scrollable regions.
**Rationale**: 
- Matches design reference exactly (`h-screen w-screen overflow-hidden flex flex-col`)
- Works on Android 4 (flexbox with prefixes)
- Avoids CSS Grid (not supported on Android 4)
- Scrollable regions: sidebar sessions list, terminal stream content

**Alternatives considered**:
- CSS Grid: Rejected - no Android 4 support
- Absolute positioning: Rejected - less maintainable

### 3. Microphone Interaction: Press-and-Hold with Pointer Events
**Decision**: Use `mousedown`/`mouseup`/`mouseleave` + `touchstart`/`touchend`/`touchcancel` for press-and-hold. Visual feedback via CSS classes toggled on the button.
**Rationale**:
- Pointer events not available on Android 4
- Touch + mouse events cover all target platforms
- CSS transitions for grow (scale) and color change
- Seconds counter: separate element positioned absolutely next to button, shown only during recording

**Alternatives considered**:
- Pointer Events API: Rejected - no Android 4 support
- Long-press gesture libraries: Rejected - external dependency

### 4. Message Animation: CSS Keyframes on New Elements
**Decision**: Apply animation class to the last `.ai-message` added to DOM. Use `animation: slideIn 0.3s ease-out forwards`.
**Rationale**:
- Only animate the newest message (requirement)
- CSS animations are hardware-accelerated
- Simple to implement: add class on insertion, remove after animation ends

**Alternatives considered**:
- IntersectionObserver: Rejected - overkill, not needed for append-only
- JS-based animation: Rejected - less performant

### 5. Voice Message Player: Inline Component in User Message
**Decision**: When backend returns audio metadata with user message, render an inline audio player component (play button, waveform, duration) alongside the transcript text.
**Rationale**:
- Design reference shows TTS player in agent messages, but requirement is for user voice messages
- Keep consistent visual language with agent TTS player
- Reuse existing `/audio/:id` endpoint for playback

**Alternatives considered**:
- Separate audio message type: Rejected - adds complexity
- Modal player: Rejected - disrupts flow

### 6. Session Deletion: Confirmation Modal
**Decision**: Add delete button to session cards (hover reveal), click opens confirmation modal, confirm calls DELETE `/sessions/:id`.
**Rationale**:
- Prevents accidental deletion
- Follows existing API pattern (DELETE `/sessions/:id` exists in backend)
- Modal uses same visual language (dark theme, violet accents)

### 7. Font Loading: Google Fonts with Preconnect
**Decision**: Load Space Grotesk, Geist, JetBrains Mono via Google Fonts with `preconnect` and `display=swap`.
**Rationale**:
- Design reference specifies these exact fonts
- `display=swap` prevents FOIT (Flash of Invisible Text)
- Preconnect improves load time
- Fallback fonts defined in CSS for offline/Android 4

### 8. Android 4 Compatibility Strategy
**Decision**: 
- Include polyfills for `Element.prototype.closest`, `matches`, `classList` (already in hermes.js)
- Use `-webkit-` prefixes for flexbox
- Avoid: CSS Grid, `gap` property (use margin), `clamp()`, `min()/max()`, CSS custom properties without fallback, `backdrop-filter` (use solid background fallback), `animation` without `-webkit-` prefix
- Test on Android 4 emulator

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| CSS custom properties not supported on Android 4 | Provide fallback values in CSS (e.g., `background: #16111d; background: var(--surface);`) |
| `backdrop-filter` not supported | Use semi-transparent solid backgrounds as fallback (`rgba(22,17,29,0.85)`) |
| Flexbox `gap` not supported | Use margin on children instead |
| Google Fonts blocked in some environments | Define system font fallbacks in font-family stacks |
| Press-and-hold conflicts with scroll on mobile | Use `touch-action: none` on mic button, prevent default on touchstart |
| Animation performance on low-end devices | Keep animations simple (transform/opacity only), respect `prefers-reduced-motion` |
| Session deletion UX on mobile | Ensure modal is touch-friendly, large tap targets |

## Migration Plan

1. Create new `hermes.css` with complete design system (colors, typography, utilities, components)
2. Rewrite `hermes.html` with new structure matching design reference
3. Rewrite `hermes.js` with new interactions (mic press-hold, session deletion, animations, voice player)
4. Update `server/src/html/HTMLRenderer.js` if message HTML structure changes
5. Test on desktop, tablet, mobile viewports
6. Test on Android 4 emulator
7. Deploy

Rollback: Keep old files as `hermes.old.html/css/js` until verified.

## Open Questions

1. Should the sidebar be collapsible on mobile (hamburger menu) or always visible?
Collapsible
2. What is the exact API for session deletion? (DELETE `/sessions/:id` assumed)
Not implemented yet
3. Should the boot block be preserved exactly as in design reference or simplified?
Remove boot block.
4. Are Material Symbols Outlined icons required or can we use Unicode/emoji fallbacks for Android 4?
Use only android 4 compatible, you may search and download SVGs from flaticon