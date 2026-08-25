import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { contactTools } = await import("../build/tools/contacts.js");

validateEnvironment();

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

test("list_email_lists hits GET /v3/marketing/lists with the given page_size", async () => {
  const fixture = { result: [{ id: "list-1", name: "Newsletter" }] };
  const calls = mockFetch(fixture);

  const result = await contactTools.list_email_lists.handler({ page_size: 250 });

  assert.equal(calls[0].url.pathname, "/v3/marketing/lists");
  assert.equal(calls[0].url.searchParams.get("page_size"), "250");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("create_email_list POSTs to /v3/marketing/lists with the name", async () => {
  const fixture = { id: "list-1", name: "VIPs" };
  const calls = mockFetch(fixture);

  const result = await contactTools.create_email_list.handler({ name: "VIPs" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/lists");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), { name: "VIPs" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("update_email_list PATCHes /v3/marketing/lists/:list_id with the new name", async () => {
  const fixture = { id: "list-1", name: "Renamed" };
  const calls = mockFetch(fixture);

  const result = await contactTools.update_email_list.handler({ list_id: "list-1", name: "Renamed" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/lists/list-1");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(calledBody(calls), { name: "Renamed" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("delete_email_list DELETEs /v3/marketing/lists/:list_id", async () => {
  const calls = mockFetch({});

  const result = await contactTools.delete_email_list.handler({ list_id: "list-1" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/lists/list-1");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "List list-1 deleted successfully.");
});

test("list_segments hits GET /v3/marketing/segments", async () => {
  const fixture = { results: [{ id: "seg-1", name: "Active Users" }] };
  const calls = mockFetch(fixture);

  const result = await contactTools.list_segments.handler();

  assert.equal(calls[0].url.pathname, "/v3/marketing/segments");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("open_segment_creator returns a static browser URL without calling fetch", async () => {
  const calls = mockFetch({});

  const result = await contactTools.open_segment_creator.handler();

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /https:\/\/mc\.sendgrid\.com\/contacts\/segments\/create/);
});

test("create_contact PUTs to /v3/marketing/contacts with the contacts array", async () => {
  const fixture = { job_id: "job-1" };
  const calls = mockFetch(fixture);
  const contacts = [{ email: "a@example.com", first_name: "A" }];

  const result = await contactTools.create_contact.handler({ contacts });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts");
  assert.equal(calls[0].init.method, "PUT");
  assert.deepEqual(calledBody(calls), { contacts });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("create_contact_with_lists PUTs to /v3/marketing/contacts with contacts and list_ids", async () => {
  const fixture = { job_id: "job-2" };
  const calls = mockFetch(fixture);
  const contacts = [{ email: "b@example.com" }];
  const list_ids = ["list-1", "list-2"];

  const result = await contactTools.create_contact_with_lists.handler({ contacts, list_ids });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts");
  assert.equal(calls[0].init.method, "PUT");
  assert.deepEqual(calledBody(calls), { contacts, list_ids });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("open_csv_uploader returns a static browser URL without calling fetch", async () => {
  const calls = mockFetch({});

  const result = await contactTools.open_csv_uploader.handler();

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /https:\/\/mc\.sendgrid\.com\/contacts\/import\/upload-csv/);
});

test("list_custom_fields hits GET /v3/marketing/field_definitions", async () => {
  const fixture = { custom_fields: [{ id: "f1", name: "birthday", field_type: "Date" }] };
  const calls = mockFetch(fixture);

  const result = await contactTools.list_custom_fields.handler();

  assert.equal(calls[0].url.pathname, "/v3/marketing/field_definitions");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("create_custom_field POSTs to /v3/marketing/field_definitions with name and field_type", async () => {
  const fixture = { id: "f1", name: "birthday", field_type: "Date" };
  const calls = mockFetch(fixture);

  const result = await contactTools.create_custom_field.handler({ name: "birthday", field_type: "Date" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/field_definitions");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), { name: "birthday", field_type: "Date" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("update_custom_field PUTs to /v3/marketing/field_definitions/:field_id with the new name", async () => {
  const fixture = { id: "f1", name: "dob" };
  const calls = mockFetch(fixture);

  const result = await contactTools.update_custom_field.handler({ field_id: "f1", name: "dob" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/field_definitions/f1");
  assert.equal(calls[0].init.method, "PUT");
  assert.deepEqual(calledBody(calls), { name: "dob" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("delete_custom_field DELETEs /v3/marketing/field_definitions/:field_id", async () => {
  const calls = mockFetch({});

  const result = await contactTools.delete_custom_field.handler({ field_id: "f1" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/field_definitions/f1");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "Custom field f1 deleted successfully.");
});

test("list_senders hits GET /v3/marketing/senders", async () => {
  const fixture = [{ id: 1, nickname: "Main Sender" }];
  const calls = mockFetch(fixture);

  const result = await contactTools.list_senders.handler();

  assert.equal(calls[0].url.pathname, "/v3/marketing/senders");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("create_sender POSTs to /v3/marketing/senders with the full sender payload", async () => {
  const fixture = { id: 1, nickname: "Main Sender" };
  const calls = mockFetch(fixture);
  const senderData = {
    nickname: "Main Sender",
    from: { email: "from@example.com", name: "From Name" },
    reply_to: { email: "reply@example.com", name: "Reply Name" },
    address: "123 Main St",
    city: "Denver",
    state: "CO",
    zip: "80202",
    country: "US",
  };

  const result = await contactTools.create_sender.handler(senderData);

  assert.equal(calls[0].url.pathname, "/v3/marketing/senders");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), senderData);
  assert.match(result.content[0].text, /Sender created successfully\./);
  assert.ok(result.content[0].text.includes(JSON.stringify(fixture, null, 2)));
});

test("delete_contact DELETEs /v3/marketing/contacts with a comma-joined ids query param", async () => {
  const fixture = { job_id: "job-3" };
  const calls = mockFetch(fixture);

  const result = await contactTools.delete_contact.handler({ contact_ids: ["c1", "c2"] });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts");
  assert.equal(calls[0].url.searchParams.get("ids"), "c1,c2");
  assert.equal(calls[0].init.method, "DELETE");
  assert.ok(result.content[0].text.includes("2 contact(s) deleted successfully."));
  assert.ok(result.content[0].text.includes(JSON.stringify(fixture, null, 2)));
});

test("remove_contact_from_lists DELETEs /v3/marketing/lists/:list_id/contacts with a comma-joined contact_ids query param", async () => {
  const fixture = { job_id: "job-4" };
  const calls = mockFetch(fixture);

  const result = await contactTools.remove_contact_from_lists.handler({ list_id: "list-1", contact_ids: ["c1", "c2"] });

  assert.equal(calls[0].url.pathname, "/v3/marketing/lists/list-1/contacts");
  assert.equal(calls[0].url.searchParams.get("contact_ids"), "c1,c2");
  assert.equal(calls[0].init.method, "DELETE");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("get_contact hits GET /v3/marketing/contacts/:contact_id", async () => {
  const fixture = { id: "c1", email: "a@example.com" };
  const calls = mockFetch(fixture);

  const result = await contactTools.get_contact.handler({ contact_id: "c1" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts/c1");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("update_contact PUTs to /v3/marketing/contacts with the contacts array", async () => {
  const fixture = { job_id: "job-5" };
  const calls = mockFetch(fixture);
  const contacts = [{ id: "c1", first_name: "Updated" }];

  const result = await contactTools.update_contact.handler({ contacts });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts");
  assert.equal(calls[0].init.method, "PUT");
  assert.deepEqual(calledBody(calls), { contacts });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("search_contacts POSTs to /v3/marketing/contacts/search with query, page_size, and page_token when provided", async () => {
  const fixture = { result: [], contact_count: 0 };
  const calls = mockFetch(fixture);

  const result = await contactTools.search_contacts.handler({
    query: "email LIKE '%@example.com'",
    page_size: 25,
    page_token: "token-abc",
  });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts/search");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), {
    query: "email LIKE '%@example.com'",
    page_size: 25,
    page_token: "token-abc",
  });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("search_contacts omits page_size and page_token from the body when not provided", async () => {
  const fixture = { result: [], contact_count: 0 };
  const calls = mockFetch(fixture);

  await contactTools.search_contacts.handler({ query: "email LIKE '%@example.com'" });

  const body = calledBody(calls);
  assert.deepEqual(body, { query: "email LIKE '%@example.com'" });
  assert.ok(!("page_size" in body));
  assert.ok(!("page_token" in body));
});

test("search_contacts_by_emails POSTs to /v3/marketing/contacts/search/emails with the emails array", async () => {
  const fixture = { result: {} };
  const calls = mockFetch(fixture);
  const emails = ["a@example.com", "b@example.com"];

  const result = await contactTools.search_contacts_by_emails.handler({ emails });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts/search/emails");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calledBody(calls), { emails });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_contacts hits GET /v3/marketing/contacts with page_size and page_token when provided", async () => {
  const fixture = { result: [] };
  const calls = mockFetch(fixture);

  const result = await contactTools.list_contacts.handler({ page_size: 10, page_token: "tok-1" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/contacts");
  assert.equal(calls[0].url.searchParams.get("page_size"), "10");
  assert.equal(calls[0].url.searchParams.get("page_token"), "tok-1");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_contacts defaults page_size to 100 and omits page_token when not provided", async () => {
  const fixture = { result: [] };
  const calls = mockFetch(fixture);

  await contactTools.list_contacts.handler({});

  assert.equal(calls[0].url.searchParams.get("page_size"), "100");
  assert.equal(calls[0].url.searchParams.has("page_token"), false);
});

// NOTE: delete_sender was fixed after the original vitest reference suite was written.
// It used to call the wrong endpoint (/v3/verified_senders/:id); it now calls
// /v3/marketing/senders/:id, matching list_senders/create_sender's resource family.
// This test asserts against the current (fixed) behavior.
test("delete_sender DELETEs /v3/marketing/senders/:sender_id, matching list_senders/create_sender's resource family", async () => {
  const calls = mockFetch({});

  const result = await contactTools.delete_sender.handler({ sender_id: "42" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/senders/42");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "Sender identity 42 deleted successfully.");
});

test("update_segment PATCHes /v3/marketing/segments/2.0/:segment_id with name only", async () => {
  const fixture = { id: "seg-1", name: "Renamed Segment" };
  const calls = mockFetch(fixture);

  const result = await contactTools.update_segment.handler({ segment_id: "seg-1", name: "Renamed Segment" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/segments/2.0/seg-1");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(calledBody(calls), { name: "Renamed Segment" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("update_segment parses query_dsl JSON string into the request body", async () => {
  const fixture = { id: "seg-1" };
  const calls = mockFetch(fixture);
  const query_dsl = JSON.stringify({ conditions: [{ field: "email", operator: "contains", value: "@x.com" }] });

  await contactTools.update_segment.handler({ segment_id: "seg-1", query_dsl });

  assert.deepEqual(calledBody(calls), { query_dsl: JSON.parse(query_dsl) });
});

test("update_segment returns an error and does not call fetch when query_dsl is invalid JSON", async () => {
  const calls = mockFetch({});

  const result = await contactTools.update_segment.handler({ segment_id: "seg-1", query_dsl: "{not valid json" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /query_dsl must be valid JSON/);
});

test("update_segment returns an error and does not call fetch when neither name nor query_dsl is provided", async () => {
  const calls = mockFetch({});

  const result = await contactTools.update_segment.handler({ segment_id: "seg-1" });

  assert.equal(calls.length, 0);
  assert.match(result.content[0].text, /Please provide either 'name' or 'query_dsl'/);
});

test("delete_segment DELETEs /v3/marketing/segments/2.0/:segment_id", async () => {
  const calls = mockFetch({});

  const result = await contactTools.delete_segment.handler({ segment_id: "seg-1" });

  assert.equal(calls[0].url.pathname, "/v3/marketing/segments/2.0/seg-1");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "Segment seg-1 deleted successfully.");
});
