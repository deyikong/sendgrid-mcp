import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "true";

const { validateEnvironment } = await import("../build/shared/env.js");
const { miscTools } = await import("../build/tools/misc.js");

validateEnvironment();

const scopesFixture = { scopes: ["mail.send", "stats.read", "templates.create"] };

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

test("get_scopes hits GET /v3/scopes and returns the fixture payload", async () => {
  const calls = mockFetch(scopesFixture);

  const result = await miscTools.get_scopes.handler();

  assert.equal(calls[0].url.pathname, "/v3/scopes");
  assert.deepEqual(JSON.parse(result.content[0].text), scopesFixture);
});

test("get_scopes takes no arguments and issues a GET request with no query params", async () => {
  const calls = mockFetch(scopesFixture);

  await miscTools.get_scopes.handler();

  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
});
