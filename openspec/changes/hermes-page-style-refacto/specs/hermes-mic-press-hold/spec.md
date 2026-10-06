## ADDED Requirements

### Requirement: Circular Microphone Button
The system SHALL render a circular microphone button (36x36px) with Material Symbols Outlined mic icon.

#### Scenario: Button dimensions and shape
- **WHEN** input deck renders
- **THEN** mic button is 36x36px, `border-radius: 50%`, centered icon

#### Scenario: Resting state styling
- **WHEN** not recording
- **THEN** button has border `rgba(139, 92, 246, 0.3)`, background transparent, icon color `text-outline`

### Requirement: Press-and-Hold Recording
The system SHALL start recording on press/hold (mousedown/touchstart) and stop on release (mouseup/mouseleave/touchend/touchcancel).

#### Scenario: Recording starts on press
- **WHEN** user presses and holds mic button for >100ms
- **THEN** recording starts, `isRecording` state becomes true

#### Scenario: Recording stops on release
- **WHEN** user releases mic button
- **THEN** recording stops, audio blob is created and sent for STT

#### Scenario: Recording cancels on drag out
- **WHEN** user presses then drags finger/mouse off button
- **THEN** recording cancels, no audio sent

#### Scenario: Minimum hold duration
- **WHEN** user taps quickly (<100ms)
- **THEN** no recording starts (treated as tap, not hold)

### Requirement: Visual Feedback During Recording
The system SHALL provide visual feedback while recording: grow animation, color change, pulse glow.

#### Scenario: Grow animation
- **WHEN** recording active
- **THEN** button scales to 1.15x via CSS transform with smooth transition

#### Scenario: Color change to primary
- **WHEN** recording active
- **THEN** button background becomes `#8B5CF6`, border becomes `#8B5CF6`, icon becomes `on-primary` color

#### Scenario: Pulse glow animation
- **WHEN** recording active
- **THEN** button has `box-shadow: 0 0 16px rgba(139, 92, 246, 0.4)` with pulsing animation

### Requirement: Recording Duration Counter
The system SHALL display a seconds counter next to the mic button during recording.

#### Scenario: Counter appears during recording
- **WHEN** recording starts
- **THEN** counter element appears to the right of mic button showing "0s"

#### Scenario: Counter increments each second
- **WHEN** recording in progress
- **THEN** counter updates every second (1s, 2s, 3s...)

#### Scenario: Counter disappears on stop
- **WHEN** recording stops
- **THEN** counter fades out and is removed

### Requirement: Android 4 Touch Compatibility
The system SHALL handle touch events correctly on Android 4.

#### Scenario: Touch start triggers recording
- **WHEN** touchstart on mic button
- **THEN** recording starts (with hold detection)

#### Scenario: Touch end stops recording
- **WHEN** touchend on mic button
- **THEN** recording stops

#### Scenario: Touch cancel stops recording
- **WHEN** touchcancel (interruption)
- **THEN** recording stops cleanly