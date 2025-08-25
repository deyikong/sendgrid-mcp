import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { ToolResult } from "../shared/types.js";
import { checkReadOnlyMode } from "../shared/env.js";

export const templateTools = {
  list_templates: {
    config: {
      title: "List All Templates",
      description: "Retrieve all transactional templates (legacy and dynamic)",
      inputSchema: {
        generations: z.string().optional().describe("Filter by template generation (legacy or dynamic)"),
        page_size: z.number().optional().default(50).describe("Number of templates to return (max 200)"),
      },
    },
    handler: async ({ generations, page_size }: { generations?: string; page_size?: number }): Promise<ToolResult> => {
      let url = `https://api.sendgrid.com/v3/templates?page_size=${page_size || 50}`;
      if (generations) url += `&generations=${generations}`;
      
      const result = await makeRequest(url);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  get_template: {
    config: {
      title: "Get Template Details",
      description: "Retrieve details of a specific template including all versions",
      inputSchema: {
        template_id: z.string().describe("ID of the template to retrieve"),
      },
    },
    handler: async ({ template_id }: { template_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  create_template: {
    config: {
      title: "Create New Template",
      description: "Create a new dynamic transactional template",
      inputSchema: {
        name: z.string().describe("Name of the template"),
        generation: z.enum(["legacy", "dynamic"]).optional().default("dynamic").describe("Template generation type"),
      },
    },
    handler: async ({ name, generation }: { name: string; generation?: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest("https://api.sendgrid.com/v3/templates", {
        method: "POST",
        body: JSON.stringify({
          name,
          generation: generation || "dynamic"
        }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  update_template: {
    config: {
      title: "Update Template",
      description: "Update the name of an existing template",
      inputSchema: {
        template_id: z.string().describe("ID of the template to update"),
        name: z.string().describe("New name for the template"),
      },
    },
    handler: async ({ template_id, name }: { template_id: string; name: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_template: {
    config: {
      title: "Delete Template",
      description: "Delete a template and all its versions",
      inputSchema: {
        template_id: z.string().describe("ID of the template to delete"),
      },
    },
    handler: async ({ template_id }: { template_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `Template ${template_id} deleted successfully.` }] };
    },
  },

  create_template_version: {
    config: {
      title: "Create Template Version",
      description: "Create a new version of a template with HTML content and settings",
      inputSchema: {
        template_id: z.string().describe("ID of the template to add version to"),
        name: z.string().describe("Name for this version"),
        subject: z.string().describe("Email subject line (supports Handlebars)"),
        html_content: z.string().describe("HTML content of the email template (supports Handlebars)"),
        plain_content: z.string().optional().describe("Plain text version (optional)"),
        active: z.number().optional().default(1).describe("Set as active version (1 = active, 0 = inactive)"),
        generate_plain_content: z.boolean().optional().default(true).describe("Auto-generate plain text from HTML"),
        test_data: z.string().optional().describe("JSON string of test data for Handlebars variables"),
      },
    },
    handler: async ({ 
      template_id, 
      name, 
      subject, 
      html_content, 
      plain_content, 
      active, 
      generate_plain_content, 
      test_data 
    }: { 
      template_id: string; 
      name: string; 
      subject: string; 
      html_content: string; 
      plain_content?: string; 
      active?: number; 
      generate_plain_content?: boolean; 
      test_data?: string; 
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const versionData: any = {
        name,
        subject,
        html_content,
        active: active ?? 1,
        generate_plain_content: generate_plain_content ?? true,
      };
      
      if (plain_content) {
        versionData.plain_content = plain_content;
      }
      
      if (test_data) {
        try {
          versionData.test_data = JSON.parse(test_data);
        } catch (error) {
          return { content: [{ type: "text", text: "Error: test_data must be valid JSON" }] };
        }
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}/versions`, {
        method: "POST",
        body: JSON.stringify(versionData),
      });
      
      return { 
        content: [{ 
          type: "text", 
          text: `Template version created successfully!\n\n${JSON.stringify(result, null, 2)}\n\nYou can now use this template with the Mail API using template_id: ${template_id}` 
        }] 
      };
    },
  },

  get_template_version: {
    config: {
      title: "Get Template Version",
      description: "Retrieve details of a specific template version",
      inputSchema: {
        template_id: z.string().describe("ID of the template"),
        version_id: z.string().describe("ID of the version to retrieve"),
      },
    },
    handler: async ({ template_id, version_id }: { template_id: string; version_id: string }): Promise<ToolResult> => {
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}/versions/${version_id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  update_template_version: {
    config: {
      title: "Update Template Version",
      description: "Update the content and settings of a template version",
      inputSchema: {
        template_id: z.string().describe("ID of the template"),
        version_id: z.string().describe("ID of the version to update"),
        name: z.string().optional().describe("New name for this version"),
        subject: z.string().optional().describe("Email subject line (supports Handlebars)"),
        html_content: z.string().optional().describe("HTML content of the email template"),
        plain_content: z.string().optional().describe("Plain text version"),
        active: z.number().optional().describe("Set as active version (1 = active, 0 = inactive)"),
        generate_plain_content: z.boolean().optional().describe("Auto-generate plain text from HTML"),
        test_data: z.string().optional().describe("JSON string of test data for Handlebars variables"),
      },
    },
    handler: async ({ 
      template_id, 
      version_id, 
      name, 
      subject, 
      html_content, 
      plain_content, 
      active, 
      generate_plain_content, 
      test_data 
    }: { 
      template_id: string; 
      version_id: string; 
      name?: string; 
      subject?: string; 
      html_content?: string; 
      plain_content?: string; 
      active?: number; 
      generate_plain_content?: boolean; 
      test_data?: string; 
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const versionData: any = {};
      
      if (name !== undefined) versionData.name = name;
      if (subject !== undefined) versionData.subject = subject;
      if (html_content !== undefined) versionData.html_content = html_content;
      if (plain_content !== undefined) versionData.plain_content = plain_content;
      if (active !== undefined) versionData.active = active;
      if (generate_plain_content !== undefined) versionData.generate_plain_content = generate_plain_content;
      
      if (test_data) {
        try {
          versionData.test_data = JSON.parse(test_data);
        } catch (error) {
          return { content: [{ type: "text", text: "Error: test_data must be valid JSON" }] };
        }
      }
      
      if (Object.keys(versionData).length === 0) {
        return { content: [{ type: "text", text: "Error: Please provide at least one field to update" }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}/versions/${version_id}`, {
        method: "PATCH",
        body: JSON.stringify(versionData),
      });
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  },

  delete_template_version: {
    config: {
      title: "Delete Template Version",
      description: "Delete a specific version of a template",
      inputSchema: {
        template_id: z.string().describe("ID of the template"),
        version_id: z.string().describe("ID of the version to delete"),
      },
    },
    handler: async ({ template_id, version_id }: { template_id: string; version_id: string }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      const result = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}/versions/${version_id}`, {
        method: "DELETE",
      });
      return { content: [{ type: "text", text: `Template version ${version_id} deleted successfully.` }] };
    },
  },

  create_html_template: {
    config: {
      title: "Create Complete HTML Template",
      description: "Create a new template with HTML content in one step - perfect for AI-generated designs",
      inputSchema: {
        template_name: z.string().describe("Name of the template"),
        version_name: z.string().describe("Name for the initial version"),
        subject: z.string().describe("Email subject line (supports Handlebars like {{firstName}})"),
        html_content: z.string().describe("Complete HTML email template (supports Handlebars)"),
        plain_content: z.string().optional().describe("Plain text version (will auto-generate if not provided)"),
        test_data: z.string().optional().describe("JSON string with test data for preview (e.g., '{\"firstName\":\"John\",\"company\":\"Acme\"}')")
      },
    },
    handler: async ({ 
      template_name, 
      version_name, 
      subject, 
      html_content, 
      plain_content,
      test_data 
    }: { 
      template_name: string; 
      version_name: string; 
      subject: string; 
      html_content: string; 
      plain_content?: string;
      test_data?: string;
    }): Promise<ToolResult> => {
      const readOnlyCheck = checkReadOnlyMode();
      if (readOnlyCheck.blocked) {
        return { content: [{ type: "text", text: readOnlyCheck.message! }] };
      }
      
      try {
        // Step 1: Create the template
        const template = await makeRequest("https://api.sendgrid.com/v3/templates", {
          method: "POST",
          body: JSON.stringify({
            name: template_name,
            generation: "dynamic"
          }),
        });
        
        const template_id = template.id;
        
        // Step 2: Create the version with HTML content
        const versionData: any = {
          name: version_name,
          subject: subject,
          html_content: html_content,
          active: 1,
          generate_plain_content: !plain_content, // Auto-generate if no plain content provided
        };
        
        if (plain_content) {
          versionData.plain_content = plain_content;
        }
        
        if (test_data) {
          try {
            versionData.test_data = JSON.parse(test_data);
          } catch (error) {
            // Delete the template we just created since version failed
            await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}`, {
              method: "DELETE",
            });
            return { content: [{ type: "text", text: "Error: test_data must be valid JSON. Template creation cancelled." }] };
          }
        }
        
        const version = await makeRequest(`https://api.sendgrid.com/v3/templates/${template_id}/versions`, {
          method: "POST",
          body: JSON.stringify(versionData),
        });
        
        return { 
          content: [{ 
            type: "text", 
            text: `✅ HTML Template created successfully!

📧 Template Details:
- Template ID: ${template_id}
- Template Name: ${template_name}
- Version ID: ${version.id}
- Version Name: ${version_name}
- Subject: ${subject}
- Status: Active and ready to use

🚀 Usage:
You can now send emails using this template with the Mail API:
- Use template_id: "${template_id}"
- Include dynamic_template_data with your Handlebars variables

🔗 Quick Actions:
- View in SendGrid UI: https://mc.sendgrid.com/dynamic-templates/${template_id}
- Test the template with sample data in the SendGrid editor

${JSON.stringify({ template, version }, null, 2)}` 
          }] 
        };
      } catch (error: any) {
        return { 
          content: [{ 
            type: "text", 
            text: `❌ Error creating template: ${error.message || 'Unknown error occurred'}` 
          }] 
        };
      }
    },
  },

  open_template_editor: {
    config: {
      title: "Open Template Editor",
      description: "Open the SendGrid template editor in browser for visual editing",
      inputSchema: {
        template_id: z.string().optional().describe("Template ID to open (opens template list if not provided)"),
      },
    },
    handler: async ({ template_id }: { template_id?: string }): Promise<ToolResult> => {
      const url = template_id 
        ? `https://mc.sendgrid.com/dynamic-templates/${template_id}`
        : "https://mc.sendgrid.com/dynamic-templates";
      
      return {
        content: [
          {
            type: "text",
            text: `Open this URL in your browser to access the SendGrid template editor:\n${url}\n\n${template_id ? `This will open the editor for template ID: ${template_id}` : 'This will open the template management page where you can create and edit templates visually.'}`,
          },
        ],
      };
    },
  },
};