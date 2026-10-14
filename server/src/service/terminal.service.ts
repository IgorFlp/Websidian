import { config } from "../config/index.js";

export interface TerminalBufferEntry {
  timestamp: number;
  type: string;
  content: string;
  isAI?: boolean;
}

export interface TerminalManager {
  write(input: string): void;
  getBufferSince(since: number): TerminalBufferEntry[];
}

let terminalManagerInstance: TerminalManager | null = null;

export function getTerminalManager(): TerminalManager | null {
  return terminalManagerInstance;
}

export function setTerminalManager(manager: TerminalManager): void {
  terminalManagerInstance = manager;
}

export class TerminalService {
  private terminalManager: TerminalManager | null;

  constructor(terminalManager?: TerminalManager) {
    this.terminalManager = terminalManager || terminalManagerInstance;
  }

  setTerminalManager(manager: TerminalManager): void {
    this.terminalManager = manager;
    terminalManagerInstance = manager;
  }

  async writeInput(input: string): Promise<{ accepted: boolean }> {
    if (!this.terminalManager) {
      throw new Error("Terminal manager not initialized");
    }

    this.terminalManager.write(input + "\n");
    return { accepted: true };
  }

  async pollOutput(since: number): Promise<{ since: number; html: string; audio: unknown[] }> {
    if (!this.terminalManager) {
      throw new Error("Terminal manager not initialized");
    }

    const newEntries = this.terminalManager.getBufferSince(since);

    if (newEntries.length > 0) {
      const lastEntry = newEntries[newEntries.length - 1];
      const newSince = lastEntry ? lastEntry.timestamp : Date.now();
      return {
        since: newSince,
        html: "", // Will be rendered by route using HTMLRenderer
        audio: [],
      };
    }

    return {
      since: Date.now(),
      html: "",
      audio: [],
    };
  }
}

export default TerminalService;