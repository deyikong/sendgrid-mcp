import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { designTools } = await import("../build/tools/designs.js");

validateEnvironment();

const designFixture = {
  id: "d-123",
  name: "Newsletter Design",
  html_content: "<html><body>Hi</body></html>",
};

const designsListFixture = {
  result: [designFixture],
  _metadata: { count: 1 },
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

function calledBody(calls, callIndex = 0) {
  const body = calls[callIndex]?.init?.body;
  return body ? JSON.parse(body) : undefined;
}

test("list_designs hits GET /v3/designs with no query params when none are provided", async () => {
  const calls = mockFetch(designsListFixture);

  const result = await designTools.list_designs.handler({});

  assert.equal(calls[0].url.pathname, "/v3/designs");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), designsListFixture);
  assert.deepEqual(result.structuredContent, designsListFixture);
});

test("list_designs only appends query params that were provided", async () => {
  const calls = mockFetch(designsListFixture);

  await designTools.list_designs.handler({ page_size: 25, page_token: "tok-1", summary: true });

  assert.equal(calls[0].url.searchParams.get("page_size"), "25");
  assert.equal(calls[0].url.searchParams.get("page_token"), "tok-1");
  assert.equal(calls[0].url.searchParams.get("summary"), "true");
});

test("create_design POSTs to /v3/designs with only the provided fields", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.create_design.handler({ html_content: "<html></html>" });

  assert.equal(calls[0].url.pathname, "/v3/designs");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), { html_content: "<html></html>" });
  assert.deepEqual(JSON.parse(result.content[0].text), designFixture);
});

test("create_design includes optional fields when provided", async () => {
  const calls = mockFetch(designFixture);

  await designTools.create_design.handler({
    html_content: "<html></html>",
    name: "My Design",
    editor: "code",
    plain_content: "Hi",
  });

  assert.deepEqual(calledBody(calls), {
    html_content: "<html></html>",
    name: "My Design",
    editor: "code",
    plain_content: "Hi",
  });
});

test("get_design hits GET /v3/designs/:id", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.get_design.handler({ id: "d-123" });

  assert.equal(calls[0].url.pathname, "/v3/designs/d-123");
  assert.deepEqual(JSON.parse(result.content[0].text), designFixture);
});

test("update_design PATCHes /v3/designs/:id with only the provided fields", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.update_design.handler({
    id: "d-123",
    name: "Renamed",
  });

  assert.equal(calls[0].url.pathname, "/v3/designs/d-123");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(calledBody(calls), { name: "Renamed" });
  assert.deepEqual(JSON.parse(result.content[0].text), designFixture);
});

test("update_design includes all provided fields in the PATCH body", async () => {
  const calls = mockFetch(designFixture);

  await designTools.update_design.handler({
    id: "d-123",
    name: "Renamed",
    html_content: "<html>new</html>",
    plain_content: "new plain",
    generate_plain_content: true,
    subject: "New Subject",
    categories: ["promo", "newsletter"],
  });

  assert.deepEqual(calledBody(calls), {
    name: "Renamed",
    html_content: "<html>new</html>",
    plain_content: "new plain",
    generate_plain_content: true,
    subject: "New Subject",
    categories: ["promo", "newsletter"],
  });
});

test("update_design does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.update_design.handler({ id: "d-123" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_design sends a DELETE to /v3/designs/:id", async () => {
  const calls = mockFetch({});

  const result = await designTools.delete_design.handler({ id: "d-123" });

  assert.equal(calls[0].url.pathname, "/v3/designs/d-123");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "Design d-123 deleted successfully.");
});

test("duplicate_design POSTs to /v3/designs/:id with an empty body when no fields are provided", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.duplicate_design.handler({ id: "d-123" });

  assert.equal(calls[0].url.pathname, "/v3/designs/d-123");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), {});
  assert.deepEqual(JSON.parse(result.content[0].text), designFixture);
});

test("duplicate_design includes name and editor in the POST body when provided", async () => {
  const calls = mockFetch(designFixture);

  await designTools.duplicate_design.handler({ id: "d-123", name: "Copy", editor: "design" });

  assert.deepEqual(calledBody(calls), { name: "Copy", editor: "design" });
});

test("list_prebuilt_designs hits GET /v3/designs/pre-builts with no query params when none are provided", async () => {
  const calls = mockFetch(designsListFixture);

  const result = await designTools.list_prebuilt_designs.handler({});

  assert.equal(calls[0].url.pathname, "/v3/designs/pre-builts");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), designsListFixture);
});

test("list_prebuilt_designs only appends query params that were provided", async () => {
  const calls = mockFetch(designsListFixture);

  await designTools.list_prebuilt_designs.handler({ page_size: 10, page_token: "tok-2", summary: false });

  assert.equal(calls[0].url.searchParams.get("page_size"), "10");
  assert.equal(calls[0].url.searchParams.get("page_token"), "tok-2");
  assert.equal(calls[0].url.searchParams.get("summary"), "false");
});

test("get_prebuilt_design hits GET /v3/designs/pre-builts/:id", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.get_prebuilt_design.handler({ id: "pb-1" });

  assert.equal(calls[0].url.pathname, "/v3/designs/pre-builts/pb-1");
  assert.deepEqual(JSON.parse(result.content[0].text), designFixture);
});

test("duplicate_prebuilt_design POSTs to /v3/designs/pre-builts/:id with an empty body when no fields are provided", async () => {
  const calls = mockFetch(designFixture);

  const result = await designTools.duplicate_prebuilt_design.handler({ id: "pb-1" });

  assert.equal(calls[0].url.pathname, "/v3/designs/pre-builts/pb-1");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), {});
  assert.deepEqual(JSON.parse(result.content[0].text), designFixture);
});

test("duplicate_prebuilt_design includes name and editor in the POST body when provided", async () => {
  const calls = mockFetch(designFixture);

  await designTools.duplicate_prebuilt_design.handler({ id: "pb-1", name: "My Copy", editor: "code" });

  assert.deepEqual(calledBody(calls), { name: "My Copy", editor: "code" });
});
