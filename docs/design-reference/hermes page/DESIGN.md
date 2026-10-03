---
name: Obsidian Terminal
colors:
  surface: '#16111d'
  surface-dim: '#16111d'
  surface-bright: '#3d3645'
  surface-container-lowest: '#110c18'
  surface-container-low: '#1f1926'
  surface-container: '#231d2a'
  surface-container-high: '#2e2735'
  surface-container-highest: '#393240'
  on-surface: '#eadff1'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#eadff1'
  inverse-on-surface: '#342e3c'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#cebdff'
  on-secondary: '#381385'
  secondary-container: '#4f319c'
  on-secondary-container: '#bea8ff'
  tertiary: '#c8c2e9'
  on-tertiary: '#302c4b'
  tertiary-container: '#928cb1'
  on-tertiary-container: '#2a2644'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#21005e'
  on-secondary-fixed-variant: '#4f319c'
  tertiary-fixed: '#e5deff'
  tertiary-fixed-dim: '#c8c2e9'
  on-tertiary-fixed: '#1b1735'
  on-tertiary-fixed-variant: '#474363'
  background: '#16111d'
  on-background: '#eadff1'
  surface-variant: '#393240'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system manifests an elite, distraction-free environment tailored for autonomous agent orchestration, technical reasoning, and command execution. Target users are advanced software engineers, AI researchers, and technical power-users who demand speed, dense information architecture, and high aesthetic refinement. 

The aesthetic fuses **Minimalist Technical Developer** sensibilities with **Cyber-Terminal Precision**:
- Atmospheric depth through abyssal black-purple backgrounds rather than generic neutral grays.
- Neon violet luminance reserved strictly for agent state vectors, telemetry, focus highlights, and active command prompts.
- Rigorous density and clean message surfaces designed to prioritize terminal legibility, executable payloads, and voice-assisted interaction flows.
- Visual feedback is instantaneous and subdued; radiant glows are controlled and purposeful to maintain high contrast and eliminate cognitive exhaustion during extended operational cycles.

## Colors
The palette leverages a monochromatic depth of spectral purples paired with controlled luminous accents:

- **Canvas & Base Layer**: `#0D0814` serves as the primary canvas baseline, representing an ink-like purple void.
- **Surface Elevation Containers**:
  - `surface-container-low`: `#130C1E` (subtle structural segmentation, sidebars, dock rails)
  - `surface-container`: `#180F24` (message threads, inactive panels, card bodies)
  - `surface-container-high`: `#26173B` (elevated states, code blocks, active command prompts, hover overlays)
- **Primary Accent (`#8B5CF6`)**: Vivid electric violet used for active terminal prompts (`>_`), key action catalysts, audio frequency pulses, and dynamic focus outlines.
- **Secondary Accent (`#A78BFA`)**: Mid-tone lavender for secondary interactive triggers, muted command states, and agent metadata labels.
- **Tertiary Accent (`#DDD6FE`)**: Soft lilac tint used for high-emphasis inline code tokens, active voice transcript highlights, and badge accents.
- **Functional Semantics**:
  - Text Primary: `#F5F3FF`
  - Text Muted/Monochrome: `#9CA3AF`
  - Border Subdued: `rgba(139, 92, 246, 0.15)`
  - Border Active: `rgba(167, 139, 250, 0.45)`
  - Glow Ambient: `rgba(139, 92, 246, 0.25)`

## Typography
The system employs a tri-font hierarchy to cleanly bifurcate interface context, conversational flow, and technical telemetry:

- **Headlines (`Space Grotesk`)**: Imparts modern, geometric structure for workspace titles, modal headers, and main view states.
- **Narrative & Chat Body (`Geist`)**: Neutral, ultra-legible grotesque optimized for human-to-agent conversational prose, task descriptions, and tool documentation.
- **Telemetry, Code & System Labels (`JetBrains Mono`)**: Strict tabular alignment, crisp programming ligatures, and code block formatting. All timestamp stamps, agent command states, token usages, and audio playback timelines must strictly utilize the monospace hierarchy.

## Layout & Spacing
The layout strategy prioritizes a vertical, chronological command feed with a persistent, grounded control deck:

