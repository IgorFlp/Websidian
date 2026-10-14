export * from "./auth.js";
export * from "./vaults.js";
export * from "./files.js";
export * from "./tasks.js";
export * from "./presets.js";
export * from "./notes.js";
export * from "./chat.js";
export * from "./profiles.js";
export * from "./audio.js";
export * from "./terminal.js";

// Re-export sessions types explicitly to avoid conflicts
export type { Session, CreateSessionRequest, SessionsQuery } from "./sessions.js";