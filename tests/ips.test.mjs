import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";

const { validateEnvironment } = await import("../build/shared/env.js");
const { ipTools } = await import("../build/tools/ips.js");

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

test("list_ip_addresses hits GET /v3/ips with no query params", async () => {
  const fixture = [{ ip: "1.2.3.4", pools: ["marketing"] }];
  const calls = mockFetch(fixture);

  const result = await ipTools.list_ip_addresses.handler();

  assert.equal(calls[0].url.pathname, "/v3/ips");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_ip_address hits GET /v3/ips/:ip_address", async () => {
  const fixture = { ip: "1.2.3.4", pools: ["marketing"], warmup: false };
  const calls = mockFetch(fixture);

  const result = await ipTools.get_ip_address.handler({ ip_address: "1.2.3.4" });

  assert.equal(calls[0].url.pathname, "/v3/ips/1.2.3.4");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_assigned_ips hits GET /v3/ips/assigned with no query params", async () => {
  const fixture = [{ ip: "1.2.3.4", subusers: ["subuser1"] }];
  const calls = mockFetch(fixture);

  const result = await ipTools.list_assigned_ips.handler();

  assert.equal(calls[0].url.pathname, "/v3/ips/assigned");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_ip_pools hits GET /v3/ips/pools with no query params", async () => {
  const fixture = [{ name: "marketing" }];
  const calls = mockFetch(fixture);

  const result = await ipTools.list_ip_pools.handler();

  assert.equal(calls[0].url.pathname, "/v3/ips/pools");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_ip_pool hits GET /v3/ips/pools/:pool_name", async () => {
  const fixture = { name: "marketing", ips: [{ ip: "1.2.3.4" }] };
  const calls = mockFetch(fixture);

  const result = await ipTools.get_ip_pool.handler({ pool_name: "marketing" });

  assert.equal(calls[0].url.pathname, "/v3/ips/pools/marketing");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_remaining_ips hits GET /v3/ips/remaining with no query params", async () => {
  const fixture = { remaining: 2, period: "annual", price_per_ip: 20.0 };
  const calls = mockFetch(fixture);

  const result = await ipTools.get_remaining_ips.handler();

  assert.equal(calls[0].url.pathname, "/v3/ips/remaining");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_ip_warmups hits GET /v3/ips/warmup with no query params", async () => {
  const fixture = [{ ip: "1.2.3.4", start_date: 1409616000 }];
  const calls = mockFetch(fixture);

  const result = await ipTools.list_ip_warmups.handler();

  assert.equal(calls[0].url.pathname, "/v3/ips/warmup");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_ip_warmup_status hits GET /v3/ips/warmup/:ip_address", async () => {
  const fixture = [{ ip: "1.2.3.4", start_date: 1409616000 }];
  const calls = mockFetch(fixture);

  const result = await ipTools.get_ip_warmup_status.handler({ ip_address: "1.2.3.4" });

  assert.equal(calls[0].url.pathname, "/v3/ips/warmup/1.2.3.4");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_allowed_ips hits GET /v3/access_settings/whitelist with no query params", async () => {
  const fixture = { result: [{ id: 1, ip: "1.2.3.4" }] };
  const calls = mockFetch(fixture);

  const result = await ipTools.list_allowed_ips.handler();

  assert.equal(calls[0].url.pathname, "/v3/access_settings/whitelist");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_allowed_ip hits GET /v3/access_settings/whitelist/:rule_id", async () => {
  const fixture = { result: { id: 1, ip: "1.2.3.4" } };
  const calls = mockFetch(fixture);

  const result = await ipTools.get_allowed_ip.handler({ rule_id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/access_settings/whitelist/1");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_access_activity hits GET /v3/access_settings/activity with no limit by default", async () => {
  const fixture = { result: [{ allowed: true, ip: "1.2.3.4" }] };
  const calls = mockFetch(fixture);

  const result = await ipTools.list_access_activity.handler({});

  assert.equal(calls[0].url.pathname, "/v3/access_settings/activity");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_access_activity passes limit as a query param when provided", async () => {
  const fixture = { result: [{ allowed: true, ip: "1.2.3.4" }] };
  const calls = mockFetch(fixture);

  await ipTools.list_access_activity.handler({ limit: 10 });

  assert.equal(calls[0].url.searchParams.get("limit"), "10");
});
