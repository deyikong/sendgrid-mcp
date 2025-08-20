import { USER_AGENT } from "./types.js";
import { getEnv } from "./env.js";

export function getAuthHeaders(): Record<string, string> {
  const env = getEnv();
  return {
    Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };
}