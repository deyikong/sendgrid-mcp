import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ContactSchema, ToolResult } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

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
      description: "Create a new email list in your SendGrid account",
      inputSchema: {
        name: z.string().describe("Name of the email list"),
      },
    },
    handler: async ({ name }: { name: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/lists", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  update_email_list: {
    config: {
      title: "Update Email List",
      description: "Update the properties of an existing email list",
      inputSchema: {
        list_id: z.string().describe("ID of the email list to update"),
        name: z.string().describe("New name for the email list"),
      },
    },
    handler: async ({ list_id, name }: { list_id: string; name: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/lists/${list_id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_email_list: {
    config: {
      title: "Delete Email List",
      description: "Delete an existing email list from your SendGrid account",
      inputSchema: {
        list_id: z.string().describe("ID of the email list to delete"),
      },
    },
    handler: async ({ list_id }: { list_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/lists/${list_id}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `List ${list_id} deleted successfully.` }] };
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
      description: "Create new contacts in your SendGrid account",
      inputSchema: {
        contacts: z.array(ContactSchema).describe("Array of contact objects"),
      },
    },
    handler: async ({ contacts }: { contacts: any[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
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
      description: "Create new contacts and assign them to specific email lists",
      inputSchema: {
        contacts: z.array(ContactSchema).describe("Array of contact objects"),
        list_ids: z.array(z.string()).describe("Array of list IDs to add the contact to"),
      },
    },
    handler: async ({ contacts, list_ids }: { contacts: any[]; list_ids: string[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
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
      description: "Create a new custom field for contacts",
      inputSchema: {
        name: z.string().describe("Name of the custom field"),
        field_type: z.enum(["Text", "Number", "Date"]).describe("Type of the field"),
      },
    },
    handler: async ({ name, field_type }: { name: string; field_type: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/field_definitions", {
        method: "POST",
        body: JSON.stringify({ name, field_type }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  update_custom_field: {
    config: {
      title: "Update Custom Field",
      description: "Update an existing custom field definition",
      inputSchema: {
        field_id: z.string().describe("ID of the custom field to update"),
        name: z.string().describe("New name for the custom field"),
      },
    },
    handler: async ({ field_id, name }: { field_id: string; name: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/field_definitions/${field_id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_custom_field: {
    config: {
      title: "Delete Custom Field",
      description: "Delete a custom field definition",
      inputSchema: {
        field_id: z.string().describe("ID of the custom field to delete"),
      },
    },
    handler: async ({ field_id }: { field_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/field_definitions/${field_id}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `Custom field ${field_id} deleted successfully.` }] };
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
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
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

  delete_contact: {
    config: {
      title: "Delete Contact",
      description: "Delete contacts by IDs",
      inputSchema: {
        contact_ids: z.array(z.string()).describe("Array of contact IDs to delete"),
      },
    },
    handler: async ({ contact_ids }: { contact_ids: string[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/contacts?ids=${contact_ids.join(',')}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `${contact_ids.length} contact(s) deleted successfully.\n\n${JSON.stringify(result, null, 2)}` }] };
    },
  },

  remove_contact_from_lists: {
    config: {
      title: "Remove Contacts from a Specific List",
      description: "Remove contacts from a specific email list",
      inputSchema: {
        list_id: z.string().describe("ID of the list to remove contacts from"),
        contact_ids: z.array(z.string()).describe("Array of contact IDs to remove from the list"),
      },
    },
    handler: async ({ list_id, contact_ids }: { list_id: string; contact_ids: string[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/lists/${list_id}/contacts?contact_ids=${contact_ids.join(',')}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_contact: {
    config: {
      title: "Get Contact Details",
      description: "Get detailed information about a specific contact by ID",
      inputSchema: {
        contact_id: z.string().describe("ID of the contact to retrieve"),
      },
    },
    handler: async ({ contact_id }: { contact_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/contacts/${contact_id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  update_contact: {
    config: {
      title: "Update Contact",
      description: "Update existing contact information",
      inputSchema: {
        contacts: z.array(
          z.object({
            id: z.string().describe("Contact ID (required for updates)"),
            email: z.string().email().optional().describe("Email address"),
            first_name: z.string().optional().describe("First name"),
            last_name: z.string().optional().describe("Last name"),
            phone_number: z.string().optional().describe("Phone number"),
            address_line_1: z.string().optional().describe("Address line 1"),
            address_line_2: z.string().optional().describe("Address line 2"),
            city: z.string().optional().describe("City"),
            state_province_region: z.string().optional().describe("State/Province/Region"),
            postal_code: z.string().optional().describe("Postal code"),
            country: z.string().optional().describe("Country"),
            custom_fields: z.record(z.any()).optional().describe("Custom field values"),
          })
        ).describe("Array of contact objects with updates"),
      },
    },
    handler: async ({ contacts }: { contacts: any[] }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        body: JSON.stringify({ contacts }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  search_contacts: {
    config: {
      title: "Search Contacts",
      description: "Search for contacts using query conditions without creating a segment",
      inputSchema: {
        query: z.string().describe("Search query using segment conditions (e.g., 'email LIKE \"@example.com\"')"),
        page_size: z.number().optional().default(50).describe("Number of results to return (max 100)"),
        page_token: z.string().optional().describe("Token for pagination"),
      },
    },
    handler: async ({ query, page_size, page_token }: { query: string; page_size?: number; page_token?: string }): Promise<ToolResult> => {
      const requestBody: any = {
        query: query
      };
      
      if (page_size) requestBody.page_size = page_size;
      if (page_token) requestBody.page_token = page_token;
      
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/contacts/search", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  search_contacts_by_emails: {
    config: {
      title: "Search Contacts by Email Addresses",
      description: "Search for specific contacts by their email addresses",
      inputSchema: {
        emails: z.array(z.string().email()).describe("Array of email addresses to search for"),
      },
    },
    handler: async ({ emails }: { emails: string[] }): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/marketing/contacts/search/emails", {
        method: "POST",
        body: JSON.stringify({ emails }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  list_contacts: {
    config: {
      title: "List All Contacts",
      description: "List all contacts with optional pagination",
      inputSchema: {
        page_size: z.number().optional().default(100).describe("Number of contacts to return (max 1000)"),
        page_token: z.string().optional().describe("Token for pagination"),
      },
    },
    handler: async ({ page_size, page_token }: { page_size?: number; page_token?: string }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/marketing/contacts?page_size=${page_size || 100}`;
      if (page_token) url += `&page_token=${page_token}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_sender: {
    config: {
      title: "Delete Sender Identity",
      description: "Delete a verified sender identity",
      inputSchema: {
        sender_id: z.string().describe("ID of the sender identity to delete"),
      },
    },
    handler: async ({ sender_id }: { sender_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/verified_senders/${sender_id}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `Sender identity ${sender_id} deleted successfully.` }] };
    },
  },

  update_segment: {
    config: {
      title: "Update Segment",
      description: "Update an existing segment's name or query criteria",
      inputSchema: {
        segment_id: z.string().describe("ID of the segment to update"),
        name: z.string().optional().describe("New name for the segment"),
        query_dsl: z.string().optional().describe("New query criteria for the segment (JSON string)"),
      },
    },
    handler: async ({ segment_id, name, query_dsl }: { segment_id: string; name?: string; query_dsl?: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const updateData: any = {};
      if (name) updateData.name = name;
      if (query_dsl) {
        try {
          updateData.query_dsl = JSON.parse(query_dsl);
        } catch (error) {
          return { content: [{ type: "text", text: "Error: query_dsl must be valid JSON. Please provide a properly formatted query." }] };
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return { content: [{ type: "text", text: "Error: Please provide either 'name' or 'query_dsl' to update." }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/segments/2.0/${segment_id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_segment: {
    config: {
      title: "Delete Segment",
      description: "Delete an existing segment",
      inputSchema: {
        segment_id: z.string().describe("ID of the segment to delete"),
      },
    },
    handler: async ({ segment_id }: { segment_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/marketing/segments/2.0/${segment_id}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `Segment ${segment_id} deleted successfully.` }] };
    },
  },
};