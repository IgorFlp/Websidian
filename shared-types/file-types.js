/**
 * Shared JSDoc type definitions for Websidian File API
 * @module shared-types/file-types
 */

/**
 * @typedef {Object} FileNode
 * @property {'file'|'folder'} type - Node type discriminator
 * @property {string} name - File or folder name (e.g., "notes.md")
 * @property {string} path - Relative path from vault root (e.g., "folder/notes.md")
 * @property {string} [extension] - File extension (e.g., "md") - only for type: 'file'
 * @property {FileNode[]} [children] - Child nodes - only for type: 'folder'
 */

/**
 * @typedef {FileNode[]} FileTree
 * Array of root-level FileNode objects representing the vault folder tree
 */

/**
 * @typedef {Object} ApiFilesResponse
 * @property {FileTree} tree - Hierarchical file tree (new format)
 * @property {string[]} [files] - Flat array of relative paths (legacy format for ?flat=true)
 */

// Re-export types for JSDoc import in other files
// @typedef {import('./file-types').FileNode} FileNode
// @typedef {import('./file-types').FileTree} FileTree
// @typedef {import('./file-types').ApiFilesResponse} ApiFilesResponse