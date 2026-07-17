## ADDED Requirements

### Requirement: /api/files returns structured folder tree
The system SHALL return a hierarchical tree structure instead of flat file array.

#### Scenario: API returns FileNode tree
- **WHEN** GET `/api/files`
- **THEN** response is `{ tree: FileNode[] }` where FileNode represents folders and files recursively

#### Scenario: FileNode structure for folders
- **WHEN** node is a folder
- **THEN** node has `type: "folder"`, `name: string`, `path: string`, `children: FileNode[]`

#### Scenario: FileNode structure for files
- **WHEN** node is a file
- **THEN** node has `type: "file"`, `name: string`, `path: string`, `extension: string`

#### Scenario: Ignored directories excluded
- **WHEN** scanning vault
- **THEN** system skips `.obsidian`, `.trash`, `.git`, `node_modules`, `dist`, `build`, `.next`

#### Scenario: Hidden files excluded
- **WHEN** file or folder name starts with `.`
- **THEN** system excludes from tree

#### Scenario: Only .md files included as file nodes
- **WHEN** file extension is not `.md`
- **THEN** system excludes from tree (but folders still traverse)

### Requirement: API response compatible with old clients
The system SHALL maintain backward compatibility for existing consumers expecting flat array.

#### Scenario: Legacy format available via query param
- **WHEN** GET `/api/files?flat=true`
- **THEN** response is `{ files: string[] }` flat relative paths (existing format)