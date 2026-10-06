## ADDED Requirements

### Requirement: Slide-In Animation for New AI Messages
The system SHALL animate the newest AI message with a slide-in effect when it appears in the stream.

#### Scenario: Animation triggers on new AI message
- **WHEN** a new `.ai-message` is added to the stream (via polling or initial load)
- **THEN** only the last/newest AI message receives the animation class

#### Scenario: Slide-in from bottom with fade
- **WHEN** animation plays
- **THEN** message translates from `translateY(20px)` to `translateY(0)` with opacity 0 to 1 over 300ms ease-out

#### Scenario: Animation only once per message
- **WHEN** message is already in DOM and stream updates
- **THEN** existing messages do NOT re-animate

#### Scenario: Reduced motion support
- **WHEN** user prefers reduced motion
- **THEN** animation is disabled (instant appearance)

### Requirement: Animation Implementation
The system SHALL use CSS keyframes for the animation.

#### Scenario: CSS keyframes defined
- **WHEN** CSS loads
- **THEN** `@keyframes slideInUp` exists with transform/opacity keyframes

#### Scenario: Animation class applied
- **WHEN** new AI message inserted
- **THEN** `.animate-slide-in` class added, removed after animationend