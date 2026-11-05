## Context

Websidian is an Obsidian-like web application with MCP (Model Context Protocol) integration. Currently, task management through MCP is limited to toggling task completion status. Users need deterministic tools for scheduling due dates, scheduling dates, deleting tasks, and creating tasks with proper naming conventions.

The existing task parsing uses the obsidian-tasks plugin syntax:
- Scheduled: `⏳ YYYY-MM-DD`
- Recurring: `🔁 every month` (every day, every 5 weeks...)
- Due: `📅 YYYY-MM-DD`
- Done: `✅ YYYY-MM-DD`

## Goals / Non-Goals

**Goals:**
- Implement 3 new MCP tools: `task_schedule`, `task_delete`, `task_create`
- Deterministic line finding and manipulation for all operations
- Reschedule support: if date exists, replace it; if not, add it
- Unified schedule tool with `dateType` parameter ('due' | 'scheduled') to avoid LLM confusion
- Intelligent file search for task creation with naming convention guidance
- Full obsidian-tasks syntax compliance

**Non-Goals:**
- Recurring task management (🔁 syntax) - out of scope for this change
- Task querying/filtering - existing `websidian_tasks_list` covers this
- UI changes - purely MCP/API layer

## Decisions

1. **Deterministic line manipulation**: Use regex-based parsing to find exact task lines by content match, then modify in place. This avoids ambiguity when multiple similar tasks exist.

2. **File targeting for task creation**: Search uses existing vault indexing to find the most relevant file (by path similarity, recent edits, or explicit project markers). System prompt guides LLM to follow naming convention (e.g., US01-T02 below US01-T01).

3. **Date replacement strategy**: For schedule operations, regex finds existing `📅 YYYY-MM-DD` or `⏳ YYYY-MM-DD` patterns and replaces them. If not found, appends to the task line before any trailing whitespace.

4. **MCP tool signatures**:
   - `task_schedule(file: string, taskText: string, date: string, dateType: 'due' | 'scheduled')` - schedules/reschedules due (📅) or scheduled (⏳) date
   - `task_delete(file: string, taskText: string)` - removes the exact task line
   - `task_create(file: string, taskText: string, referenceTask?: string)` - creates new task, optionally below reference task

5. **Error handling**: Return structured errors with `code` (NOT_FOUND, AMBIGUOUS_MATCH, INVALID_DATE) and `message` for LLM consumption.

## Risks / Trade-offs

- [Risk] Multiple tasks with identical text → AMBIGUOUS_MATCH error → Mitigation: Require unique task text or add line number parameter
- [Risk] Date format validation → Invalid dates accepted → Mitigation: Strict YYYY-MM-DD regex validation before write
- [Risk] File not found → Operation fails → Mitigation: Return NOT_FOUND with list of similar files
- [Trade-off] Line-based manipulation vs AST parsing → Line-based is simpler but fragile to formatting changes → Acceptable for markdown tasks