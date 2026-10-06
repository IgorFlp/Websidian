## ADDED Requirements

### Requirement: Fixed Viewport Layout
The system SHALL use a fixed viewport height layout (`height: 100vh`, `overflow: hidden`) with internally scrollable components.

#### Scenario: Root container fills viewport
- **WHEN** page loads
- **THEN** root container has `height: 100vh`, `width: 100vw`, `overflow: hidden`, `display: flex`, `flex-direction: column` (mobile) / `row` (desktop)

#### Scenario: Sidebar is scrollable
- **WHEN** sessions list exceeds viewport height
- **THEN** sidebar sessions container has `overflow-y: auto` and `flex: 1`

#### Scenario: Terminal stream is scrollable
- **WHEN** message history exceeds viewport height
- **THEN** terminal stream has `overflow-y: auto` and `flex: 1`

#### Scenario: Header and input deck are fixed
- **WHEN** scrolling terminal stream
- **THEN** terminal header and input deck remain fixed at top/bottom

### Requirement: Responsive Breakpoints
The system SHALL adapt layout at three breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px).

#### Scenario: Mobile layout
- **WHEN** viewport width < 768px
- **THEN** single column layout, sidebar stacks above or below main content, edge-to-edge chat feed, pinned bottom input dock

#### Scenario: Tablet layout
- **WHEN** viewport width 768px-1024px
- **THEN** single primary chat stream with compact tool trace bar, sidebar visible

#### Scenario: Desktop layout
- **WHEN** viewport width > 1024px
- **THEN** multi-pane with sidebar, main terminal, optional sidecars

### Requirement: Spacing Scale
The system SHALL use a 4px base spacing scale with named tokens.

#### Scenario: Spacing tokens available
- **WHEN** CSS loads
- **THEN** spacing tokens (`--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 32px`, `--gutter: 16px`, `--gutter-lg: 24px`, `--margin: 16px`, `--margin-md: 24px`, `--margin-lg: 32px`) are defined