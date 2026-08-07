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
        page_token: z.string().optional().describe("Pagination token from a previous response"),
      },
    },
    handler: async ({
      page_size,
      page_token,
    }: {
      page_size: number;
      page_token?: string;
    }): Promise<ToolResult> => {
      const searchParams = new URLSearchParams({ page_size: String(page_size) });
      if (page_token) {
        searchParams.set("page_token", page_token);
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/marketing/singlesends?${searchParams.toString()}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_single_send: {
    config: {
      title: "Get Single Send Campaign",
      description: "Get detailed content and settings for a single send campaign",
      inputSchema: {
        singlesend_id: z.string().min(1).describe("The single send ID to retrieve"),
      },
    },
    handler: async ({ singlesend_id }: { singlesend_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(
        `https://api.sendgrid.com/v3/marketing/singlesends/${encodeURIComponent(singlesend_id)}`,
      );
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
