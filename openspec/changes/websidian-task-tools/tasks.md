## 1. Core Task Parsing Utilities

- [ ] 1.1 Create task parsing utility module (src/lib/task-parser.ts) with regex patterns for obsidian-tasks syntax
- [ ] 1.2 Implement findTaskLine(fileContent: string, taskText: string): {lineNumber: number, line: string} | null
- [ ] 1.3 Implement replaceDateInLine(line: string, dateType: 'due' | 'scheduled', newDate: string): string
- [ ] 1.4 Implement removeTaskLine(fileContent: string, lineNumber: number): string
- [ ] 1.5 Implement insertTaskLine(fileContent: string, referenceLineNumber: number | null, newTask: string): string
- [ ] 1.6 Add unit tests for all parsing utilities

## 2. MCP Tool: task_schedule

- [ ] 2.1 Add task_schedule tool definition to MCP server (src/mcp/tools/task-tools.ts)
- [ ] 2.2 Implement task_schedule handler with file read, parse, modify, write flow
- [ ] 2.3 Add date validation (YYYY-MM-DD regex)
- [ ] 2.4 Add dateType validation ('due' | 'scheduled')
- [ ] 2.5 Handle NOT_FOUND, AMBIGUOUS_MATCH, INVALID_DATE, INVALID_DATE_TYPE error codes
- [ ] 2.6 Add integration test for schedule due on task without existing due date
- [ ] 2.7 Add integration test for reschedule due on task with existing due date
- [ ] 2.8 Add integration test for schedule scheduled on task without existing scheduled date
- [ ] 2.9 Add integration test for reschedule scheduled on task with existing scheduled date

## 3. MCP Tool: task_delete

- [ ] 3.1 Add task_delete tool definition to MCP server
- [ ] 3.2 Implement task_delete handler with file read, parse, remove, write flow
- [ ] 3.3 Handle NOT_FOUND, AMBIGUOUS_MATCH error codes
- [ ] 3.4 Add integration test for delete existing task
- [ ] 3.5 Add integration test for delete non-existent task

## 4. MCP Tool: task_create

- [ ] 4.1 Add task_create tool definition to MCP server
- [ ] 4.2 Implement task_create handler with file read, insert, write flow
- [ ] 4.3 Implement naming convention logic (US01-T02-{text} below US01-T01)
- [ ] 4.4 Implement intelligent file search for suggested file targeting
- [ ] 4.5 Handle NOT_FOUND, REFERENCE_NOT_FOUND error codes
- [ ] 4.6 Add integration test for create task at end of file
- [ ] 4.7 Add integration test for create task below reference task with naming convention
- [ ] 4.8 Add integration test for intelligent file search suggestion

## 5. MCP Server Integration

- [ ] 5.1 Register all 3 new tools in MCP server tool registry
- [ ] 5.2 Add tool schemas with proper input/output types
- [ ] 5.3 Verify all tools are discoverable via MCP list_tools

## 6. Documentation & Validation

- [ ] 6.1 Update MCP tool documentation with usage examples
- [ ] 6.2 Run full test suite to verify all specs pass
- [ ] 6.3 Validate obsidian-tasks syntax compliance for all operations