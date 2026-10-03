import { getHermesClient } from "../hermes/HermesClient.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

export class ProfilesService {
  constructor() {
    this.hermesClient = getHermesClient();
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  async getProfiles() {
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
      console.error("Failed to fetch profiles:", err.message);
      if (this.cache) {
        return this.cache;
      }
      return [];
    }
  }

  parseProfiles(response) {
    if (!response) return [];

    if (Array.isArray(response)) {
      return response.map((p, index) => this.normalizeProfile(p, index === 0));
    }

    if (response.data && Array.isArray(response.data)) {
      return response.data.map((p, index) => this.normalizeProfile(p, index === 0));
    }

    if (response.models && Array.isArray(response.models)) {
      return response.models.map((p, index) => this.normalizeProfile(p, index === 0));
    }

    return [];
  }

  normalizeProfile(profile, isDefault = false) {
    return {
      name: profile.name || profile.id || "default",
      modelName: profile.model || profile.modelName || profile.name || "unknown",
      endpoint: profile.endpoint || profile.url || `/p/${profile.name || profile.id || "default"}/`,
      isDefault,
    };
  }

  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export default ProfilesService;