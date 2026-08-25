import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "true";

const { validateEnvironment } = await import("../build/shared/env.js");
const { statsTools } = await import("../build/tools/stats.js");

validateEnvironment();

const browsersFixture = [
  { date: "2024-01-01", stats: [{ type: "browser", name: "Chrome", metrics: { clicks: 42, unique_clicks: 30 } }] },
];
const clientsFixture = [
  { date: "2024-01-01", stats: [{ type: "client", name: "Webmail", metrics: { opens: 100, unique_opens: 65 } }] },
];
const devicesFixture = [
  { date: "2024-01-01", stats: [{ type: "device", name: "Desktop", metrics: { opens: 88, unique_opens: 51 } }] },
];
const geoFixture = [
  {
    date: "2024-01-01",
    stats: [{ type: "country", name: "US", metrics: { clicks: 20, unique_clicks: 15, opens: 60, unique_opens: 40 } }],
  },
];
const mailboxProvidersFixture = [
  {
    date: "2024-01-01",
    stats: [
      {
        type: "mailbox_provider",
        name: "Gmail",
        metrics: {
          blocks: 1,
          bounces: 2,
          clicks: 10,
          deferred: 3,
          delivered: 200,
          drops: 1,
          opens: 120,
          processed: 210,
          requests: 210,
          spam_reports: 0,
          unique_clicks: 8,
          unique_opens: 90,
        },
      },
    ],
  },
];

// Stubs global fetch and records every call as { url: URL, init }.
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

test("get_stats_by_browser hits /v3/browsers/stats and returns the fixture payload", async () => {
  const calls = mockFetch(browsersFixture);

  const result = await statsTools.get_stats_by_browser.handler({ start_date: "2024-01-01" });

  assert.equal(calls[0].url.pathname, "/v3/browsers/stats");
  assert.deepEqual(JSON.parse(result.content[0].text), browsersFixture);
});

test("get_stats_by_browser passes the browsers filter and pagination params when provided", async () => {
  const calls = mockFetch(browsersFixture);

  await statsTools.get_stats_by_browser.handler({
    start_date: "2024-01-01",
    browsers: "Chrome,Firefox",
    limit: 100,
    offset: 200,
  });

  assert.equal(calls[0].url.searchParams.get("browsers"), "Chrome,Firefox");
  assert.equal(calls[0].url.searchParams.get("limit"), "100");
  assert.equal(calls[0].url.searchParams.get("offset"), "200");
});

test("get_stats_by_browser omits limit/offset when not provided", async () => {
  const calls = mockFetch(browsersFixture);

  await statsTools.get_stats_by_browser.handler({ start_date: "2024-01-01" });

  assert.equal(calls[0].url.searchParams.has("limit"), false);
  assert.equal(calls[0].url.searchParams.has("offset"), false);
});

test("get_stats_by_client_type hits /v3/clients/stats", async () => {
  const calls = mockFetch(clientsFixture);

  const result = await statsTools.get_stats_by_client_type.handler({ start_date: "2024-01-01" });

  assert.equal(calls[0].url.pathname, "/v3/clients/stats");
  assert.deepEqual(JSON.parse(result.content[0].text), clientsFixture);
});

test("get_stats_by_client_type never sends a client_type filter, even if a caller bypasses the schema", async () => {
  const calls = mockFetch(clientsFixture);

  await statsTools.get_stats_by_client_type.handler({ start_date: "2024-01-01", client_type: "desktop" });

  assert.equal(calls[0].url.searchParams.has("client_type"), false);
});

test("get_stats_by_client_type never sends limit/offset, since this endpoint doesn't support pagination", async () => {
  const calls = mockFetch(clientsFixture);

  await statsTools.get_stats_by_client_type.handler({ start_date: "2024-01-01", limit: 50, offset: 10 });

  assert.equal(calls[0].url.searchParams.has("limit"), false);
  assert.equal(calls[0].url.searchParams.has("offset"), false);
});

test("get_stats_by_device_type hits /v3/devices/stats, not /v3/clients/stats (regression: distinct endpoints)", async () => {
  const calls = mockFetch(devicesFixture);

  const result = await statsTools.get_stats_by_device_type.handler({ start_date: "2024-01-01" });

  assert.equal(calls[0].url.pathname, "/v3/devices/stats");
  assert.notEqual(calls[0].url.pathname, "/v3/clients/stats");
  assert.deepEqual(JSON.parse(result.content[0].text), devicesFixture);
});

test("get_stats_by_device_type never sends a device_type filter, since SendGrid doesn't support one", async () => {
  const calls = mockFetch(devicesFixture);

  await statsTools.get_stats_by_device_type.handler({ start_date: "2024-01-01", device_type: "mobile" });

  assert.equal(calls[0].url.searchParams.has("device_type"), false);
});

test("get_stats_by_device_type supports limit/offset pagination", async () => {
  const calls = mockFetch(devicesFixture);

  await statsTools.get_stats_by_device_type.handler({ start_date: "2024-01-01", limit: 500, offset: 500 });

  assert.equal(calls[0].url.searchParams.get("limit"), "500");
  assert.equal(calls[0].url.searchParams.get("offset"), "500");
});

test("get_stats_by_country hits /v3/geo/stats and filters by country", async () => {
  const calls = mockFetch(geoFixture);

  const result = await statsTools.get_stats_by_country.handler({ start_date: "2024-01-01", country: "US" });

  assert.equal(calls[0].url.pathname, "/v3/geo/stats");
  assert.equal(calls[0].url.searchParams.get("country"), "US");
  assert.deepEqual(JSON.parse(result.content[0].text), geoFixture);
});

test("get_stats_by_country never sends a state filter, since geo/stats only supports country", async () => {
  const calls = mockFetch(geoFixture);

  await statsTools.get_stats_by_country.handler({ start_date: "2024-01-01", state: "CA" });

  assert.equal(calls[0].url.searchParams.has("state"), false);
});

test("get_stats_by_country supports limit/offset pagination", async () => {
  const calls = mockFetch(geoFixture);

  await statsTools.get_stats_by_country.handler({ start_date: "2024-01-01", limit: 500, offset: 500 });

  assert.equal(calls[0].url.searchParams.get("limit"), "500");
  assert.equal(calls[0].url.searchParams.get("offset"), "500");
});

test("get_stats_by_mailbox_provider hits /v3/mailbox_providers/stats and returns the fixture (no unsubscribes)", async () => {
  const calls = mockFetch(mailboxProvidersFixture);

  const result = await statsTools.get_stats_by_mailbox_provider.handler({ start_date: "2024-01-01" });

  assert.equal(calls[0].url.pathname, "/v3/mailbox_providers/stats");
  const parsed = JSON.parse(result.content[0].text);
  assert.deepEqual(parsed, mailboxProvidersFixture);
  assert.ok(!("unsubscribes" in parsed[0].stats[0].metrics));
});

test("get_stats_by_mailbox_provider passes the mailbox_providers filter and pagination params when provided", async () => {
  const calls = mockFetch(mailboxProvidersFixture);

  await statsTools.get_stats_by_mailbox_provider.handler({
    start_date: "2024-01-01",
    mailbox_providers: "Gmail,Yahoo",
    limit: 500,
    offset: 500,
  });

  assert.equal(calls[0].url.searchParams.get("mailbox_providers"), "Gmail,Yahoo");
  assert.equal(calls[0].url.searchParams.get("limit"), "500");
  assert.equal(calls[0].url.searchParams.get("offset"), "500");
});
