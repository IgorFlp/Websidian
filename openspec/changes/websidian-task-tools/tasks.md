## 1. Core Task Parsing Utilities

- [x] 1.1 Create task parsing utility module (src/lib/task-parser.ts) with regex patterns for obsidian-tasks syntax
- [x] 1.2 Implement findTaskLine(fileContent: string, taskText: string): {lineNumber: number, line: string} | null
- [x] 1.3 Implement replaceDateInLine(line: string, dateType: 'due' | 'scheduled', newDate: string): string
- [x] 1.4 Implement removeTaskLine(fileContent: string, lineNumber: number): string
- [x] 1.5 Implement insertTaskLine(fileContent: string, referenceLineNumber: number | null, newTask: string): string
- [x] 1.6 Add unit tests for all parsing utilities

## 2. MCP Tool: task_schedule

- [x] 2.1 Add task_schedule tool definition to MCP server (src/mcp/tools/task-tools.ts)
- [x] 2.2 Implement task_schedule handler with file read, parse, modify, write flow
- [x] 2.3 Add date validation (YYYY-MM-DD regex)
- [x] 2.4 Add dateType validation ('due' | 'scheduled')
- [x] 2.5 Handle NOT_FOUND, AMBIGUOUS_MATCH, INVALID_DATE, INVALID_DATE_TYPE error codes
- [x] 2.6 Add integration test for schedule due on task without existing due date
- [x] 2.7 Add integration test for reschedule due on task with existing due date
- [x] 2.8 Add integration test for schedule scheduled on task without existing scheduled date
- [x] 2.9 Add integration test for reschedule scheduled on task with existing scheduled date

## 3. MCP Tool: task_delete

- [x] 3.1 Add task_delete tool definition to MCP server
- [x] 3.2 Implement task_delete handler with file read, parse, remove, write flow
- [x] 3.3 Handle NOT_FOUND, AMBIGUOUS_MATCH error codes
- [x] 3.4 Add integration test for delete existing task
- [x] 3.5 Add integration test for delete non-existent task

## 4. MCP Tool: task_create

- [x] 4.1 Add task_create tool definition to MCP server
- [x] 4.2 Implement task_create handler with file read, insert, write flow
- [x] 4.3 Implement naming convention logic (US01-T02-{text} below US01-T01)
- [x] 4.4 Implement intelligent file search for suggested file targeting
- [x] 4.5 Handle NOT_FOUND, REFERENCE_NOT_FOUND error codes
- [x] 4.6 Add integration test for create task at end of file
- [x] 4.7 Add integration test for create task below reference task with naming convention
- [x] 4.8 Add integration test for intelligent file search suggestion

## 5. MCP Server Integration

- [x] 5.1 Register all 3 new tools in MCP server tool registry
- [x] 5.2 Add tool schemas with proper input/output types
- [x] 5.3 Verify all tools are discoverable via MCP list_tools

## 6. Documentation & Validation

- [x] 6.1 Update MCP tool documentation with usage examples
- [x] 6.2 Run full test suite to verify all specs pass
- [x] 6.3 Validate obsidian-tasks syntax compliance for all operations