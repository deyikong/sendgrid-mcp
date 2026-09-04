import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { domainAuthTools } = await import("../build/tools/domain-auth.js");

validateEnvironment();

const domainFixture = {
  id: 1,
  domain: "example.com",
  subdomain: "mail",
  username: "sendgrid",
  user_id: 42,
  ips: [],
  custom_spf: false,
  default: true,
  legacy: false,
  automatic_security: true,
  valid: true,
  dns: {
    mail_cname: { host: "mail.example.com", data: "u123.wl.sendgrid.net", valid: true },
    dkim1: { host: "s1._domainkey.example.com", data: "s1.domainkey.u123.wl.sendgrid.net", valid: true },
    dkim2: { host: "s2._domainkey.example.com", data: "s2.domainkey.u123.wl.sendgrid.net", valid: true },
  },
};

const domainsListFixture = [domainFixture];

const validateDomainFixture = {
  id: 1,
  valid: true,
  validation_results: {
    mail_cname: { valid: true, reason: null },
    dkim1: { valid: true, reason: null },
    dkim2: { valid: true, reason: null },
  },
};

const linkFixture = {
  id: 7,
  domain: "example.com",
  subdomain: "links",
  username: "sendgrid",
  user_id: 42,
  default: true,
  valid: true,
  legacy: false,
  dns: {
    domain_cname: { valid: true, host: "links.example.com", data: "sendgrid.net" },
    owner_cname: { valid: true, host: "42.links.example.com", data: "sendgrid.net" },
  },
};

const linksListFixture = [linkFixture];

const validateLinkFixture = {
  id: 7,
  valid: true,
  validation_results: {
    domain_cname: { valid: true, reason: null },
    owner_cname: { valid: true, reason: null },
  },
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

test("list_authenticated_domains hits GET /v3/whitelabel/domains", async () => {
  const calls = mockFetch(domainsListFixture);

  const result = await domainAuthTools.list_authenticated_domains.handler();

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains");
  assert.equal(calls[0].init === undefined || calls[0].init.method === undefined, true);
  assert.deepEqual(JSON.parse(result.content[0].text), domainsListFixture);
});

test("get_authenticated_domain hits GET /v3/whitelabel/domains/:domain_id", async () => {
  const calls = mockFetch(domainFixture);

  const result = await domainAuthTools.get_authenticated_domain.handler({ domain_id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains/1");
  assert.deepEqual(JSON.parse(result.content[0].text), domainFixture);
  assert.deepEqual(result.structuredContent, domainFixture);
});

test("create_authenticated_domain sends a POST to /v3/whitelabel/domains with the provided fields", async () => {
  const calls = mockFetch(domainFixture);

  const result = await domainAuthTools.create_authenticated_domain.handler({
    domain: "example.com",
    subdomain: "mail",
    custom_spf: true,
    default: true,
    automatic_security: true,
  });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    domain: "example.com",
    subdomain: "mail",
    custom_spf: true,
    default: true,
    automatic_security: true,
  });
  assert.deepEqual(JSON.parse(result.content[0].text), domainFixture);
});

test("create_authenticated_domain only sends the required domain field when optional fields are omitted", async () => {
  const calls = mockFetch(domainFixture);

  await domainAuthTools.create_authenticated_domain.handler({ domain: "example.com" });

  assert.deepEqual(JSON.parse(calls[0].init.body), { domain: "example.com" });
});

test("create_authenticated_domain is blocked in READ_ONLY mode", async () => {
  process.env.READ_ONLY = "true";
  const { parseFresh } = await import("../build/shared/env.js");
  parseFresh();
  const calls = mockFetch(domainFixture);

  const result = await domainAuthTools.create_authenticated_domain.handler({ domain: "example.com" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /READ_ONLY mode/);

  process.env.READ_ONLY = "false";
  parseFresh();
});

test("update_authenticated_domain sends a PATCH to /v3/whitelabel/domains/:domain_id with only provided fields", async () => {
  const calls = mockFetch(domainFixture);

  const result = await domainAuthTools.update_authenticated_domain.handler({
    domain_id: 1,
    custom_spf: true,
  });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains/1");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { custom_spf: true });
  assert.deepEqual(JSON.parse(result.content[0].text), domainFixture);
});

test("update_authenticated_domain does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(domainFixture);

  const result = await domainAuthTools.update_authenticated_domain.handler({ domain_id: 1 });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_authenticated_domain sends a DELETE to /v3/whitelabel/domains/:domain_id", async () => {
  const calls = mockFetch({});

  const result = await domainAuthTools.delete_authenticated_domain.handler({ domain_id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains/1");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /deleted successfully/);
});

test("validate_authenticated_domain sends a POST to /v3/whitelabel/domains/:id/validate", async () => {
  const calls = mockFetch(validateDomainFixture);

  const result = await domainAuthTools.validate_authenticated_domain.handler({ id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains/1/validate");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(result.content[0].text), validateDomainFixture);
});

test("get_default_authenticated_domain hits GET /v3/whitelabel/domains/default", async () => {
  const calls = mockFetch(domainFixture);

  const result = await domainAuthTools.get_default_authenticated_domain.handler();

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/domains/default");
  assert.deepEqual(JSON.parse(result.content[0].text), domainFixture);
});

test("list_branded_links hits GET /v3/whitelabel/links", async () => {
  const calls = mockFetch(linksListFixture);

  const result = await domainAuthTools.list_branded_links.handler();

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/links");
  assert.deepEqual(JSON.parse(result.content[0].text), linksListFixture);
});

test("get_branded_link hits GET /v3/whitelabel/links/:id", async () => {
  const calls = mockFetch(linkFixture);

  const result = await domainAuthTools.get_branded_link.handler({ id: 7 });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/links/7");
  assert.deepEqual(JSON.parse(result.content[0].text), linkFixture);
});

test("create_branded_link sends a POST to /v3/whitelabel/links with the provided fields", async () => {
  const calls = mockFetch(linkFixture);

  const result = await domainAuthTools.create_branded_link.handler({
    domain: "example.com",
    subdomain: "links",
    default: true,
  });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/links");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    domain: "example.com",
    subdomain: "links",
    default: true,
  });
  assert.deepEqual(JSON.parse(result.content[0].text), linkFixture);
});

test("update_branded_link sends a PATCH to /v3/whitelabel/links/:id with only provided fields", async () => {
  const calls = mockFetch(linkFixture);

  const result = await domainAuthTools.update_branded_link.handler({ id: 7, default: true });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/links/7");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { default: true });
  assert.deepEqual(JSON.parse(result.content[0].text), linkFixture);
});

test("update_branded_link does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(linkFixture);

  const result = await domainAuthTools.update_branded_link.handler({ id: 7 });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_branded_link sends a DELETE to /v3/whitelabel/links/:id", async () => {
  const calls = mockFetch({});

  const result = await domainAuthTools.delete_branded_link.handler({ id: 7 });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/links/7");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /deleted successfully/);
});

test("validate_branded_link sends a POST to /v3/whitelabel/links/:id/validate", async () => {
  const calls = mockFetch(validateLinkFixture);

  const result = await domainAuthTools.validate_branded_link.handler({ id: 7 });

  assert.equal(calls[0].url.pathname, "/v3/whitelabel/links/7/validate");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(result.content[0].text), validateLinkFixture);
});
