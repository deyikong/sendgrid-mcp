import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { mailSettingsTools } = await import("../build/tools/mail-settings.js");

validateEnvironment();

const allMailSettingsFixture = {
  address_whitelist: { enabled: false, list: [] },
  bounce_purge: { enabled: false, soft_bounces: 0, hard_bounces: 0 },
  footer: { enabled: false, html_content: "", plain_content: "" },
};

const addressWhitelistFixture = { enabled: true, list: ["example.com"] };
const bouncePurgeFixture = { enabled: true, soft_bounces: 7, hard_bounces: 14 };
const footerFixture = { enabled: true, html_content: "<p>Footer</p>", plain_content: "Footer" };
const forwardBounceFixture = { enabled: true, email: "bounces@example.com" };
const forwardSpamFixture = { enabled: true, email: "spam@example.com" };

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

test("get_all_mail_settings hits GET /v3/mail_settings", async () => {
  const calls = mockFetch(allMailSettingsFixture);

  const result = await mailSettingsTools.get_all_mail_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/mail_settings");
  assert.deepEqual(JSON.parse(result.content[0].text), allMailSettingsFixture);
  assert.deepEqual(result.structuredContent, allMailSettingsFixture);
});

test("get_address_whitelist_settings hits GET /v3/mail_settings/address_whitelist", async () => {
  const calls = mockFetch(addressWhitelistFixture);

  const result = await mailSettingsTools.get_address_whitelist_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/address_whitelist");
  assert.deepEqual(JSON.parse(result.content[0].text), addressWhitelistFixture);
});

test("update_address_whitelist_settings sends a PATCH to /v3/mail_settings/address_whitelist with enabled and list", async () => {
  const calls = mockFetch(addressWhitelistFixture);

  const result = await mailSettingsTools.update_address_whitelist_settings.handler({
    enabled: true,
    list: ["example.com"],
  });

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/address_whitelist");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true, list: ["example.com"] });
  assert.deepEqual(JSON.parse(result.content[0].text), addressWhitelistFixture);
});

test("update_address_whitelist_settings only includes fields that were provided", async () => {
  const calls = mockFetch(addressWhitelistFixture);

  await mailSettingsTools.update_address_whitelist_settings.handler({ enabled: true });

  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true });
});

test("update_address_whitelist_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(addressWhitelistFixture);

  const result = await mailSettingsTools.update_address_whitelist_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("get_bounce_purge_settings hits GET /v3/mail_settings/bounce_purge", async () => {
  const calls = mockFetch(bouncePurgeFixture);

  const result = await mailSettingsTools.get_bounce_purge_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/bounce_purge");
  assert.deepEqual(JSON.parse(result.content[0].text), bouncePurgeFixture);
});

test("update_bounce_purge_settings sends a PATCH to /v3/mail_settings/bounce_purge with enabled, soft_bounces, and hard_bounces", async () => {
  const calls = mockFetch(bouncePurgeFixture);

  const result = await mailSettingsTools.update_bounce_purge_settings.handler({
    enabled: true,
    soft_bounces: 7,
    hard_bounces: 14,
  });

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/bounce_purge");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true, soft_bounces: 7, hard_bounces: 14 });
  assert.deepEqual(JSON.parse(result.content[0].text), bouncePurgeFixture);
});

test("update_bounce_purge_settings only includes fields that were provided", async () => {
  const calls = mockFetch(bouncePurgeFixture);

  await mailSettingsTools.update_bounce_purge_settings.handler({ soft_bounces: 5 });

  assert.deepEqual(JSON.parse(calls[0].init.body), { soft_bounces: 5 });
});

test("update_bounce_purge_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(bouncePurgeFixture);

  const result = await mailSettingsTools.update_bounce_purge_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("get_footer_settings hits GET /v3/mail_settings/footer", async () => {
  const calls = mockFetch(footerFixture);

  const result = await mailSettingsTools.get_footer_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/footer");
  assert.deepEqual(JSON.parse(result.content[0].text), footerFixture);
});

test("update_footer_settings sends a PATCH to /v3/mail_settings/footer with enabled, html_content, and plain_content", async () => {
  const calls = mockFetch(footerFixture);

  const result = await mailSettingsTools.update_footer_settings.handler({
    enabled: true,
    html_content: "<p>Footer</p>",
    plain_content: "Footer",
  });

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/footer");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    enabled: true,
    html_content: "<p>Footer</p>",
    plain_content: "Footer",
  });
  assert.deepEqual(JSON.parse(result.content[0].text), footerFixture);
});

test("update_footer_settings only includes fields that were provided", async () => {
  const calls = mockFetch(footerFixture);

  await mailSettingsTools.update_footer_settings.handler({ html_content: "<p>Only HTML</p>" });

  assert.deepEqual(JSON.parse(calls[0].init.body), { html_content: "<p>Only HTML</p>" });
});

test("update_footer_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(footerFixture);

  const result = await mailSettingsTools.update_footer_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("get_forward_bounce_settings hits GET /v3/mail_settings/forward_bounce", async () => {
  const calls = mockFetch(forwardBounceFixture);

  const result = await mailSettingsTools.get_forward_bounce_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/forward_bounce");
  assert.deepEqual(JSON.parse(result.content[0].text), forwardBounceFixture);
});

test("update_forward_bounce_settings sends a PATCH to /v3/mail_settings/forward_bounce with enabled and email", async () => {
  const calls = mockFetch(forwardBounceFixture);

  const result = await mailSettingsTools.update_forward_bounce_settings.handler({
    enabled: true,
    email: "bounces@example.com",
  });

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/forward_bounce");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true, email: "bounces@example.com" });
  assert.deepEqual(JSON.parse(result.content[0].text), forwardBounceFixture);
});

test("update_forward_bounce_settings only includes fields that were provided", async () => {
  const calls = mockFetch(forwardBounceFixture);

  await mailSettingsTools.update_forward_bounce_settings.handler({ email: "bounces@example.com" });

  assert.deepEqual(JSON.parse(calls[0].init.body), { email: "bounces@example.com" });
});

test("update_forward_bounce_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(forwardBounceFixture);

  const result = await mailSettingsTools.update_forward_bounce_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("get_forward_spam_settings hits GET /v3/mail_settings/forward_spam", async () => {
  const calls = mockFetch(forwardSpamFixture);

  const result = await mailSettingsTools.get_forward_spam_settings.handler();

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/forward_spam");
  assert.deepEqual(JSON.parse(result.content[0].text), forwardSpamFixture);
});

test("update_forward_spam_settings sends a PATCH to /v3/mail_settings/forward_spam with enabled and email", async () => {
  const calls = mockFetch(forwardSpamFixture);

  const result = await mailSettingsTools.update_forward_spam_settings.handler({
    enabled: true,
    email: "spam@example.com",
  });

  assert.equal(calls[0].url.pathname, "/v3/mail_settings/forward_spam");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: true, email: "spam@example.com" });
  assert.deepEqual(JSON.parse(result.content[0].text), forwardSpamFixture);
});

test("update_forward_spam_settings only includes fields that were provided", async () => {
  const calls = mockFetch(forwardSpamFixture);

  await mailSettingsTools.update_forward_spam_settings.handler({ enabled: false });

  assert.deepEqual(JSON.parse(calls[0].init.body), { enabled: false });
});

test("update_forward_spam_settings does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(forwardSpamFixture);

  const result = await mailSettingsTools.update_forward_spam_settings.handler({});

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});
