## ADDED Requirements

### Requirement: Create task with intelligent file targeting
The system SHALL allow creating a new task in a target file with optional reference task for positioning and naming convention guidance.

#### Scenario: Create task in specified file at end of task list
- **WHEN** user calls task_create with file path and task text
- **THEN** system finds the file
- **THEN** system appends new task line at the end of the task section
- **THEN** system returns success with created task line

#### Scenario: Create task below reference task with naming convention
- **WHEN** user calls task_create with file path, task text, and referenceTask
- **THEN** system finds the reference task line
- **THEN** system inserts new task line immediately below reference task
- **THEN** system applies naming convention (e.g., US01-T02-{text} below US01-T01)
- **THEN** system returns success with created task line

#### Scenario: File not found
- **WHEN** user calls task_create with non-existent file path
- **THEN** system returns error with code NOT_FOUND

#### Scenario: Reference task not found
- **WHEN** user calls task_create with referenceTask that doesn't exist in file
- **THEN** system returns error with code REFERENCE_NOT_FOUND

#### Scenario: Intelligent file search suggestion
- **WHEN** user calls task_create without file path (or with partial path)
- **THEN** system searches vault for most relevant file (by path similarity, recent edits, project markers)
- **THEN** system returns suggested file path with confidence score for user confirmation