## ADDED Requirements

### Requirement: Delete task
The system SHALL allow deleting a task by finding and removing its exact line from the file.

#### Scenario: Delete existing task
- **WHEN** user calls task_delete with file path and task text
- **THEN** system finds the task line matching task text
- **THEN** system removes the entire line from the file
- **THEN** system returns success with deleted task text

#### Scenario: Task not found
- **WHEN** user calls task_delete with non-matching task text
- **THEN** system returns error with code NOT_FOUND

#### Scenario: Multiple matching tasks
- **WHEN** user calls task_delete with task text matching multiple lines
- **THEN** system returns error with code AMBIGUOUS_MATCH