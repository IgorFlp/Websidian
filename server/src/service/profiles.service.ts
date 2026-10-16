import { HermesClient, getHermesClient } from "./hermes.client.js";
import { config } from "../config/index.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface Profile {
  name: string;
  modelName: string;
  endpoint: string;
  isDefault: boolean;
}

export class ProfilesService {
  private hermesClient: HermesClient;
  private cache: Profile[] | null = null;
  private cacheTimestamp = 0;

  constructor(hermesClient?: HermesClient) {
    this.hermesClient = hermesClient || getHermesClient();
  }

  async getProfiles(): Promise<Profile[]> {
    const now = Date.now();
    if (this.cache && (now - this.cacheTimestamp) < CACHE_TTL_MS) {
      return this.cache;
    }

    try {
      const response = await this.hermesClient.getProfiles();
      const profiles = this.parseProfiles(response);
      this.cache = profiles;
      this.cacheTimestamp = now;
      return profiles;
    } catch (err) {
      console.error("Failed to fetch profiles:", err instanceof Error ? err.message : err);
      if (this.cache) {
        return this.cache;
      }
      return [];
    }
  }

  parseProfiles(response: unknown): Profile[] {
    if (!response) return [];

    const resp = response as Record<string, unknown>;

    if (Array.isArray(resp)) {
      return resp.map((p, index) => this.normalizeProfile(p, index === 0));
    }

    if (resp["data"] && Array.isArray(resp["data"])) {
      return (resp["data"] as unknown[]).map((p, index) => this.normalizeProfile(p, index === 0));
    }

    if (resp["models"] && Array.isArray(resp["models"])) {
      return (resp["models"] as unknown[]).map((p, index) => this.normalizeProfile(p, index === 0));
    }

    return [];
  }

  normalizeProfile(profile: unknown, isDefault = false): Profile {
    const p = profile as Record<string, unknown>;
    return {
      name: (p["name"] as string) || (p["id"] as string) || "default",
      modelName: (p["model"] as string) || (p["modelName"] as string) || (p["name"] as string) || "unknown",
      endpoint: (p["endpoint"] as string) || (p["url"] as string) || `/p/${(p["name"] as string) || (p["id"] as string) || "default"}/`,
      isDefault,
    };
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export default ProfilesService;