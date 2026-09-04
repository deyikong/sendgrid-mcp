import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";

const { validateEnvironment } = await import("../build/shared/env.js");
const { messageSearchTools } = await import("../build/tools/message-search.js");

validateEnvironment();

const searchResultsFixture = {
  messages: [
    { msg_id: "abc123.filter001", subject: "Test Email", status: "delivered" },
  ],
};

const messageDetailsFixture = {
  msg_id: "abc123.filter001",
  subject: "Test Email",
  status: "delivered",
  events: [{ event_name: "processed" }, { event_name: "delivered" }],
};

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

test("search_email_activity hits GET /v3/messages with the query param", async () => {
  const calls = mockFetch(searchResultsFixture);

  const result = await messageSearchTools.search_email_activity.handler({
    query: 'to_email="user@example.com"',
  });

  assert.equal(calls[0].url.pathname, "/v3/messages");
  assert.equal(calls[0].init?.method ?? "GET", "GET");
  assert.equal(calls[0].url.searchParams.get("query"), 'to_email="user@example.com"');
  assert.equal(calls[0].url.searchParams.has("limit"), false);
  assert.deepEqual(JSON.parse(result.content[0].text), searchResultsFixture);
  assert.deepEqual(result.structuredContent, searchResultsFixture);
});

test("search_email_activity includes limit only when provided", async () => {
  const calls = mockFetch(searchResultsFixture);

  await messageSearchTools.search_email_activity.handler({
    query: 'status="delivered"',
    limit: 10,
  });

  assert.equal(calls[0].url.searchParams.get("query"), 'status="delivered"');
  assert.equal(calls[0].url.searchParams.get("limit"), "10");
});

test("get_message_details hits GET /v3/messages/:msg_id", async () => {
  const calls = mockFetch(messageDetailsFixture);

  const result = await messageSearchTools.get_message_details.handler({
    msg_id: "abc123.filter001",
  });

  assert.equal(calls[0].url.pathname, "/v3/messages/abc123.filter001");
  assert.equal(calls[0].init?.method ?? "GET", "GET");
  assert.deepEqual(JSON.parse(result.content[0].text), messageDetailsFixture);
  assert.deepEqual(result.structuredContent, messageDetailsFixture);
});
