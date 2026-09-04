import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";

const { validateEnvironment } = await import("../build/shared/env.js");
const { teammateTools } = await import("../build/tools/teammates.js");

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

test("list_teammates hits GET /v3/teammates with no query params", async () => {
  const fixture = { result: [{ username: "jdoe", email: "jdoe@example.com" }] };
  const calls = mockFetch(fixture);

  const result = await teammateTools.list_teammates.handler();

  assert.equal(calls[0].url.pathname, "/v3/teammates");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_teammate hits GET /v3/teammates/:username", async () => {
  const fixture = { username: "jdoe", email: "jdoe@example.com", scopes: ["mail.send"] };
  const calls = mockFetch(fixture);

  const result = await teammateTools.get_teammate.handler({ username: "jdoe" });

  assert.equal(calls[0].url.pathname, "/v3/teammates/jdoe");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_pending_teammates hits GET /v3/teammates/pending with no query params", async () => {
  const fixture = { result: [{ email: "invitee@example.com" }] };
  const calls = mockFetch(fixture);

  const result = await teammateTools.list_pending_teammates.handler();

  assert.equal(calls[0].url.pathname, "/v3/teammates/pending");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});
