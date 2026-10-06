## 1. CSS Design System Foundation

- [ ] 1.1 Create new `public/hermes.css` with complete color system (CSS custom properties with fallbacks)
- [ ] 1.2 Define typography system: Space Grotesk, Geist, JetBrains Mono font-face declarations with Google Fonts preconnect
- [ ] 1.3 Define spacing scale tokens (--space-*, --gutter, --margin)
- [ ] 1.4 Define border radius scale (--radius-sm, --radius, --radius-lg, --radius-full)
- [ ] 1.5 Define elevation/shadow system (Layer 0-3 shadows and borders)
- [ ] 1.6 Create utility classes for: flex, gap, padding, margin, colors, typography, borders, shadows, transitions
- [ ] 1.7 Add responsive breakpoint utilities (mobile, tablet, desktop)
- [ ] 1.8 Add Android 4 compatible flexbox prefixes (-webkit-box, -ms-flexbox)
- [ ] 1.9 Add custom scrollbar styling for terminal

## 2. HTML Structure Rewrite

- [ ] 2.1 Rewrite `public/hermes.html` with new semantic structure matching design reference
- [ ] 2.2 Implement fixed viewport root: `h-screen w-screen overflow-hidden flex flex-col md:flex-row`
- [ ] 2.3 Build sidebar with: header (title, status, profile selector, new session), scrollable sessions list, footer (version, settings, help)
- [ ] 2.4 Build main terminal: header (window controls, title, status), scrollable stream (boot block, messages), input deck
- [ ] 2.5 Add session card template with: active indicator, session ID, timestamp, subtitle, delete button (hidden by default)
- [ ] 2.6 Add message templates: AI message (header, reasoning, output, CLI, TTS), User message (right-aligned, voice player slot)
- [ ] 2.7 Add confirmation modal for session deletion
- [ ] 2.8 Add Google Fonts and Material Symbols Outlined links in head
- [ ] 2.9 Add viewport meta tag and theme-color

## 3. Microphone Press-and-Hold System

- [ ] 3.1 Redesign mic button: circular 36x36px, Material Symbols mic icon, resting state border
- [ ] 3.2 Implement press-and-hold detection: mousedown/touchstart + timer (100ms minimum)
- [ ] 3.3 Implement recording start: getUserMedia, MediaRecorder, visual feedback classes
- [ ] 3.4 Implement recording stop: mouseup/mouseleave/touchend/touchcancel, blob creation, STT upload
- [ ] 3.5 Add grow animation: CSS transform scale(1.15) with transition on `.recording` class
- [ ] 3.6 Add color change: background/border to #8B5CF6, icon to on-primary on `.recording`
- [ ] 3.7 Add pulse glow: box-shadow animation on `.recording`
- [ ] 3.8 Add duration counter: absolute positioned element next to button, updates every second
- [ ] 3.9 Handle Android 4 touch events: touch-action: none, preventDefault, passive: false
- [ ] 3.10 Ensure touch cancel/leave cancels recording cleanly

## 4. Session Deletion

- [ ] 4.1 Add delete button to session cards (trash icon, hidden, show on hover/focus)
- [ ] 4.2 Create confirmation modal HTML structure in hermes.html
- [ ] 4.3 Implement modal open/close logic with focus trap
- [ ] 4.4 Implement DELETE `/sessions/{id}` API call
- [ ] 4.5 Handle successful deletion: remove from DOM, refresh list, clear active if needed
- [ ] 4.6 Handle deletion errors: show error in modal, keep modal open
- [ ] 4.7 Add keyboard support: Escape to close, Enter to confirm

## 5. Message Slide-In Animation

- [ ] 5.1 Define `@keyframes slideInUp` in CSS (translateY 20px->0, opacity 0->1, 300ms ease-out)
- [ ] 5.2 Create `.animate-slide-in` utility class
- [ ] 5.3 Modify polling logic in hermes.js: detect new AI messages, apply animation class only to newest
- [ ] 5.4 Remove animation class after `animationend` event
- [ ] 5.5 Respect `prefers-reduced-motion`: disable animation via media query

## 6. Voice Message Player

- [ ] 6.1 Detect voice messages: check for `audio` property in user message data from backend
- [ ] 6.2 Create inline player component HTML: play/pause button, waveform, transcript, duration
- [ ] 6.3 Style player to match agent TTS player (colors, sizing, waveform bars)
- [ ] 6.4 Implement play/pause toggle using existing `/audio/{id}` endpoint
- [ ] 6.5 Handle audio state: play, pause, ended, error, auto-stop other audio
- [ ] 6.6 Render transcript text alongside player in user message card
- [ ] 6.7 Ensure waveform is static (visual indicator only, not real-time)

## 7. JavaScript Logic Rewrite

- [ ] 7.1 Rewrite `public/hermes.js` with modern structure (ES6 modules if possible, or IIFE)
- [ ] 7.2 Keep existing polyfills for Android 4 (closest, matches, classList)
- [ ] 7.3 Implement session loading: fetch `/sessions`, render with new card template
- [ ] 7.4 Implement session switching: click handler, load messages, start polling
- [ ] 7.5 Implement message polling: fetch `/messages/{id}`, diff new AI messages, animate last
- [ ] 7.6 Implement text input: Enter to send, send button click, optimistic UI update
- [ ] 7.7 Integrate mic press-hold system (from task 3)
- [ ] 7.8 Integrate session deletion (from task 4)
- [ ] 7.9 Integrate voice message player (from task 6)
- [ ] 7.10 Implement TTS playback for AI messages (reuse existing speakText logic)
- [ ] 7.11 Add reasoning toggle handlers (brain button)
- [ ] 7.12 Add debug panel toggle (keep existing for development)

## 8. Backend HTML Renderer Updates

- [ ] 8.1 Update `server/src/html/HTMLRenderer.js` to output new AI message HTML structure
- [ ] 8.2 Update AI message template (`public/components/AI-message-template.html`) for new design
- [ ] 8.3 Update human message template (`public/components/Human-message-template.html`) for voice player slot
- [ ] 8.4 Ensure code block formatting works with new CSS (pre/code with language-* classes)
- [ ] 8.5 Ensure ANSI-to-HTML conversion integrates with new code block styling
- [ ] 8.6 Update sessions template (`public/components/sessions-template.html`) for new card design

## 9. Responsive Testing & Polish

- [ ] 9.1 Test mobile layout (<768px): single column, touch targets, input deck usability
- [ ] 9.2 Test tablet layout (768-1024px): sidebar visible, stream scrollable
- [ ] 9.3 Test desktop layout (>1024px): multi-pane, hover states
- [ ] 9.4 Test Android 4 emulator: flexbox, touch events, fonts, animations
- [ ] 9.5 Test reduced motion preference
- [ ] 9.6 Verify all color contrasts meet accessibility minimums
- [ ] 9.7 Verify keyboard navigation: tab order, focus visible, Enter/Space activation
- [ ] 9.8 Test session creation, switching, deletion flows
- [ ] 9.9 Test voice recording, STT, playback flows
- [ ] 9.10 Test message polling, slide-in animation, TTS auto-play

## 10. Cleanup & Documentation

- [ ] 10.1 Remove old CSS/JS backup files
- [ ] 10.2 Update any documentation referencing old class names
- [ ] 10.3 Verify no console errors in production build
- [ ] 10.4 Confirm all design reference requirements met