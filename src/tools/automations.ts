import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { PaginationSchema, ToolResult } from "../shared/types.js";

export const automationTools = {
  list_automations: {
    config: {
      title: "List Marketing Automations",
      description: "List all marketing automations",
      inputSchema: {
        offset: PaginationSchema.offset,
        limit: PaginationSchema.limit,
      },
    },
    handler: async ({ offset, limit }: { offset: number; limit: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/automations?offset=${offset}&limit=${limit}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  open_automation_creator: {
    config: {
      title: "Open Automation Creator",
      description: "Open SendGrid automation creator in browser",
    },
    handler: async (): Promise<ToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: "Please open this URL in your browser to create a new automation:\nhttps://mc.sendgrid.com/automations/choose",
          },
        ],
      };
    },
  },

  open_automation_editor: {
    config: {
      title: "Open Automation Editor",
      description: "Open automation editor for a specific automation",
      inputSchema: {
        automation_id: z.string().describe("The automation ID to edit"),
      },
    },
    handler: async ({ automation_id }: { automation_id: string }): Promise<ToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: `Please open this URL in your browser to edit automation ${automation_id}:\nhttps://mc.sendgrid.com/automations/${automation_id}/detail`,
          },
        ],
      };
    },
  },
};