import { makeRequest } from "../shared/api.js";
import { ToolResult } from "../shared/types.js";

export const miscTools = {
  get_scopes: {
    config: {
      title: "Get Scopes",
      description: "Get available permission scopes for API keys",
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/scopes");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },
};