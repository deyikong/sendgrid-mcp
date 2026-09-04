import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";

export const alertTools = {
  list_alerts: {
    config: {
      title: "List Alerts",
      description: "List all usage/stats alerts configured on the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/alerts");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_alert: {
    config: {
      title: "Get Alert",
      description: "Get details for a specific alert",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        alert_id: z.string().describe("ID of the alert to retrieve"),
      },
    },
    handler: async ({ alert_id }: { alert_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/alerts/${encodeURIComponent(alert_id)}`);
      return jsonToolResult(result);
    },
  },
};
