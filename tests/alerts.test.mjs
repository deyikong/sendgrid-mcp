import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";

const { validateEnvironment } = await import("../build/shared/env.js");
const { alertTools } = await import("../build/tools/alerts.js");

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

test("list_alerts hits GET /v3/alerts with no query params", async () => {
  const fixture = [{ id: 1, type: "usage_limit", email_to: "a@example.com" }];
  const calls = mockFetch(fixture);

  const result = await alertTools.list_alerts.handler();

  assert.equal(calls[0].url.pathname, "/v3/alerts");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_alert hits GET /v3/alerts/:alert_id", async () => {
  const fixture = { id: 1, type: "usage_limit", email_to: "a@example.com" };
  const calls = mockFetch(fixture);

  const result = await alertTools.get_alert.handler({ alert_id: "1" });

  assert.equal(calls[0].url.pathname, "/v3/alerts/1");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});
