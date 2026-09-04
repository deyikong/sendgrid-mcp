import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";

export const messageSearchTools = {
  search_email_activity: {
    config: {
      title: "Search Email Activity",
      description: "Search sent message activity using SendGrid's SGQL filter syntax (e.g. by recipient, status, or subject) -- useful for troubleshooting why a specific email wasn't delivered.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        query: z.string().describe('SGQL filter string, e.g. to_email="user@example.com" or status="delivered" AND last_event_time BETWEEN TIMESTAMP "2024-01-01" AND TIMESTAMP "2024-01-31"'),
        limit: z.number().optional().describe("Number of results to return"),
      },
    },
    handler: async ({ query, limit }: { query: string; limit?: number }): Promise<ToolResult> => {
      const params = new URLSearchParams();
      params.set("query", query);
      if (limit !== undefined) {
        params.set("limit", String(limit));
      }

      const result = await makeRequest(`https://api.sendgrid.com/v3/messages?${params.toString()}`);
      return jsonToolResult(result);
    },
  },

  get_message_details: {
    config: {
      title: "Get Message Details",
      description: "Get full delivery event history and details for a single sent message by its message ID.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        msg_id: z.string().describe("The message ID to look up"),
      },
    },
    handler: async ({ msg_id }: { msg_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/messages/${msg_id}`);
      return jsonToolResult(result);
    },
  },
};
