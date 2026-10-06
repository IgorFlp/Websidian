## MODIFIED Requirements

### Requirement: AI Message Rendering
The system SHALL render AI messages with the new visual design: left accent line, dark surface background, integrated reasoning toggle, CLI output blocks, TTS player.

#### Scenario: AI message structure
- **WHEN** AI message renders
- **THEN** it has: header (dot + label + response time + brain button), reasoning container (collapsible), output container (formatted text + code blocks), CLI output (optional), TTS player

#### Scenario: Left accent line
- **WHEN** AI message renders
- **THEN** it has `border-left: 2px solid #8B5CF6`

#### Scenario: Reasoning toggle
- **WHEN** reasoning text exists
- **THEN** brain button appears, click toggles reasoning container with smooth animation

#### Scenario: Code block formatting
- **WHEN** output contains markdown code blocks
- **THEN** they render as `<pre><code class="language-*">` with syntax highlighting colors

#### Scenario: TTS player in AI message
- **WHEN** AI message has output text
- **THEN** TTS player appears at bottom with play button, title, waveform

### Requirement: User Message Rendering
The system SHALL render user messages aligned right with dark card background.

#### Scenario: User message alignment
- **WHEN** user message renders
- **THEN** it aligns right (`align-items: flex-end`)

#### Scenario: User message card styling
- **WHEN** user message renders
- **THEN** card has `bg-surface-container-high/70`, border `outline-variant/40`, rounded-lg

#### Scenario: Inline code in user message
- **WHEN** user message contains inline code
- **THEN** it renders with `font-code-md`, primary color, surface-container-lowest background

#### Scenario: Voice message player
- **WHEN** user message has audio metadata
- **THEN** inline audio player renders alongside transcript (per hermes-voice-message-player spec)