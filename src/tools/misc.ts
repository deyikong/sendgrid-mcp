import { makeRequest } from "../shared/api.js";
import { ToolResult, jsonToolResult, PassthroughObjectSchema } from "../shared/types.js";

export const miscTools = {
  get_scopes: {
    config: {
      title: "Get Scopes",
      description: "Get available permission scopes for API keys",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      outputSchema: PassthroughObjectSchema,
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/scopes");
      return jsonToolResult(result);
    },
  },
};