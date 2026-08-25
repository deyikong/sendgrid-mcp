import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "false";

const { validateEnvironment } = await import("../build/shared/env.js");
const { templateTools } = await import("../build/tools/templates.js");

validateEnvironment();

// Stubs global fetch for a single expected call and records it as { url: URL, init }.
function mockFetch(body, status = 200) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(String(url)), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

// Stubs global fetch for a sequence of calls, each described by { body, status }.
// The last entry repeats if fetch is called more times than entries exist.
function mockFetchSequence(entries) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const entry = entries[Math.min(calls.length, entries.length - 1)];
    calls.push({ url: new URL(String(url)), init });
    return new Response(JSON.stringify(entry.body), {
      status: entry.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

function body(call) {
  return JSON.parse(call.init.body);
}

test("list_templates hits /v3/templates with the default page_size and no generations filter", async () => {
  const fixture = { result: [{ id: "d-1", name: "Template One" }] };
  const calls = mockFetch(fixture);

  const result = await templateTools.list_templates.handler({});

  assert.equal(calls[0].url.pathname, "/v3/templates");
  assert.equal(calls[0].url.searchParams.get("page_size"), "50");
  assert.equal(calls[0].url.searchParams.has("generations"), false);
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("list_templates passes page_size and generations when provided", async () => {
  const fixture = { result: [] };
  const calls = mockFetch(fixture);

  await templateTools.list_templates.handler({ generations: "dynamic", page_size: 25 });

  assert.equal(calls[0].url.searchParams.get("page_size"), "25");
  assert.equal(calls[0].url.searchParams.get("generations"), "dynamic");
});

test("get_template hits /v3/templates/{template_id} and returns the fixture payload", async () => {
  const fixture = { id: "d-123", name: "Welcome Email", versions: [] };
  const calls = mockFetch(fixture);

  const result = await templateTools.get_template.handler({ template_id: "d-123" });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("create_template POSTs to /v3/templates with the given name and defaults generation to dynamic", async () => {
  const fixture = { id: "d-999", name: "New Template", generation: "dynamic" };
  const calls = mockFetch(fixture);

  const result = await templateTools.create_template.handler({ name: "New Template" });

  assert.equal(calls[0].url.pathname, "/v3/templates");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(body(calls[0]), { name: "New Template", generation: "dynamic" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("create_template respects an explicit legacy generation", async () => {
  const fixture = { id: "d-1000", name: "Legacy Template", generation: "legacy" };
  const calls = mockFetch(fixture);

  await templateTools.create_template.handler({ name: "Legacy Template", generation: "legacy" });

  assert.deepEqual(body(calls[0]), { name: "Legacy Template", generation: "legacy" });
});

test("update_template PATCHes /v3/templates/{template_id} with the new name", async () => {
  const fixture = { id: "d-123", name: "Renamed Template" };
  const calls = mockFetch(fixture);

  const result = await templateTools.update_template.handler({ template_id: "d-123", name: "Renamed Template" });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(body(calls[0]), { name: "Renamed Template" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("delete_template DELETEs /v3/templates/{template_id} and reports success", async () => {
  const calls = mockFetch({});

  const result = await templateTools.delete_template.handler({ template_id: "d-123" });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "Template d-123 deleted successfully.");
});

test("create_template_version POSTs to /v3/templates/{template_id}/versions with all fields including plain_content and test_data", async () => {
  const fixture = { id: "v-1", template_id: "d-123", name: "v1", active: 1 };
  const calls = mockFetch(fixture);

  const result = await templateTools.create_template_version.handler({
    template_id: "d-123",
    name: "v1",
    subject: "Hello {{firstName}}",
    html_content: "<p>Hi {{firstName}}</p>",
    plain_content: "Hi {{firstName}}",
    active: 1,
    generate_plain_content: false,
    test_data: JSON.stringify({ firstName: "Ada" }),
  });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123/versions");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(body(calls[0]), {
    name: "v1",
    subject: "Hello {{firstName}}",
    html_content: "<p>Hi {{firstName}}</p>",
    active: 1,
    generate_plain_content: false,
    plain_content: "Hi {{firstName}}",
    test_data: { firstName: "Ada" },
  });
  assert.ok(result.content[0].text.includes(JSON.stringify(fixture, null, 2)));
  assert.ok(result.content[0].text.includes("template_id: d-123"));
});

test("create_template_version omits plain_content and test_data, and defaults active/generate_plain_content, when not provided", async () => {
  const fixture = { id: "v-2", template_id: "d-123", name: "v2" };
  const calls = mockFetch(fixture);

  await templateTools.create_template_version.handler({
    template_id: "d-123",
    name: "v2",
    subject: "Subject",
    html_content: "<p>Body</p>",
  });

  const requestBody = body(calls[0]);
  assert.deepEqual(requestBody, {
    name: "v2",
    subject: "Subject",
    html_content: "<p>Body</p>",
    active: 1,
    generate_plain_content: true,
  });
  assert.ok(!("plain_content" in requestBody));
  assert.ok(!("test_data" in requestBody));
});

test("create_template_version returns an error and never calls fetch when test_data is invalid JSON", async () => {
  const calls = mockFetch({});

  const result = await templateTools.create_template_version.handler({
    template_id: "d-123",
    name: "v3",
    subject: "Subject",
    html_content: "<p>Body</p>",
    test_data: "{not valid json",
  });

  assert.equal(calls.length, 0);
  assert.equal(result.content[0].text, "Error: test_data must be valid JSON");
});

test("get_template_version hits /v3/templates/{template_id}/versions/{version_id}", async () => {
  const fixture = { id: "v-1", template_id: "d-123", name: "v1" };
  const calls = mockFetch(fixture);

  const result = await templateTools.get_template_version.handler({ template_id: "d-123", version_id: "v-1" });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123/versions/v-1");
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("update_template_version PATCHes only the fields provided", async () => {
  const fixture = { id: "v-1", template_id: "d-123", name: "Updated" };
  const calls = mockFetch(fixture);

  const result = await templateTools.update_template_version.handler({
    template_id: "d-123",
    version_id: "v-1",
    name: "Updated",
  });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123/versions/v-1");
  assert.equal(calls[0].init.method, "PATCH");
  assert.deepEqual(body(calls[0]), { name: "Updated" });
  assert.deepEqual(JSON.parse(result.content[0].text), fixture);
});

test("update_template_version includes test_data parsed as JSON alongside other provided fields", async () => {
  const fixture = { id: "v-1" };
  const calls = mockFetch(fixture);

  await templateTools.update_template_version.handler({
    template_id: "d-123",
    version_id: "v-1",
    subject: "New subject",
    active: 0,
    test_data: JSON.stringify({ foo: "bar" }),
  });

  assert.deepEqual(body(calls[0]), {
    subject: "New subject",
    active: 0,
    test_data: { foo: "bar" },
  });
});

test("update_template_version returns an error and never calls fetch when no fields are provided", async () => {
  const calls = mockFetch({});

  const result = await templateTools.update_template_version.handler({
    template_id: "d-123",
    version_id: "v-1",
  });

  assert.equal(calls.length, 0);
  assert.equal(result.content[0].text, "Error: Please provide at least one field to update");
});

test("update_template_version returns an error and never calls fetch when test_data is invalid JSON", async () => {
  const calls = mockFetch({});

  const result = await templateTools.update_template_version.handler({
    template_id: "d-123",
    version_id: "v-1",
    name: "Updated",
    test_data: "{not valid json",
  });

  assert.equal(calls.length, 0);
  assert.equal(result.content[0].text, "Error: test_data must be valid JSON");
});

test("delete_template_version DELETEs /v3/templates/{template_id}/versions/{version_id} and reports success", async () => {
  const calls = mockFetch({});

  const result = await templateTools.delete_template_version.handler({ template_id: "d-123", version_id: "v-1" });

  assert.equal(calls[0].url.pathname, "/v3/templates/d-123/versions/v-1");
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(result.content[0].text, "Template version v-1 deleted successfully.");
});

test("create_html_template happy path: creates the template, then creates the version, in sequence", async () => {
  const templateFixture = { id: "d-555", name: "My Template", generation: "dynamic" };
  const versionFixture = { id: "v-555", template_id: "d-555", name: "v1" };
  const calls = mockFetchSequence([{ body: templateFixture }, { body: versionFixture }]);

  const result = await templateTools.create_html_template.handler({
    template_name: "My Template",
    version_name: "v1",
    subject: "Hello {{firstName}}",
    html_content: "<p>Hi {{firstName}}</p>",
  });

  // Call 0: create the template
  assert.equal(calls[0].url.pathname, "/v3/templates");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(body(calls[0]), { name: "My Template", generation: "dynamic" });

  // Call 1: create the version, scoped to the template id returned by call 0
  assert.equal(calls[1].url.pathname, "/v3/templates/d-555/versions");
  assert.equal(calls[1].init.method, "POST");
  assert.deepEqual(body(calls[1]), {
    name: "v1",
    subject: "Hello {{firstName}}",
    html_content: "<p>Hi {{firstName}}</p>",
    active: 1,
    generate_plain_content: true,
  });

  assert.equal(calls.length, 2);
  assert.ok(result.content[0].text.includes("Template ID: d-555"));
  assert.ok(result.content[0].text.includes("Version ID: v-555"));
  assert.ok(
    result.content[0].text.includes(
      JSON.stringify({ template: templateFixture, version: versionFixture }, null, 2),
    ),
  );
});

test("create_html_template sets plain_content and disables auto-generation when plain_content is provided", async () => {
  const templateFixture = { id: "d-556" };
  const versionFixture = { id: "v-556" };
  const calls = mockFetchSequence([{ body: templateFixture }, { body: versionFixture }]);

  await templateTools.create_html_template.handler({
    template_name: "My Template",
    version_name: "v1",
    subject: "Subject",
    html_content: "<p>Body</p>",
    plain_content: "Body",
  });

  assert.deepEqual(body(calls[1]), {
    name: "v1",
    subject: "Subject",
    html_content: "<p>Body</p>",
    active: 1,
    generate_plain_content: false,
    plain_content: "Body",
  });
});

test("create_html_template parses test_data into the version request when it is valid JSON", async () => {
  const templateFixture = { id: "d-557" };
  const versionFixture = { id: "v-557" };
  const calls = mockFetchSequence([{ body: templateFixture }, { body: versionFixture }]);

  await templateTools.create_html_template.handler({
    template_name: "My Template",
    version_name: "v1",
    subject: "Subject",
    html_content: "<p>Body</p>",
    test_data: JSON.stringify({ firstName: "Ada" }),
  });

  assert.deepEqual(body(calls[1]).test_data, { firstName: "Ada" });
});

test("create_html_template cleans up (deletes the template) and returns an error when test_data is invalid JSON", async () => {
  const templateFixture = { id: "d-558" };
  const calls = mockFetchSequence([{ body: templateFixture }, { body: {} }]);

  const result = await templateTools.create_html_template.handler({
    template_name: "My Template",
    version_name: "v1",
    subject: "Subject",
    html_content: "<p>Body</p>",
    test_data: "{not valid json",
  });

  assert.equal(calls.length, 2);

  // Call 0: create the template (succeeds)
  assert.equal(calls[0].url.pathname, "/v3/templates");
  assert.equal(calls[0].init.method, "POST");

  // Call 1: cleanup delete of the template just created, since the version body was invalid
  assert.equal(calls[1].url.pathname, "/v3/templates/d-558");
  assert.equal(calls[1].init.method, "DELETE");

  assert.equal(result.content[0].text, "Error: test_data must be valid JSON. Template creation cancelled.");
});

test("create_html_template rolls back (deletes) the created template when the version-creation request itself fails", async () => {
  // A genuine API failure on the version-creation call rolls back the
  // just-created template via a DELETE call, rather than leaving an
  // orphaned empty template behind.
  const templateFixture = { id: "d-559" };
  const calls = mockFetchSequence([
    { body: templateFixture },
    { body: { errors: [{ message: "boom" }] }, status: 400 },
    { body: {} },
  ]);

  const result = await templateTools.create_html_template.handler({
    template_name: "My Template",
    version_name: "v1",
    subject: "Subject",
    html_content: "<p>Body</p>",
  });

  assert.equal(calls.length, 3);
  assert.equal(calls[1].init.method, "POST");
  assert.equal(calls[2].url.pathname, "/v3/templates/d-559");
  assert.equal(calls[2].init.method, "DELETE");

  assert.ok(result.content[0].text.includes("❌ Error creating template version:"));
  assert.ok(result.content[0].text.includes("SendGrid API error (400)"));
  assert.ok(result.content[0].text.includes("rolled back"));
});

test("open_template_editor returns the dynamic-templates URL for a specific template_id without calling fetch", async () => {
  const calls = mockFetch({});

  const result = await templateTools.open_template_editor.handler({ template_id: "d-123" });

  assert.equal(calls.length, 0);
  assert.ok(result.content[0].text.includes("https://mc.sendgrid.com/dynamic-templates/d-123"));
  assert.ok(result.content[0].text.includes("template ID: d-123"));
});

test("open_template_editor returns the template list URL when no template_id is given", async () => {
  const calls = mockFetch({});

  const result = await templateTools.open_template_editor.handler({});

  assert.equal(calls.length, 0);
  assert.ok(result.content[0].text.includes("https://mc.sendgrid.com/dynamic-templates"));
  assert.ok(!result.content[0].text.includes("dynamic-templates/d-"));
  assert.ok(result.content[0].text.includes("template management page"));
});
