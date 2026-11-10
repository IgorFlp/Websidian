import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { config } from "../config/index.js";

const beszelProxySchema = z.object({
  method: z.string().default("GET"),
  path: z.string(),
  query: z.record(z.string()).optional(),
});

// In-memory token cache with expiry
let cachedToken: string | null = config.beszelApiKey || null;
let tokenExpiry: number = Date.now() + 24 * 60 * 60 * 1000; // Assume 24h initially

async function refreshToken(): Promise<string | null> {
  const beszelUrl = config.beszelApiUrl;
  const email = config.beszelEmail;
  const password = config.beszelPassword;

  if (!beszelUrl || !email || !password) {
    console.error("Beszel credentials not configured");
    return null;
  }

  try {
    const authUrl = new URL("/api/collections/users/auth-with-password", beszelUrl).toString();
    
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Beszel auth failed:", error);
      return null;
    }

    const data = await response.json() as { token?: string; [key: string]: unknown };
    if (data.token) {
      cachedToken = data.token;
      // Token expires in ~24h, refresh 5 min early
      tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      console.log("Beszel token refreshed successfully");
      return data.token;
    }
    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  // Refresh if expired or expiring within 5 minutes
  if (!cachedToken || Date.now() > tokenExpiry - 5 * 60 * 1000) {
    console.log("Token expired/expiring, refreshing...");
    return await refreshToken();
  }
  return cachedToken;
}

export const beszelProxyRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.all("/api/beszel/*", {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    const beszelUrl = config.beszelApiUrl;
    
    if (!beszelUrl) {
      return reply.status(500).send({ error: "Beszel not configured" });
    }

    // Extract the path after /api/beszel/
    const fullPath = request.url.replace("/api/beszel", "");
    const targetUrl = new URL(fullPath, beszelUrl).toString();

    // Get valid token (auto-refresh if needed)
    const token = await getValidToken();
    if (!token) {
      return reply.status(500).send({ error: "Beszel authentication failed" });
    }

    const makeRequest = async (authToken: string) => {
      return await fetch(targetUrl, {
        method: request.method,
        headers: {
          "Authorization": authToken,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body),
      });
    };

    try {
      let response = await makeRequest(token);
      
      // If 401, try refreshing token once and retry
      if (response.status === 401) {
        console.log("Got 401, refreshing token and retrying...");
        const newToken = await refreshToken();
        if (newToken) {
          response = await makeRequest(newToken);
        }
      }

      const data = await response.json() as Record<string, unknown>;
      return reply.status(response.status).send(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      fastify.log.error({ err: error }, "Beszel proxy error");
      return reply.status(502).send({ error: "Bad gateway", message: errorMessage });
    }
  });
};

export default beszelProxyRoutes;