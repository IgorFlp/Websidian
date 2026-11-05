## Why

Websidian currently lacks deterministic MCP tools for task management operations. Users cannot reliably schedule due dates, schedule dates, delete tasks, or create tasks with proper naming conventions through the MCP interface. This change introduces a complete set of deterministic MCP tools that follow obsidian-tasks syntax conventions, enabling reliable task management automation.

## What Changes

- Add unified MCP tool for scheduling dates (📅 due / ⏳ scheduled) with reschedule support if date exists - `dateType` parameter specifies which date type
- Add MCP tool for deleting tasks (deterministic line removal)
- Add MCP tool for creating tasks with intelligent file search and naming convention guidance (e.g., US01-T02-{text} below US01-T01)
- Mark done already works via existing toggle functionality
- All tools follow obsidian-tasks syntax: Scheduled (⏳), Recurring (🔁), Due (📅), Done (✅)

## Capabilities

### New Capabilities

- `task-schedule`: Schedule or reschedule due date (📅) or scheduled date (⏳) on a task via `dateType` parameter
- `task-delete`: Delete a task by finding and removing its line
- `task-create`: Create a new task with intelligent file targeting and naming convention

### Modified Capabilities

- None (no existing specs)

## Impact

- MCP server: New tool definitions and handlers
- Task parsing logic: Deterministic line finding, date replacement, and line removal
- File search: Intelligent file targeting for task creation
- Obsidian-tasks syntax compliance across all operations