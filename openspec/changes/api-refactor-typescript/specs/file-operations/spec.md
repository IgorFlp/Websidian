## ADDED Requirements

### Requirement: File Tree Endpoint
The system SHALL return hierarchical file tree for a vault at `GET /api/files`.

#### Scenario: Tree structure with folders and files
- **WHEN** GET `/api/files` with valid session
- **THEN** response 200 with `{ tree: FileNode[] }` where `FileNode` has `type: "folder"|"file"`, `name`, `path`, `extension?`, `children?`

#### Scenario: Flat list option
- **WHEN** GET `/api/files?flat=true`
- **THEN** response 200 with `{ files: string[] }` (relative paths only)

#### Scenario: Ignored directories excluded
- **WHEN** vault contains `.obsidian`, `.git`, `node_modules`
- **THEN** these directories absent from tree

#### Scenario: Only .md and .pdf files included
- **WHEN** vault contains `.txt`, `.md`, `.pdf`
- **THEN** only `.md` and `.pdf` appear as file nodes

#### Scenario: Vault index parameter
- **WHEN** GET `/api/files?vault=1`
- **THEN** tree built from second vault path

### Requirement: File Content Endpoint
The system SHALL return file content at `GET /api/file-content?path=<relative-path>`.

#### Scenario: Valid file returns content
- **WHEN** GET `/api/file-content?path=notes/foo.md`
- **THEN** response 200 with `{ content: "file contents" }`

#### Scenario: Missing path returns 400
- **WHEN** GET `/api/file-content` without path
- **THEN** response 400

#### Scenario: Non-existent file returns 404
- **WHEN** GET `/api/file-content?path=missing.md`
- **THEN** response 404 with `{ error: "File not found" }`

#### Scenario: Path traversal prevented
- **WHEN** GET `/api/file-content?path=../../etc/passwd`
- **THEN** response 404 (normalized path escapes vault)

### Requirement: File Download Endpoint
The system SHALL serve file downloads at `GET /download?path=<relative-path>`.

#### Scenario: Valid file downloads with correct filename
- **WHEN** GET `/download?path=notes/foo.md`
- **THEN** response 200 with `Content-Disposition: attachment; filename="foo.md"` and file stream

#### Scenario: Range requests supported
- **WHEN** GET `/download?path=large.pdf` with `Range: bytes=0-1023`
- **THEN** response 206 with `Content-Range` and partial content

#### Scenario: Missing path returns 400
- **WHEN** GET `/download` without path
- **THEN** response 400

#### Scenario: Non-existent file returns 404
- **WHEN** GET `/download?path=missing.md`
- **THEN** response 404

#### Scenario: Path traversal prevented
- **WHEN** GET `/download?path=../../etc/passwd`
- **THEN** response 404