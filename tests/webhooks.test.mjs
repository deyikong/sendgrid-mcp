import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { webhookTools } = await import("../build/tools/webhooks.js");

validateEnvironment();

const eventWebhookFixture = {
  id: "abc123",
  url: "https://example.com/webhook",
  enabled: true,
  delivered: true,
};

const eventWebhooksListFixture = [eventWebhookFixture];

const parseSettingFixture = {
  hostname: "parse.example.com",
  url: "https://example.com/parse",
  spam_check: false,
  send_raw: false,
};

const parseSettingsListFixture = { result: [parseSettingFixture] };

const parseStatsFixture = [
  { date: "2026-08-01", stats: [{ metrics: { received: 5 } }] },
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

test("list_event_webhooks hits GET /v3/user/webhooks/event/settings/all", async () => {
  const calls = mockFetch(eventWebhooksListFixture);

  const result = await webhookTools.list_event_webhooks.handler();

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/event/settings/all");
  assert.equal(calls[0].init?.method ?? "GET", "GET");
  assert.deepEqual(JSON.parse(result.content[0].text), eventWebhooksListFixture);
  assert.deepEqual(result.structuredContent, eventWebhooksListFixture);
});

test("get_event_webhook hits GET /v3/user/webhooks/event/settings/:id", async () => {
  const calls = mockFetch(eventWebhookFixture);

  const result = await webhookTools.get_event_webhook.handler({ id: "abc123" });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/event/settings/abc123");
  assert.deepEqual(JSON.parse(result.content[0].text), eventWebhookFixture);
});

test("create_event_webhook sends a POST to /v3/user/webhooks/event/settings with only provided fields", async () => {
  const calls = mockFetch(eventWebhookFixture);

  const result = await webhookTools.create_event_webhook.handler({
    url: "https://example.com/webhook",
    enabled: true,
    delivered: true,
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/event/settings");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    url: "https://example.com/webhook",
    enabled: true,
    delivered: true,
  });
  assert.deepEqual(JSON.parse(result.content[0].text), eventWebhookFixture);
});

test("create_event_webhook omits fields that were not provided", async () => {
  const calls = mockFetch(eventWebhookFixture);

  await webhookTools.create_event_webhook.handler({
    url: "https://example.com/webhook",
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), { url: "https://example.com/webhook" });
});

test("create_event_webhook is blocked in read-only mode", async () => {
  process.env.READ_ONLY = "true";
  const { parseFresh } = await import("../build/shared/env.js");
  parseFresh();
  const calls = mockFetch(eventWebhookFixture);

  const result = await webhookTools.create_event_webhook.handler({
    url: "https://example.com/webhook",
  });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /READ_ONLY mode/);

  process.env.READ_ONLY = "false";
  parseFresh();
});

