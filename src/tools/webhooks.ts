import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const webhookTools = {
  list_event_webhooks: {
    config: {
      title: "List Event Webhooks",
      description: "List all configured Event Webhook settings on the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/user/webhooks/event/settings/all");
      return jsonToolResult(result);
    },
  },

  get_event_webhook: {
    config: {
      title: "Get Event Webhook",
      description: "Get the configuration of a specific Event Webhook by ID",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The ID of the Event Webhook to retrieve"),
      },
    },
    handler: async ({ id }: { id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/event/settings/${id}`);
      return jsonToolResult(result);
    },
  },

  create_event_webhook: {
    config: {
      title: "Create Event Webhook",
      description: "Creates a new Event Webhook that POSTs email events (delivered, bounced, opened, clicked, etc.) to the given URL",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        url: z.string().describe("The URL that SendGrid should POST event data to"),
        enabled: z.boolean().optional().describe("Whether the Event Webhook is active"),
        friendly_name: z.string().optional().describe("A friendly name for this Event Webhook"),
        delivered: z.boolean().optional().describe("Send a webhook event when a message has been successfully delivered"),
        bounce: z.boolean().optional().describe("Send a webhook event when a message has bounced"),
        open: z.boolean().optional().describe("Send a webhook event when a recipient opens an email"),
        click: z.boolean().optional().describe("Send a webhook event when a recipient clicks a link in an email"),
        dropped: z.boolean().optional().describe("Send a webhook event when a message has been dropped"),
        spam_report: z.boolean().optional().describe("Send a webhook event when a recipient marks a message as spam"),
        unsubscribe: z.boolean().optional().describe("Send a webhook event when a recipient unsubscribes"),
        processed: z.boolean().optional().describe("Send a webhook event when a message has been received and is ready to be delivered"),
        deferred: z.boolean().optional().describe("Send a webhook event when a message has been temporarily delayed"),
        group_resubscribe: z.boolean().optional().describe("Send a webhook event when a recipient resubscribes to a suppression group"),
        group_unsubscribe: z.boolean().optional().describe("Send a webhook event when a recipient unsubscribes from a suppression group"),
      },
    },
    handler: async (params: {
      url: string;
      enabled?: boolean;
      friendly_name?: string;
      delivered?: boolean;
      bounce?: boolean;
      open?: boolean;
      click?: boolean;
      dropped?: boolean;
      spam_report?: boolean;
      unsubscribe?: boolean;
      processed?: boolean;
      deferred?: boolean;
      group_resubscribe?: boolean;
      group_unsubscribe?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = {};
      const fields: Array<keyof typeof params> = [
        "url",
        "enabled",
        "friendly_name",
        "delivered",
        "bounce",
        "open",
        "click",
        "dropped",
        "spam_report",
        "unsubscribe",
        "processed",
        "deferred",
        "group_resubscribe",
        "group_unsubscribe",
      ];
      for (const field of fields) {
        if (params[field] !== undefined) {
          requestBody[field] = params[field];
        }
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/user/webhooks/event/settings", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },

  update_event_webhook: {
    config: {
      title: "Update Event Webhook",
      description: "Update the configuration of an existing Event Webhook",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        id: z.string().describe("The ID of the Event Webhook to update"),
        url: z.string().optional().describe("The URL that SendGrid should POST event data to"),
        enabled: z.boolean().optional().describe("Whether the Event Webhook is active"),
        friendly_name: z.string().optional().describe("A friendly name for this Event Webhook"),
        delivered: z.boolean().optional().describe("Send a webhook event when a message has been successfully delivered"),
        bounce: z.boolean().optional().describe("Send a webhook event when a message has bounced"),
        open: z.boolean().optional().describe("Send a webhook event when a recipient opens an email"),
        click: z.boolean().optional().describe("Send a webhook event when a recipient clicks a link in an email"),
        dropped: z.boolean().optional().describe("Send a webhook event when a message has been dropped"),
        spam_report: z.boolean().optional().describe("Send a webhook event when a recipient marks a message as spam"),
        unsubscribe: z.boolean().optional().describe("Send a webhook event when a recipient unsubscribes"),
        processed: z.boolean().optional().describe("Send a webhook event when a message has been received and is ready to be delivered"),
        deferred: z.boolean().optional().describe("Send a webhook event when a message has been temporarily delayed"),
        group_resubscribe: z.boolean().optional().describe("Send a webhook event when a recipient resubscribes to a suppression group"),
        group_unsubscribe: z.boolean().optional().describe("Send a webhook event when a recipient unsubscribes from a suppression group"),
      },
    },
    handler: async (params: {
      id: string;
      url?: string;
      enabled?: boolean;
      friendly_name?: string;
      delivered?: boolean;
      bounce?: boolean;
      open?: boolean;
      click?: boolean;
      dropped?: boolean;
      spam_report?: boolean;
      unsubscribe?: boolean;
      processed?: boolean;
      deferred?: boolean;
      group_resubscribe?: boolean;
      group_unsubscribe?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const { id, ...rest } = params;
      const updateData: Record<string, any> = {};
      const fields: Array<keyof typeof rest> = [
        "url",
        "enabled",
        "friendly_name",
        "delivered",
        "bounce",
        "open",
        "click",
        "dropped",
        "spam_report",
        "unsubscribe",
        "processed",
        "deferred",
        "group_resubscribe",
        "group_unsubscribe",
      ];
      for (const field of fields) {
        if (rest[field] !== undefined) {
          updateData[field] = rest[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update."
          }]
        };
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/event/settings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  delete_event_webhook: {
    config: {
      title: "Delete Event Webhook",
      description: "Permanently delete an Event Webhook configuration. This action cannot be undone.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe("The ID of the Event Webhook to delete"),
      },
    },
    handler: async ({ id }: { id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/event/settings/${id}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Event Webhook ${id} deleted successfully.`
        }]
      };
    },
  },

  test_event_webhook: {
    config: {
      title: "Test Event Webhook",
      description: "Sends a test event payload to the given webhook URL to verify it's reachable and correctly configured",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        url: z.string().describe("The URL to send the test event payload to"),
      },
    },
    handler: async ({ url }: { url: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/user/webhooks/event/test", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      return jsonToolResult(result);
    },
  },

  list_inbound_parse_settings: {
    config: {
      title: "List Inbound Parse Settings",
      description: "List all configured Inbound Parse webhook settings on the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/user/webhooks/parse/settings");
      return jsonToolResult(result);
    },
  },

  get_inbound_parse_setting: {
    config: {
      title: "Get Inbound Parse Setting",
      description: "Get the Inbound Parse webhook configuration for a specific hostname",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        hostname: z.string().describe("The hostname whose Inbound Parse setting should be retrieved"),
      },
    },
    handler: async ({ hostname }: { hostname: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/parse/settings/${hostname}`);
      return jsonToolResult(result);
    },
  },

  create_inbound_parse_setting: {
    config: {
      title: "Create Inbound Parse Setting",
      description: "Configures inbound email parsing so mail sent to the given hostname is POSTed to the given URL",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        hostname: z.string().describe("The hostname that should receive inbound mail (e.g. parse.example.com)"),
        url: z.string().describe("The URL that parsed inbound emails should be POSTed to"),
        spam_check: z.boolean().optional().describe("Whether to check incoming emails for spam before POSTing them"),
        send_raw: z.boolean().optional().describe("Whether to POST the raw MIME message instead of parsed fields"),
      },
    },
    handler: async ({
      hostname,
      url,
      spam_check,
      send_raw,
    }: {
      hostname: string;
      url: string;
      spam_check?: boolean;
      send_raw?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const requestBody: Record<string, any> = { hostname, url };
      if (spam_check !== undefined) {
        requestBody.spam_check = spam_check;
      }
      if (send_raw !== undefined) {
        requestBody.send_raw = send_raw;
      }

      const result = await makeRequest("https://api.sendgrid.com/v3/user/webhooks/parse/settings", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return jsonToolResult(result);
    },
  },

  update_inbound_parse_setting: {
    config: {
      title: "Update Inbound Parse Setting",
      description: "Update the Inbound Parse webhook configuration for a specific hostname",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        hostname: z.string().describe("The hostname whose Inbound Parse setting should be updated"),
        url: z.string().optional().describe("The URL that parsed inbound emails should be POSTed to"),
        spam_check: z.boolean().optional().describe("Whether to check incoming emails for spam before POSTing them"),
        send_raw: z.boolean().optional().describe("Whether to POST the raw MIME message instead of parsed fields"),
      },
    },
    handler: async ({
      hostname,
      url,
      spam_check,
      send_raw,
    }: {
      hostname: string;
      url?: string;
      spam_check?: boolean;
      send_raw?: boolean;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};
      if (url !== undefined) {
        updateData.url = url;
      }
      if (spam_check !== undefined) {
        updateData.spam_check = spam_check;
      }
      if (send_raw !== undefined) {
        updateData.send_raw = send_raw;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (url, spam_check, or send_raw)."
          }]
        };
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/parse/settings/${hostname}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return jsonToolResult(result);
    },
  },

  delete_inbound_parse_setting: {
    config: {
      title: "Delete Inbound Parse Setting",
      description: "Permanently delete an Inbound Parse webhook configuration for a hostname. This action cannot be undone.",
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        hostname: z.string().describe("The hostname whose Inbound Parse setting should be deleted"),
      },
    },
    handler: async ({ hostname }: { hostname: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/parse/settings/${hostname}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: `Inbound Parse setting for ${hostname} deleted successfully.`
        }]
      };
    },
  },

  get_inbound_parse_stats: {
    config: {
      title: "Get Inbound Parse Stats",
      description: "Get statistics on the number of inbound emails parsed over a given date range",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        start_date: z.string().describe("Start date for the stats range, formatted YYYY-MM-DD"),
        end_date: z.string().optional().describe("End date for the stats range, formatted YYYY-MM-DD"),
        limit: z.number().optional().describe("Number of results to return"),
        offset: z.number().optional().describe("Pagination offset"),
        aggregated_by: z.string().optional().describe("Time interval to aggregate stats by (e.g. 'day')"),
      },
    },
    handler: async ({
      start_date,
      end_date,
      limit,
      offset,
      aggregated_by,
    }: {
      start_date: string;
      end_date?: string;
      limit?: number;
      offset?: number;
      aggregated_by?: string;
    }): Promise<ToolResult> => {
      const params = new URLSearchParams();
      params.set("start_date", start_date);
      if (end_date !== undefined) {
        params.set("end_date", end_date);
      }
      if (limit !== undefined) {
        params.set("limit", String(limit));
      }
      if (offset !== undefined) {
        params.set("offset", String(offset));
      }
      if (aggregated_by !== undefined) {
        params.set("aggregated_by", aggregated_by);
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/user/webhooks/parse/stats?${params.toString()}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },
};