- **Grid & Columns**: A fluid 12-column layout on desktop screens with a max-width conversational rail (`768px` to `896px`) centered or offset to accommodate telemetry panels. Mobile layouts collapse to a single flex column with `margin: 1rem`.
- **Rhythm & Flow**: Built around a base `0.25rem` (4px) scale. Interactive blocks, terminal logs, and system bubbles leverage tight vertical gaps (`space-sm` to `space-md`), minimizing unnecessary scrolls while retaining breathing room between disparate agent cycles.
- **Breakpoint Dynamics**:
  - `Mobile (<768px)`: Edge-to-edge conversational feed, collapsible execution details, pinned bottom multi-modal action dock.
  - `Tablet (768px - 1024px)`: Single primary chat stream flanked by a compact tool trace bar.
  - `Desktop (>1024px)`: Multi-pane setup with terminal output sidecars, telemetry traces, and expanded command prompt views.

## Elevation & Depth
Depth is constructed through **layered chromatic luminosity** and **subtle surface borders** instead of blunt drop shadows:

- **Layer 0 (Canvas Base)**: Pure deep tone `#0D0814`. Zero elevation.
- **Layer 1 (Recessed/Panels)**: Surface `#180F24` paired with an inset or flat hairline boundary: `border: 1px solid rgba(139, 92, 246, 0.12)`.
- **Layer 2 (Floating Message Bubbles & Cards)**: Surface `#26173B` backed by a faint, ambient outer violet halo: `box-shadow: 0 4px 20px -2px rgba(13, 8, 20, 0.8), 0 0 12px 0 rgba(139, 92, 246, 0.08)`.
- **Layer 3 (Active Terminals & Pinned Modals)**: Backed by `surface-container-high` (`#26173B`), highlighted with a border `rgba(167, 139, 250, 0.35)` and an electric prompt glow: `box-shadow: 0 0 16px rgba(139, 92, 246, 0.25)`.
- **Backdrop Filters**: Translucent overlays and dock bars utilize `backdrop-filter: blur(12px)` over `#130C1E` at `85%` opacity.

## Shapes
The system relies on a controlled, technical **Soft** corner language (`roundedness: 1`):

- **Default UI Containers & Message Units**: `rounded` (4px / 0.25rem) to ensure a disciplined, code-editor feel.
- **Cards, Code Shells & Floating Input Bars**: `rounded-lg` (8px / 0.5rem) to slightly soften large content boundaries without appearing playful or casual.
- **Interactive Micro-Triggers & Pills (TTS Play Buttons, Status Tags, Mic Toggles)**: `rounded-full` is strictly reserved for actionable audio/recording controls and live operational status indicators to signal immediate tangible contact.

## Components

### Command Input & Voice Bar
- Floating fixed baseline dock with `backdrop-filter: blur(16px)` and background `rgba(24, 15, 36, 0.85)`.
- Hairline top border: `1px solid rgba(139, 92, 246, 0.2)`.
- Leading prompt indicator `>_` set in `JetBrains Mono` glowing with `#8B5CF6`.
- Integrated audio recording toggle: circular pill (`36px × 36px`), resting state border `rgba(139, 92, 246, 0.3)`, transition to radiant pulsing `#8B5CF6` with a faint `rgba(139, 92, 246, 0.4)` wave animation during live capture.

### Message Bubbles (User vs Agent)
- **User Messages**: Flush right or neutral container, background `rgba(38, 23, 59, 0.6)`, crisp border `rgba(139, 92, 246, 0.2)`.
- **Agent Responses**: Full-width or left-aligned with a subtle left accent line (`2px solid #8B5CF6`). Background `#180F24`.
- **TTS Audio Trigger**: Dedicated micro-action pinned to the bubble header or footer. A compact pill button containing an audio wave/play icon, displaying duration in `label-sm` monospace, activating a scrubbing waveform highlighted in `#A78BFA`.

### Terminal & Code Blocks
- Darker recessed canvas (`#0D0814`) embedded inside agent outputs.
- Header strip containing file name/runtime (`label-sm`), execution status badge, and copy button.
- Syntax highlighting keyed off the system palette: keyword (`#A78BFA`), strings (`#DDD6FE`), comments (`#6B7280`), constants (`#C4B5FD`).

### Buttons & Quick Commands
- **Primary**: Background `#8B5CF6`, text `#0D0814`, hover state `#A78BFA` with subtle neon elevation.
- **Secondary / Ghost**: Transparent fill, `1px solid rgba(139, 92, 246, 0.25)`, text `#DDD6FE`, hover background `rgba(139, 92, 246, 0.1)`.

### Status Indicators & Chips
- Monospace tags indicating agent state (`IDLE`, `EXECUTING`, `STREAMING_AUDIO`).
- Glowing dot indicator: 6px radial element with box-shadow pulse in `#8B5CF6` or functional green/red when reporting system uptime.