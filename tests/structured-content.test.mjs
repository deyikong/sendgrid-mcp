import assert from "node:assert/strict";
import test from "node:test";

process.env.SENDGRID_API_KEY = "SG.test-key-for-route-tests";
process.env.READ_ONLY = "true";

const { validateEnvironment } = await import("../build/shared/env.js");
const { jsonToolResult } = await import("../build/shared/types.js");
const { allTools } = await import("../build/tools/index.js");

validateEnvironment();

test("jsonToolResult attaches matching text and structuredContent", () => {
  const data = { id: "abc", nested: { count: 3 }, list: [1, 2, 3] };
  const result = jsonToolResult(data);

  assert.equal(result.content[0].type, "text");
  assert.deepEqual(JSON.parse(result.content[0].text), data);
  assert.deepEqual(result.structuredContent, data);
  // Same reference is fine -- callers already treat this data as immutable
  // once handed to makeRequest's caller.
});

// Tools whose SendGrid response is a confirmed plain JSON object (verified
// against SendGrid's public OpenAPI spec) and whose handler returns nothing
// but that object -- these get outputSchema + structuredContent.
const ELIGIBLE = [
  "list_single_sends",
  "get_single_send",
  "list_email_lists",
  "create_email_list",
  "update_email_list",
  "list_segments",
  "create_contact",
  "create_contact_with_lists",
  "list_custom_fields",
  "create_custom_field",
  "update_custom_field",
  "list_senders",
  "remove_contact_from_lists",
  "get_contact",
  "update_contact",
  "search_contacts",
  "search_contacts_by_emails",
  "list_contacts",
  "update_segment",
  "get_scopes",
  "list_templates",
  "get_template",
  "create_template",
  "update_template",
  "get_template_version",
  "update_template_version",
];

// Tools deliberately excluded: their handler composes a custom message
// embedding the JSON (create_sender, delete_contact, create_html_template,
// create_template_version) rather than returning the plain object, or their
// SendGrid response is a top-level array (everything in stats.ts, which MCP's
// outputSchema can't describe -- it's constrained to type: "object"), or
// there's no JSON body at all (delete_* confirmations, open_* browser links,
// send_mail). Declaring outputSchema on any of these without *always*
// attaching matching structuredContent would make the MCP SDK hard-fail the
// call ("has an output schema but no structured content was provided").
const MUST_NOT_HAVE_OUTPUT_SCHEMA = [
  "create_sender",
  "delete_contact",
  "delete_email_list",
  "delete_custom_field",
  "delete_sender",
  "delete_segment",
  "create_template_version",
  "create_html_template",
  "delete_template",
  "delete_template_version",
  "open_template_editor",
  "send_mail",
  "open_single_send_creator",
  "open_single_send_stats",
  "open_segment_creator",
  "open_csv_uploader",
  "get_global_stats",
  "get_stats_by_browser",
  "get_stats_overview",
  "list_automations",
  "get_automation",
];

for (const name of ELIGIBLE) {
  test(`${name} declares outputSchema (eligible for structuredContent)`, () => {
    const tool = allTools[name];
    assert.ok(tool, `${name} is not a registered tool`);
    assert.ok(tool.config.outputSchema !== undefined, `${name} is missing config.outputSchema`);
  });
}

for (const name of MUST_NOT_HAVE_OUTPUT_SCHEMA) {
  test(`${name} does NOT declare outputSchema (would hard-fail without guaranteed structuredContent)`, () => {
    const tool = allTools[name];
    assert.ok(tool, `${name} is not a registered tool`);
    assert.equal(
      tool.config.outputSchema,
      undefined,
      `${name} declares outputSchema but its handler doesn't always return the plain object as structuredContent`
    );
  });
}

test("every tool with outputSchema in the full registry is accounted for in ELIGIBLE", () => {
  const actual = Object.entries(allTools)
    .filter(([, tool]) => tool.config.outputSchema !== undefined)
    .map(([name]) => name)
    .sort();
  assert.deepEqual(actual, [...ELIGIBLE].sort());
});
