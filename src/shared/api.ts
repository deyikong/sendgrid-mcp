import { getAuthHeaders } from "./auth.js";

export class SendGridApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`SendGrid API error (${status}): ${body}`);
    this.name = "SendGridApiError";
    this.status = status;
    this.body = body;
  }
}

export class SendGridRateLimitError extends SendGridApiError {
  // Seconds until the current rate-limit window resets, per SendGrid's
  // X-RateLimit-Reset header (a countdown, not a Unix timestamp).
  readonly retryAfterSeconds?: number;

  constructor(status: number, body: string, retryAfterSeconds?: number) {
    super(status, body);
    const suffix = retryAfterSeconds !== undefined ? ` Retry after ${retryAfterSeconds}s.` : "";
    this.message = `SendGrid rate limit exceeded (${status}): ${body}.${suffix}`;
    this.name = "SendGridRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function makeRequest(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      const resetHeader = response.headers.get("x-ratelimit-reset");
      const retryAfterSeconds = resetHeader !== null ? Number(resetHeader) : undefined;
      throw new SendGridRateLimitError(
        response.status,
        errorText,
        Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined
      );
    }
    throw new SendGridApiError(response.status, errorText);
  }

  return response.json();
}