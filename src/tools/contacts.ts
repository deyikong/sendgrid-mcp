import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ContactSchema, ToolResult } from "../shared/types.js";

export const contactTools = {
  list_email_lists: {
    config: {
      title: "List Email Lists",
      description: "List all email lists",
      inputSchema: {
        page_size: z.number().optional().default(1000).describe("Number of results to return"),
      },
    },
    handler: async ({ page_size }: { page_size: number }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/lists?page_size=${page_size}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  create_email_list: {
    config: {
      title: "Create Email List",
      description: "Create a new email list",
      inputSchema: {
        name: z.string().describe("Name of the email list"),
      },
    },
    handler: async ({ name }: { name: string }): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/lists", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  list_segments: {
    config: {
      title: "List Segments",
      description: "List all segments with their parent list relationships",
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/segments");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  open_segment_creator: {
    config: {
      title: "Open Segment Creator",
      description: "Open SendGrid segment creator in browser",
    },
    handler: async (): Promise<ToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: "Please open this URL in your browser to create a new segment:\nhttps://mc.sendgrid.com/contacts/segments/create",
          },
        ],
      };
    },
  },

  create_contact: {
    config: {
      title: "Create Contact",
      description: "Create a new contact (without list assignment)",
      inputSchema: {
        contacts: z.array(ContactSchema).describe("Array of contact objects"),
      },
    },
    handler: async ({ contacts }: { contacts: any[] }): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        body: JSON.stringify({ contacts }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  create_contact_with_lists: {
    config: {
      title: "Create Contact with Lists",
      description: "Create a new contact and add to specific lists",
      inputSchema: {
        contacts: z.array(ContactSchema).describe("Array of contact objects"),
        list_ids: z.array(z.string()).describe("Array of list IDs to add the contact to"),
      },
    },
    handler: async ({ contacts, list_ids }: { contacts: any[]; list_ids: string[] }): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        body: JSON.stringify({ contacts, list_ids }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  open_csv_uploader: {
    config: {
      title: "Open CSV Uploader",
      description: "Open SendGrid CSV contact upload page in browser",
    },
    handler: async (): Promise<ToolResult> => {
      return {
        content: [
          {
            type: "text",
            text: "Please open this URL in your browser to upload contacts via CSV:\nhttps://mc.sendgrid.com/contacts/import/upload-csv",
          },
        ],
      };
    },
  },

  list_custom_fields: {
    config: {
      title: "List Custom Fields",
      description: "List all custom fields",
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/field_definitions");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  create_custom_field: {
    config: {
      title: "Create Custom Field",
      description: "Create a new custom field",
      inputSchema: {
        name: z.string().describe("Name of the custom field"),
        field_type: z.enum(["Text", "Number", "Date"]).describe("Type of the field"),
      },
    },
    handler: async ({ name, field_type }: { name: string; field_type: string }): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/field_definitions", {
        method: "POST",
        body: JSON.stringify({ name, field_type }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  list_senders: {
    config: {
      title: "List Senders",
      description: "List all verified senders",
    },
    handler: async (): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/senders");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  create_sender: {
    config: {
      title: "Create Sender",
      description: "Create a new sender identity",
      inputSchema: {
        nickname: z.string().describe("Nickname for the sender"),
        from: z.object({
          email: z.string().describe("From email address"),
          name: z.string().describe("From name"),
        }),
        reply_to: z.object({
          email: z.string().describe("Reply-to email address"),
          name: z.string().describe("Reply-to name"),
        }),
        address: z.string().describe("Street address"),
        city: z.string().describe("City"),
        state: z.string().describe("State"),
        zip: z.string().describe("ZIP code"),
        country: z.string().describe("Country"),
      },
    },
    handler: async (senderData: any): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/senders", {
        method: "POST",
        body: JSON.stringify(senderData),
      });
      return {
        content: [
          {
            type: "text",
            text: `Sender created successfully. ${JSON.stringify(result, null, 2)}\n\nIMPORTANT: Please verify the sender email address if the email's domain is not in the Sender Authentication settings.`,
          },
        ],
      };
    },
  },
};