test("update_event_webhook sends a PATCH to /v3/user/webhooks/event/settings/:id with only provided fields", async () => {
  const calls = mockFetch(eventWebhookFixture);

  const result = await webhookTools.update_event_webhook.handler({
    id: "abc123",
    enabled: false,
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/event/settings/abc123");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: false });
  assert.deepEqual(JSON.parse(result.content[0].text), eventWebhookFixture);
});

test("update_event_webhook only includes fields that were provided", async () => {
  const calls = mockFetch(eventWebhookFixture);

  await webhookTools.update_event_webhook.handler({
    id: "abc123",
    url: "https://example.com/new-webhook",
    click: true,
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), {
    url: "https://example.com/new-webhook",
    click: true,
  });
});

test("update_event_webhook does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(eventWebhookFixture);

  const result = await webhookTools.update_event_webhook.handler({ id: "abc123" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_event_webhook sends a DELETE to /v3/user/webhooks/event/settings/:id", async () => {
  const calls = mockFetch({});

  const result = await webhookTools.delete_event_webhook.handler({ id: "abc123" });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/event/settings/abc123");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /deleted successfully/);
});

test("test_event_webhook sends a POST to /v3/user/webhooks/event/test with the url", async () => {
  const testResultFixture = { message: "success" };
  const calls = mockFetch(testResultFixture);

  const result = await webhookTools.test_event_webhook.handler({
    url: "https://example.com/webhook",
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/event/test");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { url: "https://example.com/webhook" });
  assert.deepEqual(JSON.parse(result.content[0].text), testResultFixture);
});

test("list_inbound_parse_settings hits GET /v3/user/webhooks/parse/settings", async () => {
  const calls = mockFetch(parseSettingsListFixture);

  const result = await webhookTools.list_inbound_parse_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/parse/settings");
  assert.deepEqual(JSON.parse(result.content[0].text), parseSettingsListFixture);
});

test("get_inbound_parse_setting hits GET /v3/user/webhooks/parse/settings/:hostname", async () => {
  const calls = mockFetch(parseSettingFixture);

  const result = await webhookTools.get_inbound_parse_setting.handler({
    hostname: "parse.example.com",
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/parse/settings/parse.example.com");
  assert.deepEqual(JSON.parse(result.content[0].text), parseSettingFixture);
});

test("create_inbound_parse_setting sends a POST to /v3/user/webhooks/parse/settings with required and optional fields", async () => {
  const calls = mockFetch(parseSettingFixture);

  const result = await webhookTools.create_inbound_parse_setting.handler({
    hostname: "parse.example.com",
    url: "https://example.com/parse",
    spam_check: false,
    send_raw: false,
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/parse/settings");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    hostname: "parse.example.com",
    url: "https://example.com/parse",
    spam_check: false,
    send_raw: false,
  });
  assert.deepEqual(JSON.parse(result.content[0].text), parseSettingFixture);
});

test("create_inbound_parse_setting omits optional fields that were not provided", async () => {
  const calls = mockFetch(parseSettingFixture);

  await webhookTools.create_inbound_parse_setting.handler({
    hostname: "parse.example.com",
    url: "https://example.com/parse",
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), {
    hostname: "parse.example.com",
    url: "https://example.com/parse",
  });
});

test("update_inbound_parse_setting sends a PATCH to /v3/user/webhooks/parse/settings/:hostname with only provided fields", async () => {
  const calls = mockFetch(parseSettingFixture);

  const result = await webhookTools.update_inbound_parse_setting.handler({
    hostname: "parse.example.com",
    send_raw: true,
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/parse/settings/parse.example.com");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { send_raw: true });
  assert.deepEqual(JSON.parse(result.content[0].text), parseSettingFixture);
});

test("update_inbound_parse_setting only includes fields that were provided", async () => {
  const calls = mockFetch(parseSettingFixture);

  await webhookTools.update_inbound_parse_setting.handler({
    hostname: "parse.example.com",
    url: "https://example.com/new-parse",
    spam_check: true,
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), {
    url: "https://example.com/new-parse",
    spam_check: true,
  });
});

test("update_inbound_parse_setting does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(parseSettingFixture);

  const result = await webhookTools.update_inbound_parse_setting.handler({
    hostname: "parse.example.com",
  });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_inbound_parse_setting sends a DELETE to /v3/user/webhooks/parse/settings/:hostname", async () => {
  const calls = mockFetch({});

  const result = await webhookTools.delete_inbound_parse_setting.handler({
    hostname: "parse.example.com",
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/parse/settings/parse.example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /deleted successfully/);
});

test("get_inbound_parse_stats hits GET /v3/user/webhooks/parse/stats with start_date and returns the array response", async () => {
  const calls = mockFetch(parseStatsFixture);

  const result = await webhookTools.get_inbound_parse_stats.handler({
    start_date: "2026-08-01",
  });

  assert.equal(calls[0].url.pathname, "/v3/user/webhooks/parse/stats");
  assert.equal(calls[0].url.searchParams.get("start_date"), "2026-08-01");
  assert.equal(calls[0].url.searchParams.has("end_date"), false);
  assert.equal(calls[0].url.searchParams.has("limit"), false);
  assert.equal(calls[0].url.searchParams.has("offset"), false);
  assert.equal(calls[0].url.searchParams.has("aggregated_by"), false);
  assert.deepEqual(JSON.parse(result.content[0].text), parseStatsFixture);
  assert.equal(result.structuredContent, undefined);
});

test("get_inbound_parse_stats includes optional query params only when provided", async () => {
  const calls = mockFetch(parseStatsFixture);

  await webhookTools.get_inbound_parse_stats.handler({
    start_date: "2026-08-01",
    end_date: "2026-08-31",
    limit: 10,
    offset: 5,
    aggregated_by: "day",
  });

  assert.equal(calls[0].url.searchParams.get("start_date"), "2026-08-01");
  assert.equal(calls[0].url.searchParams.get("end_date"), "2026-08-31");
  assert.equal(calls[0].url.searchParams.get("limit"), "10");
  assert.equal(calls[0].url.searchParams.get("offset"), "5");
  assert.equal(calls[0].url.searchParams.get("aggregated_by"), "day");
});
