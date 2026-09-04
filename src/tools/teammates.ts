import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";

export const teammateTools = {
  list_teammates: {
    config: {
      title: "List Teammates",
      description: "List all teammates (users) on the account",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/teammates");
      return jsonToolResult(result);
    },
  },

  get_teammate: {
    config: {
      title: "Get Teammate",
      description: "Get details for a specific teammate, including their permission scopes",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        username: z.string().describe("Username of the teammate to retrieve"),
      },
    },
    handler: async ({ username }: { username: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/teammates/${encodeURIComponent(username)}`);
      return jsonToolResult(result);
    },
  },

  list_pending_teammates: {
    config: {
      title: "List Pending Teammates",
      description: "List pending teammate invitations that haven't been accepted yet",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/teammates/pending");
      return jsonToolResult(result);
    },
  },
};
