import { z } from "zod";
import { makeRequest } from "../shared/api.js";
import { EmailAddressSchema, ToolResult } from "../shared/types.js";

export const mailTools = {
  send_mail: {
    config: {
      title: "Send Mail",
      description: "Send an email using SendGrid Mail Send API",
      inputSchema: {
        personalizations: z.array(z.object({
          to: z.array(EmailAddressSchema),
          cc: z.array(EmailAddressSchema).optional(),
          bcc: z.array(EmailAddressSchema).optional(),
          subject: z.string().optional(),
          substitutions: z.record(z.any()).optional(),
        })).describe("Personalization settings for recipients"),
        from: EmailAddressSchema,
        subject: z.string().optional().describe("Default subject if not set in personalizations"),
        content: z.array(z.object({
          type: z.string().describe("Content type (text/plain, text/html)"),
          value: z.string().describe("Content body"),
        })).describe("Email content"),
        reply_to: EmailAddressSchema.optional(),
      },
    },
    handler: async (mailData: any): Promise<ToolResult> => {
      const result = await makeRequest("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        body: JSON.stringify(mailData),
      });
      return { content: [{ type: "text", text: `Email sent successfully. Response: ${JSON.stringify(result, null, 2)}` }] };
    },
  },
};