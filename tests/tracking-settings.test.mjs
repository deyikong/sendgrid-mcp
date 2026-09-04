import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { trackingSettingsTools } = await import("../build/tools/tracking-settings.js");

validateEnvironment();

const allTrackingSettingsFixture = {
  click_tracking: { enable: true, enable_text: false },
  open_tracking: { enable: true, substitution_tag: "%opentrack%" },
  subscription_tracking: { enable: false, landing: "", url: "", replace: "", html_content: "", plain_content: "" },
  ganalytics: { enable: false, utm_source: "", utm_medium: "", utm_term: "", utm_content: "", utm_campaign: "" },
};

const clickTrackingFixture = { enabled: true, enable_text: false };
const googleAnalyticsFixture = {
  enabled: true,
  utm_source: "sendgrid.com",
  utm_medium: "email",
  utm_term: "",
  utm_content: "",
  utm_campaign: "website",
};
const openTrackingFixture = { enabled: true };
const subscriptionTrackingFixture = {
  enabled: true,
  landing: "",
  url: "",
  replace: "",
  html_content: "",
  plain_content: "",
};

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

test("get_tracking_settings hits GET /v3/tracking_settings", async () => {
  const calls = mockFetch(allTrackingSettingsFixture);

  const result = await trackingSettingsTools.get_tracking_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings");
  assert.equal(calls[0].init?.method ?? "GET", "GET");
  assert.deepEqual(JSON.parse(result.content[0].text), allTrackingSettingsFixture);
  assert.deepEqual(result.structuredContent, allTrackingSettingsFixture);
});

test("get_click_tracking_settings hits GET /v3/tracking_settings/click", async () => {
  const calls = mockFetch(clickTrackingFixture);

  const result = await trackingSettingsTools.get_click_tracking_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/click");
  assert.deepEqual(JSON.parse(result.content[0].text), clickTrackingFixture);
});

test("update_click_tracking_settings sends a PATCH to /v3/tracking_settings/click with enabled", async () => {
  const calls = mockFetch(clickTrackingFixture);

  const result = await trackingSettingsTools.update_click_tracking_settings.handler({ enabled: true });

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/click");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true });
  assert.deepEqual(JSON.parse(result.content[0].text), clickTrackingFixture);
});

test("update_click_tracking_settings can disable click tracking", async () => {
  const calls = mockFetch({ enabled: false });

  await trackingSettingsTools.update_click_tracking_settings.handler({ enabled: false });

  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: false });
});

test("get_google_analytics_settings hits GET /v3/tracking_settings/google_analytics", async () => {
  const calls = mockFetch(googleAnalyticsFixture);

  const result = await trackingSettingsTools.get_google_analytics_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/google_analytics");
  assert.deepEqual(JSON.parse(result.content[0].text), googleAnalyticsFixture);
});

test("update_google_analytics_settings sends a PATCH to /v3/tracking_settings/google_analytics with all provided fields", async () => {
  const calls = mockFetch(googleAnalyticsFixture);

  const result = await trackingSettingsTools.update_google_analytics_settings.handler({
    enabled: true,
    utm_campaign: "website",
    utm_content: "banner",
    utm_medium: "email",
    utm_source: "sendgrid.com",
    utm_term: "sale",
  });

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/google_analytics");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    enabled: true,
    utm_campaign: "website",
    utm_content: "banner",
    utm_medium: "email",
    utm_source: "sendgrid.com",
    utm_term: "sale",
  });
  assert.deepEqual(JSON.parse(result.content[0].text), googleAnalyticsFixture);
});

test("update_google_analytics_settings only includes fields that were provided", async () => {
  const calls = mockFetch(googleAnalyticsFixture);

  await trackingSettingsTools.update_google_analytics_settings.handler({
    utm_campaign: "spring-sale",
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), { utm_campaign: "spring-sale" });
});

test("update_google_analytics_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(googleAnalyticsFixture);

  const result = await trackingSettingsTools.update_google_analytics_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("get_open_tracking_settings hits GET /v3/tracking_settings/open", async () => {
  const calls = mockFetch(openTrackingFixture);

  const result = await trackingSettingsTools.get_open_tracking_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/open");
  assert.deepEqual(JSON.parse(result.content[0].text), openTrackingFixture);
});

test("update_open_tracking_settings sends a PATCH to /v3/tracking_settings/open with enabled", async () => {
  const calls = mockFetch(openTrackingFixture);

  const result = await trackingSettingsTools.update_open_tracking_settings.handler({ enabled: true });

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/open");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true });
  assert.deepEqual(JSON.parse(result.content[0].text), openTrackingFixture);
});

test("get_subscription_tracking_settings hits GET /v3/tracking_settings/subscription", async () => {
  const calls = mockFetch(subscriptionTrackingFixture);

  const result = await trackingSettingsTools.get_subscription_tracking_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/subscription");
  assert.deepEqual(JSON.parse(result.content[0].text), subscriptionTrackingFixture);
});

test("update_subscription_tracking_settings sends a PATCH to /v3/tracking_settings/subscription with all provided fields", async () => {
  const calls = mockFetch(subscriptionTrackingFixture);

  const result = await trackingSettingsTools.update_subscription_tracking_settings.handler({
    enabled: true,
    html_content: "<p>Unsubscribe</p>",
    plain_content: "Unsubscribe",
    landing: "<p>You have unsubscribed</p>",
    url: "https://example.com/unsubscribe",
    replace: "%unsubscribe%",
  });

  assert.equal(calls[0].url.pathname, "/v3/tracking_settings/subscription");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    enabled: true,
    html_content: "<p>Unsubscribe</p>",
    plain_content: "Unsubscribe",
    landing: "<p>You have unsubscribed</p>",
    url: "https://example.com/unsubscribe",
    replace: "%unsubscribe%",
  });
  assert.deepEqual(JSON.parse(result.content[0].text), subscriptionTrackingFixture);
});

test("update_subscription_tracking_settings only includes fields that were provided", async () => {
  const calls = mockFetch(subscriptionTrackingFixture);

  await trackingSettingsTools.update_subscription_tracking_settings.handler({
    url: "https://example.com/unsubscribe",
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), { url: "https://example.com/unsubscribe" });
});

test("update_subscription_tracking_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(subscriptionTrackingFixture);

  const result = await trackingSettingsTools.update_subscription_tracking_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});
