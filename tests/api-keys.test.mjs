import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";

const { validateEnvironment } = await import("../build/shared/env.js");
const { apiKeyTools } = await import("../build/tools/api-keys.js");

validateEnvironment();

function mockFetch(body) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(String(url)), init });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

test("list_api_keys hits GET /v3/api_keys with no query params", async () => {
  const fixture = { result: [{ api_key_id: "key-1", name: "My Key" }] };
  const calls = mockFetch(fixture);

  const result = await apiKeyTools.list_api_keys.handler();

  assert.equal(calls[0].url.pathname, "/v3/api_keys");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_api_key hits GET /v3/api_keys/:api_key_id", async () => {
  const fixture = { api_key_id: "key-1", name: "My Key", scopes: ["mail.send"] };
  const calls = mockFetch(fixture);

  const result = await apiKeyTools.get_api_key.handler({ api_key_id: "key-1" });

  assert.equal(calls[0].url.pathname, "/v3/api_keys/key-1");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});
