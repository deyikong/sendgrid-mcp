import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { suppressionTools } = await import("../build/tools/suppressions.js");

validateEnvironment();

const groupFixture = {
  id: 1,
  name: "Product Updates",
  description: "Updates about our products",
  is_default: false,
};

const groupsListFixture = [groupFixture];

const groupSuppressionsFixture = ["test1@example.com", "test2@example.com"];

const addSuppressionsFixture = {
  recipient_emails: ["test1@example.com", "test2@example.com"],
  group_id: 1,
};

const globalUnsubscribesFixture = [
  { email: "test1@example.com", created: 1443651125 },
];

const globalSuppressionFixture = {
  recipient_emails: ["test1@example.com"],
};

const globalSuppressionCheckFixture = { is_unsubscribed: true };

const bouncesFixture = [
  { created: 1443651125, email: "test1@example.com", reason: "550 unknown recipient", status: "5.1.1" },
];

const blocksFixture = [
  { created: 1443651125, email: "test1@example.com", reason: "blocked", status: "4.0.0" },
];

const spamReportsFixture = [
  { created: 1443651125, email: "test1@example.com", ip: "10.63.202.15" },
];

const invalidEmailsFixture = [
  { created: 1443651125, email: "test1@example.com", reason: "Mail domain mentioned in email address is unknown" },
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

test("list_suppression_groups hits GET /v3/asm/groups and returns an array", async () => {
  const calls = mockFetch(groupsListFixture);

  const result = await suppressionTools.list_suppression_groups.handler();

  assert.equal(calls[0].url.pathname, "/v3/asm/groups");
  assert.equal(calls[0].init.body, undefined);
  assert.deepEqual(JSON.parse(result.content[0].text), groupsListFixture);
});

test("create_suppression_group sends a POST to /v3/asm/groups with only provided fields", async () => {
  const calls = mockFetch(groupFixture);

  const result = await suppressionTools.create_suppression_group.handler({
    name: "Product Updates",
  });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { name: "Product Updates" });
  assert.deepEqual(result.structuredContent, groupFixture);
});

test("create_suppression_group includes optional fields when provided", async () => {
  const calls = mockFetch(groupFixture);

  await suppressionTools.create_suppression_group.handler({
    name: "Product Updates",
    description: "Updates about our products",
    is_default: true,
  });

  assert.deepEqual(JSON.parse(calls[0].init.body), {
    name: "Product Updates",
    description: "Updates about our products",
    is_default: true,
  });
});

test("get_suppression_group hits GET /v3/asm/groups/:group_id", async () => {
  const calls = mockFetch(groupFixture);

  const result = await suppressionTools.get_suppression_group.handler({ group_id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups/1");
  assert.deepEqual(result.structuredContent, groupFixture);
});

test("update_suppression_group sends a PATCH with only provided fields", async () => {
  const calls = mockFetch(groupFixture);

  const result = await suppressionTools.update_suppression_group.handler({
    group_id: 1,
    name: "New Name",
  });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups/1");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[0].init.body), { name: "New Name" });
  assert.deepEqual(result.structuredContent, groupFixture);
});

test("update_suppression_group does not call fetch and returns a message when no fields are provided", async () => {
  const calls = mockFetch(groupFixture);

  const result = await suppressionTools.update_suppression_group.handler({ group_id: 1 });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /No updates specified/);
});

test("delete_suppression_group sends a DELETE to /v3/asm/groups/:group_id", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.delete_suppression_group.handler({ group_id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups/1");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /deleted successfully/);
});

test("list_group_suppressions hits GET /v3/asm/groups/:group_id/suppressions and returns an array", async () => {
  const calls = mockFetch(groupSuppressionsFixture);

  const result = await suppressionTools.list_group_suppressions.handler({ group_id: 1 });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups/1/suppressions");
  assert.deepEqual(JSON.parse(result.content[0].text), groupSuppressionsFixture);
});

test("add_group_suppressions sends a POST to /v3/asm/groups/:group_id/suppressions with recipient_emails", async () => {
  const calls = mockFetch(addSuppressionsFixture);

  const result = await suppressionTools.add_group_suppressions.handler({
    group_id: 1,
    recipient_emails: ["test1@example.com", "test2@example.com"],
  });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups/1/suppressions");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    recipient_emails: ["test1@example.com", "test2@example.com"],
  });
  assert.deepEqual(result.structuredContent, addSuppressionsFixture);
});

test("remove_group_suppression sends a DELETE to /v3/asm/groups/:group_id/suppressions/:email", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.remove_group_suppression.handler({
    group_id: 1,
    email: "test1@example.com",
  });

  assert.equal(calls[0].url.pathname, "/v3/asm/groups/1/suppressions/test1%40example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /removed from suppression group 1/);
});

test("list_global_suppressions hits GET /v3/suppression/unsubscribes with no query params by default", async () => {
  const calls = mockFetch(globalUnsubscribesFixture);

  const result = await suppressionTools.list_global_suppressions.handler({});

  assert.equal(calls[0].url.pathname, "/v3/suppression/unsubscribes");
  assert.deepEqual(Array.from(calls[0].url.searchParams.keys()), []);
  assert.deepEqual(JSON.parse(result.content[0].text), globalUnsubscribesFixture);
});

