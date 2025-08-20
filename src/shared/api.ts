import { getAuthHeaders } from "./auth.js";

export async function makeRequest(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error (${response.status}): ${errorText}`);
  }

  return response.json();
}