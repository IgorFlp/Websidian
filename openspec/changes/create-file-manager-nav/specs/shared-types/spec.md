## ADDED Requirements

### Requirement: Shared JSDoc types for File API
The system SHALL define JSDoc typedefs in `shared-types/file-types.js` for `/api/files` response.

#### Scenario: FileNode typedef for folders
- **WHEN** defining folder node type
- **THEN** typedef includes: `type: "folder"`, `name: string`, `path: string`, `children: FileNode[]`

#### Scenario: FileNode typedef for files
- **WHEN** defining file node type
- **THEN** typedef includes: `type: "file"`, `name: string`, `path: string`, `extension: string`

#### Scenario: ApiFilesResponse typedef
- **WHEN** defining API response type
- **THEN** typedef includes: `tree: FileNode[]` (new format), `files?: string[]` (legacy flat format for `?flat=true`)

#### Scenario: Server uses JSDoc @typedef for type checking
- **WHEN** server/api.js references types
- **THEN** uses `/** @typedef {import('../shared-types/file-types').FileNode} FileNode */` style JSDoc

#### Scenario: Client JS references types as documentation
- **WHEN** client files need type info
- **THEN** comments reference `shared-types/file-types.js` (no build step, pure documentation)