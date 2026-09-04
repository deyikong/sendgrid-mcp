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
  "create_suppression_group",
  "get_suppression_group",
  "update_suppression_group",
  "add_group_suppressions",
  "add_global_suppression",
  "get_global_suppression",
  "get_authenticated_domain",
  "create_authenticated_domain",
  "update_authenticated_domain",
  "validate_authenticated_domain",
  "get_default_authenticated_domain",
  "get_branded_link",
  "create_branded_link",
  "update_branded_link",
  "validate_branded_link",
  "list_event_webhooks",
  "get_event_webhook",
  "create_event_webhook",
  "update_event_webhook",
  "test_event_webhook",
  "list_inbound_parse_settings",
  "get_inbound_parse_setting",
  "create_inbound_parse_setting",
  "update_inbound_parse_setting",
  "get_tracking_settings",
  "get_click_tracking_settings",
  "update_click_tracking_settings",
  "get_google_analytics_settings",
  "update_google_analytics_settings",
  "get_open_tracking_settings",
  "update_open_tracking_settings",
  "get_subscription_tracking_settings",
  "update_subscription_tracking_settings",
  "get_all_mail_settings",
  "get_address_whitelist_settings",
  "update_address_whitelist_settings",
  "get_bounce_purge_settings",
  "update_bounce_purge_settings",
  "get_footer_settings",
  "update_footer_settings",
  "get_forward_bounce_settings",
  "update_forward_bounce_settings",
  "get_forward_spam_settings",
  "update_forward_spam_settings",
  "list_api_keys",
  "get_api_key",
  "get_alert",
  "list_teammates",
  "get_teammate",
  "list_pending_teammates",
  "get_ip_address",
  "get_ip_pool",
  "get_remaining_ips",
  "list_allowed_ips",
  "get_allowed_ip",
  "list_access_activity",
  "list_designs",
  "create_design",
  "get_design",
  "update_design",
  "duplicate_design",
  "list_prebuilt_designs",
  "get_prebuilt_design",
  "duplicate_prebuilt_design",
  "validate_email",
  "search_email_activity",
  "get_message_details",
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
  "list_suppression_groups",
  "delete_suppression_group",
  "list_group_suppressions",
  "remove_group_suppression",
  "list_global_suppressions",
  "delete_global_suppression",
  "list_bounces",
  "get_bounce",
  "delete_bounce",
  "list_blocks",
  "delete_block",
  "list_spam_reports",
  "delete_spam_report",
  "list_invalid_emails",
  "delete_invalid_email",
  "list_authenticated_domains",
  "delete_authenticated_domain",
  "list_branded_links",
  "delete_branded_link",
  "delete_event_webhook",
  "delete_inbound_parse_setting",
  "get_inbound_parse_stats",
  "list_alerts",
  "list_ip_addresses",
  "list_assigned_ips",
  "list_ip_pools",
  "list_ip_warmups",
  "get_ip_warmup_status",
  "delete_design",
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