test("list_global_suppressions includes start_time and end_time when provided", async () => {
  const calls = mockFetch(globalUnsubscribesFixture);

  await suppressionTools.list_global_suppressions.handler({ start_time: 1000, end_time: 2000 });

  assert.equal(calls[0].url.searchParams.get("start_time"), "1000");
  assert.equal(calls[0].url.searchParams.get("end_time"), "2000");
});

test("add_global_suppression sends a POST to /v3/asm/suppressions/global with recipient_emails", async () => {
  const calls = mockFetch(globalSuppressionFixture);

  const result = await suppressionTools.add_global_suppression.handler({
    recipient_emails: ["test1@example.com"],
  });

  assert.equal(calls[0].url.pathname, "/v3/asm/suppressions/global");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { recipient_emails: ["test1@example.com"] });
  assert.deepEqual(result.structuredContent, globalSuppressionFixture);
});

test("get_global_suppression hits GET /v3/asm/suppressions/global/:email", async () => {
  const calls = mockFetch(globalSuppressionCheckFixture);

  const result = await suppressionTools.get_global_suppression.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/asm/suppressions/global/test1%40example.com");
  assert.deepEqual(result.structuredContent, globalSuppressionCheckFixture);
});

test("delete_global_suppression sends a DELETE to /v3/asm/suppressions/global/:email", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.delete_global_suppression.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/asm/suppressions/global/test1%40example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /removed from the global suppression list/);
});

test("list_bounces hits GET /v3/suppression/bounces and supports start_time/end_time", async () => {
  const calls = mockFetch(bouncesFixture);

  const result = await suppressionTools.list_bounces.handler({ start_time: 1, end_time: 2 });

  assert.equal(calls[0].url.pathname, "/v3/suppression/bounces");
  assert.equal(calls[0].url.searchParams.get("start_time"), "1");
  assert.equal(calls[0].url.searchParams.get("end_time"), "2");
  assert.deepEqual(JSON.parse(result.content[0].text), bouncesFixture);
});

test("get_bounce hits GET /v3/suppression/bounces/:email and returns an array", async () => {
  const calls = mockFetch(bouncesFixture);

  const result = await suppressionTools.get_bounce.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/suppression/bounces/test1%40example.com");
  assert.deepEqual(JSON.parse(result.content[0].text), bouncesFixture);
});

test("delete_bounce sends a DELETE to /v3/suppression/bounces/:email", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.delete_bounce.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/suppression/bounces/test1%40example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /can receive mail again/);
});

test("list_blocks hits GET /v3/suppression/blocks and supports start_time/end_time", async () => {
  const calls = mockFetch(blocksFixture);

  const result = await suppressionTools.list_blocks.handler({ start_time: 1, end_time: 2 });

  assert.equal(calls[0].url.pathname, "/v3/suppression/blocks");
  assert.equal(calls[0].url.searchParams.get("start_time"), "1");
  assert.equal(calls[0].url.searchParams.get("end_time"), "2");
  assert.deepEqual(JSON.parse(result.content[0].text), blocksFixture);
});

test("delete_block sends a DELETE to /v3/suppression/blocks/:email", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.delete_block.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/suppression/blocks/test1%40example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /can receive mail again/);
});

test("list_spam_reports hits GET /v3/suppression/spam_reports and supports start_time/end_time", async () => {
  const calls = mockFetch(spamReportsFixture);

  const result = await suppressionTools.list_spam_reports.handler({ start_time: 1, end_time: 2 });

  assert.equal(calls[0].url.pathname, "/v3/suppression/spam_reports");
  assert.equal(calls[0].url.searchParams.get("start_time"), "1");
  assert.equal(calls[0].url.searchParams.get("end_time"), "2");
  assert.deepEqual(JSON.parse(result.content[0].text), spamReportsFixture);
});

test("delete_spam_report sends a DELETE to /v3/suppression/spam_reports/:email", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.delete_spam_report.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/suppression/spam_reports/test1%40example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /can receive mail again/);
});

test("list_invalid_emails hits GET /v3/suppression/invalid_emails and supports start_time/end_time", async () => {
  const calls = mockFetch(invalidEmailsFixture);

  const result = await suppressionTools.list_invalid_emails.handler({ start_time: 1, end_time: 2 });

  assert.equal(calls[0].url.pathname, "/v3/suppression/invalid_emails");
  assert.equal(calls[0].url.searchParams.get("start_time"), "1");
  assert.equal(calls[0].url.searchParams.get("end_time"), "2");
  assert.deepEqual(JSON.parse(result.content[0].text), invalidEmailsFixture);
});

test("delete_invalid_email sends a DELETE to /v3/suppression/invalid_emails/:email", async () => {
  const calls = mockFetch({});

  const result = await suppressionTools.delete_invalid_email.handler({ email: "test1@example.com" });

  assert.equal(calls[0].url.pathname, "/v3/suppression/invalid_emails/test1%40example.com");
  assert.equal(calls[0].init.method, "DELETE");
  assert.match(result.content[0].text, /can receive mail again/);
});
