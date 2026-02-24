import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { PaginationSchema, ToolResult } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

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

  get_automation: {
    config: {
      title: "Get Automation Details",
      description: "Get detailed information about a specific automation including all steps and settings",
      inputSchema: {
        automation_id: z.string().describe("The automation ID to retrieve"),
      },
    },
    handler: async ({ automation_id }: { automation_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/automations/${automation_id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  update_automation_settings: {
    config: {
      title: "Update Automation Settings",
      description: "Update automation-level settings such as name, status, and title. Use this to activate/pause entire automations or rename them.",
      inputSchema: {
        automation_id: z.string().describe("The automation ID to update"),
        title: z.string().optional().describe("New title/name for the automation"),
        status: z.enum(["active", "paused"]).optional().describe("Set the automation status to 'active' or 'paused'"),
      },
    },
    handler: async ({
      automation_id,
      title,
      status
    }: {
      automation_id: string;
      title?: string;
      status?: "active" | "paused";
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (title !== undefined) {
        updateData.title = title;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (title or status)."
          }]
        };
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/marketing/automations/${automation_id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      return {
        content: [{
          type: "text",
          text: `Automation ${automation_id} updated successfully:\n${JSON.stringify(result, null, 2)}`
        }]
      };
    },
  },

  update_automation_step: {
    config: {
      title: "Update Automation Step",
      description: "Update individual step settings within an automation, including step status (activate/pause), wait time, and send configurations",
      inputSchema: {
        automation_id: z.string().describe("The automation ID containing the step"),
        step_id: z.string().describe("The step ID within the automation to update"),
        step_status: z.enum(["active", "paused"]).optional().describe("Set the step status to 'active' or 'paused'"),
        wait_time: z.number().optional().describe("Wait time in minutes before executing this step"),
      },
    },
    handler: async ({
      automation_id,
      step_id,
      step_status,
      wait_time
    }: {
      automation_id: string;
      step_id: string;
      step_status?: "active" | "paused";
      wait_time?: number;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      const updateData: Record<string, any> = {};

      if (step_status !== undefined) {
        updateData.step_status = step_status;
      }

      if (wait_time !== undefined) {
        updateData.wait_time = wait_time;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: "text",
            text: "No updates specified. Please provide at least one field to update (step_status or wait_time)."
          }]
        };
      }

      const result = await makeRequest(
        `https://api.sendgrid.com/v3/marketing/automations/${automation_id}/steps/${step_id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      return {
        content: [{
          type: "text",
          text: `Automation step ${step_id} updated successfully:\n${JSON.stringify(result, null, 2)}`
        }]
      };
    },
  },

  delete_automation: {
    config: {
      title: "Delete Automation",
      description: "Permanently delete a marketing automation. This action cannot be undone.",
      inputSchema: {
        automation_id: z.string().describe("The automation ID to delete"),
      },
    },
    handler: async ({ automation_id }: { automation_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }

      await makeRequest(
        `https://api.sendgrid.com/v3/marketing/automations/${automation_id}`,
        {
          method: "DELETE",
        }
      );

      return {
        content: [{
          type: "text",
          text: `Automation ${automation_id} deleted successfully.`
        }]
      };
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