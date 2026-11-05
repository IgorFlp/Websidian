/**
 * Shared JSDoc type definitions for Websidian File API
 * @module shared-types/task
 */

/**
 * @typedef {Object} Task
 * @property {'string'} text - Task text for label
 * @property {boolean} done - Task done or not
 * @property {string | null} due - due date
 * @property {string | null} scheduled - scheduled date
 * @property {string | null} doneDate - if done, done date
 * @property {string[]} tags - #dayly, #goal ...
 * @property {boolean} recurring - if its recurring
 * @property {string} recurringRule - if recurring, rule
 * @property {string} file - file name
 * @property {number} index- index 
 */

/**
 * @typedef {Object} TaskFilter
 * @property {number} [vault=0] - Vault index
 * @property {string} [path=""] - Path prefix to filter tasks
 * @property {string[]} [files] - Specific files to include
 * @property {string} [startDate] - Start date for range filter (YYYY-MM-DD)
 * @property {string} [finishDate] - End date for range filter (YYYY-MM-DD)
 * @property {boolean} [Done=true] - Include completed tasks (default true)
 * @property {boolean} [Scheduled=true] - Include scheduled tasks (default true)
 * @property {boolean} [Due=true] - Include tasks with due date (default true)
 * @property {boolean} [unset] - Filter tasks without any date (doneDate, due, scheduled)
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