## Why

The current Hermes page implementation has functional HTML/JS but lacks the refined visual design, responsive layout, and advanced interactions specified in the design reference. The page needs to match the "Obsidian Terminal" design system with proper color theming, typography hierarchy, fixed viewport layout with scrollable components, press-and-hold microphone recording with visual feedback, audio duration counter, session deletion, slide-in animations for new messages, and audio player integration for voice messages.

## What Changes

- Complete visual redesign of `public/hermes.html`, `public/hermes.css`, `public/hermes.js` to match the design reference
- Implement fixed viewport height layout (`h-screen`) with scrollable sidebar sessions list and terminal stream
- Redesign microphone button as circular press-and-hold with grow animation and color change during recording + seconds counter
- Add delete session functionality with confirmation
- Add slide-in animation for new AI messages (last message only)
- Add audio player component in user messages when input is audio (attach player alongside transcribed text)
- Implement full color system from design reference (dark purple/violet theme)
- Apply typography hierarchy: Space Grotesk (headlines), Geist (body), JetBrains Mono (code/telemetry)
- Add responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- Ensure Android 4 compatibility (no modern CSS features, polyfills for classList/closest/matches)

## Capabilities

### New Capabilities
- `hermes-visual-design`: Complete visual redesign with color system, typography, elevation, shapes
- `hermes-fixed-viewport-layout`: Fixed height viewport with internally scrollable components
- `hermes-mic-press-hold`: Circular microphone button with press-and-hold recording, grow animation, color feedback, duration counter
- `hermes-session-deletion`: Delete session capability with confirmation
- `hermes-message-slide-in`: Slide-in animation for new AI messages (last message only)
- `hermes-voice-message-player`: Audio player embedded in user messages for voice input with transcript

### Modified Capabilities
- `hermes-chat-interface`: Existing chat interface - updating visual presentation and interactions
- `hermes-session-management`: Existing session list - adding deletion and visual redesign

## Impact

- **Frontend files**: `public/hermes.html`, `public/hermes.css`, `public/hermes.js` - complete rewrite
- **Backend**: No API changes required (existing endpoints support all functionality)
- **Dependencies**: Google Fonts (Space Grotesk, Geist, JetBrains Mono), Material Symbols Outlined
- **Browser compatibility**: Must work on Android 4+ (avoid CSS Grid, Flexbox gaps, modern selectors; use polyfills)
- **Server templates**: `server/src/html/HTMLRenderer.js` and templates may need updates for new message structure