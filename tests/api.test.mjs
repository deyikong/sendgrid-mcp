import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "true";

const { validateEnvironment } = await import("../build/shared/env.js");
const { makeRequest, SendGridApiError, SendGridRateLimitError } = await import("../build/shared/api.js");

validateEnvironment();

afterEach(() => {
  delete globalThis.fetch;
});

function mockFetch(status, body, headers = {}) {
  globalThis.fetch = async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
}

test("makeRequest returns parsed JSON on a successful response", async () => {
  mockFetch(200, { ok: true });
  const result = await makeRequest("https://api.sendgrid.com/v3/scopes");
  assert.deepEqual(result, { ok: true });
});

test("makeRequest throws SendGridApiError with status/body on a non-2xx, non-429 response", async () => {
  mockFetch(400, "bad request text");
  await assert.rejects(
    () => makeRequest("https://api.sendgrid.com/v3/scopes"),
    (err) => {
      assert.ok(err instanceof SendGridApiError);
      assert.equal(err.status, 400);
      assert.equal(err.body, "bad request text");
      assert.match(err.message, /SendGrid API error \(400\): bad request text/);
      return true;
    }
  );
});

test("makeRequest throws SendGridRateLimitError with retryAfterSeconds parsed from X-RateLimit-Reset on a 429", async () => {
  mockFetch(429, "rate limited", { "X-RateLimit-Reset": "12" });
  await assert.rejects(
    () => makeRequest("https://api.sendgrid.com/v3/scopes"),
    (err) => {
      assert.ok(err instanceof SendGridRateLimitError);
      assert.ok(err instanceof SendGridApiError, "SendGridRateLimitError must also be a SendGridApiError");
      assert.equal(err.status, 429);
      assert.equal(err.retryAfterSeconds, 12);
      assert.match(err.message, /rate limit exceeded/i);
      assert.match(err.message, /Retry after 12s/);
      return true;
    }
  );
});

test("makeRequest still throws SendGridRateLimitError on a 429 with no X-RateLimit-Reset header", async () => {
  mockFetch(429, "rate limited");
  await assert.rejects(
    () => makeRequest("https://api.sendgrid.com/v3/scopes"),
    (err) => {
      assert.ok(err instanceof SendGridRateLimitError);
      assert.equal(err.retryAfterSeconds, undefined);
      return true;
    }
  );
});

test("makeRequest merges caller-supplied headers with auth headers instead of one clobbering the other", async () => {
  let capturedHeaders;
  globalThis.fetch = async (_url, init) => {
    capturedHeaders = init.headers;
    return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
  };

  await makeRequest("https://api.sendgrid.com/v3/scopes", {
    headers: { "X-Custom-Header": "custom-value" },
  });

  assert.equal(capturedHeaders["X-Custom-Header"], "custom-value");
  assert.match(capturedHeaders.Authorization, /^Bearer SG\./);
});

test("makeRequest passes through method and body from options", async () => {
  let capturedInit;
  globalThis.fetch = async (_url, init) => {
    capturedInit = init;
    return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
  };

  await makeRequest("https://api.sendgrid.com/v3/marketing/lists", {
    method: "POST",
    body: JSON.stringify({ name: "test" }),
  });

  assert.equal(capturedInit.method, "POST");
  assert.equal(capturedInit.body, JSON.stringify({ name: "test" }));
});
