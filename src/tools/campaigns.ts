import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult } from "../shared/types.js";

export const campaignTools = {
  list_single_sends: {
    config: {
      title: "List Single Send Campaigns",
      description: "List all single send campaigns",
      inputSchema: {
        page_size: z.number().optional().default(50).describe("Number of results to return"),
      },
    },
    handler: async ({ page_size }: { page_size: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/singlesends/search?page_size=${page_size}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  open_single_send_creator: {
    config: {
      title: "Open Single Send Creator",
      description: "Open SendGrid single send creator in browser",
    },
    handler: async (): Promise<ToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: "Please open this URL in your browser to create a new single send:\nhttps://mc.sendgrid.com/single-sends/new/selector/your-designs?view=raw",
          },
        ],
      };
    },
  },

  open_single_send_stats: {
    config: {
      title: "Open Single Send Stats",
      description: "Open single send stats page for a specific campaign",
      inputSchema: {
        singlesend_id: z.string().describe("The single send ID to view stats for"),
      },
    },
    handler: async ({ singlesend_id }: { singlesend_id: string }): Promise<ToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `Please open this URL in your browser to view stats for single send ${singlesend_id}:\nhttps://mc.sendgrid.com/single-sends/${singlesend_id}/stats?view=raw`,
          },
        ],
      };
    },
  },
};