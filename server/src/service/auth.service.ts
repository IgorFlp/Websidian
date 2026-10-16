import { config } from "../config/index.js";

export interface SessionData {
  auth?: boolean;
  user?: string;
}

export class AuthService {
  private appUser: string;
  private appPassword: string;

  constructor(cfg = config) {
    this.appUser = cfg.appUser;
    this.appPassword = cfg.appPassword;
  }

  validateCredentials(username: string, password: string): boolean {
    return username === this.appUser && password === this.appPassword;
  }

  createSession(session: SessionData): void {
    session.auth = true;
  }

  destroySession(session: SessionData): void {
    session.auth = false;
  }

  isAuthenticated(session: SessionData | undefined): boolean {
    return session?.auth === true;
  }

  getSessionUser(session: SessionData | undefined): string | undefined {
    return session?.user;
  }
}

export default AuthService;