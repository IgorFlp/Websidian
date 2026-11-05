## ADDED Requirements

### Requirement: Schedule date on task
The system SHALL allow scheduling or rescheduling a due date (📅 YYYY-MM-DD) or scheduled date (⏳ YYYY-MM-DD) on an existing task via a `dateType` parameter.

#### Scenario: Schedule due date on task without existing due date
- **WHEN** user calls task_schedule with file path, task text, valid date, and dateType='due'
- **THEN** system finds the task line matching task text
- **THEN** system appends ` 📅 YYYY-MM-DD` to the task line
- **THEN** system returns success with updated task line

#### Scenario: Reschedule due date on task with existing due date
- **WHEN** user calls task_schedule with file path, task text, new valid date, and dateType='due'
- **THEN** system finds the task line matching task text
- **THEN** system replaces existing `📅 YYYY-MM-DD` with new date
- **THEN** system returns success with updated task line

#### Scenario: Schedule scheduled date on task without existing scheduled date
- **WHEN** user calls task_schedule with file path, task text, valid date, and dateType='scheduled'
- **THEN** system finds the task line matching task text
- **THEN** system appends ` ⏳ YYYY-MM-DD` to the task line
- **THEN** system returns success with updated task line

#### Scenario: Reschedule scheduled date on task with existing scheduled date
- **WHEN** user calls task_schedule with file path, task text, new valid date, and dateType='scheduled'
- **THEN** system finds the task line matching task text
- **THEN** system replaces existing `⏳ YYYY-MM-DD` with new date
- **THEN** system returns success with updated task line

#### Scenario: Task not found
- **WHEN** user calls task_schedule with non-matching task text
- **THEN** system returns error with code NOT_FOUND

#### Scenario: Multiple matching tasks
- **WHEN** user calls task_schedule with task text matching multiple lines
- **THEN** system returns error with code AMBIGUOUS_MATCH

#### Scenario: Invalid date format
- **WHEN** user calls task_schedule with non-YYYY-MM-DD date
- **THEN** system returns error with code INVALID_DATE

#### Scenario: Invalid dateType
- **WHEN** user calls task_schedule with dateType other than 'due' or 'scheduled'
- **THEN** system returns error with code INVALID_DATE_TYPE