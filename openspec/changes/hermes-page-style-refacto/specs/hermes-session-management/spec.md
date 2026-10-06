## MODIFIED Requirements

### Requirement: Session List Visual Design
The system SHALL render sessions with new visual design: active indicator dot, monospace session ID, subtitle, hover states.

#### Scenario: Active session highlighted
- **WHEN** session is active
- **THEN** it has primary border, primary dot indicator, primary title text

#### Scenario: Inactive session styling
- **WHEN** session is inactive
- **THEN** it has transparent border, outline-variant dot, on-surface title

#### Scenario: Session card structure
- **WHEN** session renders
- **THEN** it shows: dot indicator, session ID (monospace), timestamp (label-sm), subtitle (body-sm, line-clamp-1)

#### Scenario: Hover state
- **WHEN** user hovers inactive session
- **THEN** background becomes surface-container/70, border becomes outline-variant/30

#### Scenario: Archived session dimmed
- **WHEN** session is archived/old
- **THEN** it has opacity-70, dot at outline-variant/50

### Requirement: Session Header Actions
The system SHALL provide new session button and profile selector with updated styling.

#### Scenario: New session button
- **WHEN** sidebar header renders
- **THEN** button has surface-container-high background, primary text, add icon, shortcut label

#### Scenario: Profile selector
- **WHEN** sidebar header renders
- **THEN** shows avatar (primary/20 bg, primary border), name, mode, chevron

#### Scenario: Delete session action
- **WHEN** session card hovered
- **THEN** delete button appears, click opens confirmation (per hermes-session-deletion spec)

### Requirement: Session Count Badge
The system SHALL show active session count in sessions header.

#### Scenario: Count updates
- **WHEN** sessions load
- **THEN** count badge shows number in primary color, code-md font