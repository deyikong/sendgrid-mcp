import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";

export const apiKeyTools = {
  list_api_keys: {
    config: {
      title: "List API Keys",
      description: "List all API keys on the account (names and IDs only, not the secret key values)",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/api_keys");
      return jsonToolResult(result);
    },
  },

  get_api_key: {
    config: {
      title: "Get API Key",
      description: "Get details for a specific API key, including its scopes",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
      inputSchema: {
        api_key_id: z.string().describe("ID of the API key to retrieve"),
      },
    },
    handler: async ({ api_key_id }: { api_key_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/api_keys/${encodeURIComponent(api_key_id)}`);
      return jsonToolResult(result);
    },
  },
};
