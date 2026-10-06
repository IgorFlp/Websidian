## ADDED Requirements

### Requirement: Complete Color System
The system SHALL implement the full Obsidian Terminal color palette as CSS custom properties with fallback values for Android 4 compatibility.

#### Scenario: Color tokens available
- **WHEN** the CSS loads
- **THEN** all color tokens from DESIGN.md are defined as `--color-*` custom properties with hex fallbacks

#### Scenario: Semantic color mappings work
- **WHEN** components use semantic color classes (e.g., `.bg-surface`, `.text-primary`, `.border-active`)
- **THEN** they render with correct colors from the palette

### Requirement: Typography Hierarchy
The system SHALL implement three font families with specific roles: Space Grotesk for headlines, Geist for body text, JetBrains Mono for code/telemetry.

#### Scenario: Headlines use Space Grotesk
- **WHEN** headline elements (`.font-headline-*`, `h1`-`h3`) render
- **THEN** they use Space Grotesk font family

#### Scenario: Body text uses Geist
- **WHEN** body elements (`.font-body-*`, `p`, `div` content) render
- **THEN** they use Geist font family

#### Scenario: Code/telemetry uses JetBrains Mono
- **WHEN** code elements (`.font-code-*`, `code`, `pre`, timestamps, latency) render
- **THEN** they use JetBrains Mono font family

### Requirement: Elevation & Depth System
The system SHALL implement layered elevation using surface colors, borders, and shadows instead of drop shadows.

#### Scenario: Layer 0 (Canvas Base)
- **WHEN** root background renders
- **THEN** it uses `#0D0814` with no elevation

#### Scenario: Layer 1 (Recessed/Panels)
- **WHEN** sidebar, panels render
- **THEN** they use `#180F24` with `border: 1px solid rgba(139, 92, 246, 0.12)`

#### Scenario: Layer 2 (Floating Message Bubbles)
- **WHEN** message bubbles render
- **THEN** they use `#26173B` with violet halo box-shadow

#### Scenario: Layer 3 (Active Terminals/Modals)
- **WHEN** active terminals, modals render
- **THEN** they use `#26173B` with highlighted border and electric prompt glow

### Requirement: Shape System
The system SHALL implement consistent border radius scale: DEFAULT (4px), LG (8px), FULL (9999px for pills/circles).

#### Scenario: Default containers use rounded (4px)
- **WHEN** message units, UI containers render
- **THEN** they have `border-radius: 4px`

#### Scenario: Cards/code shells use rounded-lg (8px)
- **WHEN** cards, code blocks, input bars render
- **THEN** they have `border-radius: 8px`

#### Scenario: Micro-triggers use rounded-full
- **WHEN** mic button, TTS play, status tags render
- **THEN** they have `border-radius: 9999px`