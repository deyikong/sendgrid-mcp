import { z } from "zod";

export const helpPrompts = {
  sendgrid_automation_help: {
    config: {
      title: "SendGrid Automation Help",
      description: "Get help with SendGrid marketing automations",
      argsSchema: {
        action: z.string().optional().describe("What you want to do with automations"),
      },
    },
    handler: ({ action }: { action?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid marketing automations${action ? ` specifically: ${action}` : ""}. 

Available automation tools:
- list_automations: View all your marketing automations
- open_automation_creator: Open the SendGrid web interface to create a new automation
- open_automation_editor: Open the editor for a specific automation

Automations in SendGrid are powerful tools for creating drip campaigns, welcome series, abandoned cart emails, and other automated email sequences based on triggers and customer behavior.

How can I help you with your automations?`,
          },
        },
      ],
    }),
  },

  sendgrid_campaign_help: {
    config: {
      title: "SendGrid Campaign Help",
      description: "Get help with SendGrid single send campaigns",
      argsSchema: {
        action: z.string().optional().describe("What you want to do with campaigns"),
      },
    },
    handler: ({ action }: { action?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid single send campaigns${action ? ` specifically: ${action}` : ""}.

Available single send tools:
- list_single_sends: View all your single send campaigns
- open_single_send_creator: Open the SendGrid web interface to create a new campaign
- open_single_send_stats: View statistics for a specific campaign

Single sends are one-time email campaigns sent to your marketing lists. They're perfect for newsletters, announcements, promotions, and other broadcast emails.

How can I help you with your single send campaigns?`,
          },
        },
      ],
    }),
  },

  sendgrid_contacts_help: {
    config: {
      title: "SendGrid Contacts Help",
      description: "Get help with managing SendGrid contacts and lists",
      argsSchema: {
        action: z.string().optional().describe("What you want to do with contacts"),
      },
    },
    handler: ({ action }: { action?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid contacts and lists${action ? ` specifically: ${action}` : ""}.

Available contact management tools:
- list_email_lists: View all your email lists
- create_email_list: Create a new email list
- list_segments: View segments and their parent list relationships
- open_segment_creator: Open the web interface to create segments
- create_contact: Add new contacts (automatically added to global list)
- create_contact_with_lists: Add contacts to specific lists
- open_csv_uploader: Upload contacts via CSV file
- list_custom_fields: View custom field definitions
- create_custom_field: Create new custom fields (Text, Number, or Date)

Lists are collections of contacts, while segments are filtered subsets of lists based on criteria you define. Custom fields let you store additional contact information beyond email, first name, and last name.

How can I help you with your contact management?`,
          },
        },
      ],
    }),
  },

  sendgrid_suppressions_help: {
    config: {
      title: "SendGrid Suppressions Help",
      description: "Get help with managing SendGrid suppression lists",
      argsSchema: {
        type: z.string().optional().describe("Type of suppression list you're interested in"),
      },
    },
    handler: ({ type }: { type?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid suppression lists${type ? ` specifically: ${type}` : ""}.

Available suppression management tools:
- list_global_unsubscribes: View globally unsubscribed email addresses
- list_group_unsubscribes: View group-specific unsubscribes
- list_bounces: View bounced email addresses (hard/soft bounces)
- list_spam_reports: View emails marked as spam
- list_blocks: View blocked email addresses
- list_invalid_emails: View invalid email addresses
- list_unsubscribe_groups: View all unsubscribe groups
- create_unsubscribe_group: Create new unsubscribe groups
- edit_unsubscribe_group: Modify existing groups
- delete_unsubscribe_group: Remove unsubscribe groups
- add_contact_to_unsubscribe_group: Add emails to specific groups

Suppression lists help maintain good sender reputation by preventing emails to addresses that have bounced, unsubscribed, or marked your emails as spam.

How can I help you with suppression list management?`,
          },
        },
      ],
    }),
  },

  sendgrid_settings_help: {
    config: {
      title: "SendGrid Settings Help",
      description: "Get help with SendGrid account settings and configuration",
      argsSchema: {
        setting_type: z.string().optional().describe("Type of setting you want to configure"),
      },
    },
    handler: ({ setting_type }: { setting_type?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid account settings${setting_type ? ` specifically: ${setting_type}` : ""}.

Available settings management tools:

Account Management:
- get_account_details: View account profile information
- edit_account_details: Update account profile
- list_timezones: View available timezones
- edit_timezone: Change account timezone

Sender Management:
- list_senders: View verified sender identities
- create_sender: Create new sender (requires email verification)
- list_email_notifications: View notification settings
- create_email_notification: Add notification email addresses

Security & Access:
- list_api_keys: View API keys
- create_api_key: Create new API keys with specific permissions
- edit_api_key: Update API key permissions
- delete_api_key: Remove API keys
- get_scopes: View available permission scopes

Team Management:
- list_subusers: View subuser accounts
- create_subuser: Create new subuser
- get_subuser: View subuser details
- update_subuser: Modify subuser settings
- delete_subuser: Remove subuser
- list_teammates: View teammate invitations
- create_teammate: Invite new teammate

Monitoring:
- list_alert_settings: View alert configurations
- create_alert_setting: Set up usage/stats alerts
- edit_alert_setting: Modify alerts
- delete_alert_setting: Remove alerts

How can I help you with your account settings?`,
          },
        },
      ],
    }),
  },

  sendgrid_mail_send_help: {
    config: {
      title: "SendGrid Mail Send Help",
      description: "Get help with sending emails through SendGrid",
      argsSchema: {
        email_type: z.string().optional().describe("Type of email you want to send"),
      },
    },
    handler: ({ email_type }: { email_type?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with sending emails through SendGrid${email_type ? ` specifically: ${email_type}` : ""}.

Available email sending tools:
- send_mail: Send transactional emails using the Mail Send API

The send_mail tool supports:
- Multiple recipients with personalization
- HTML and plain text content
- Attachments and embedded images
- Custom headers and tracking settings
- Template usage with substitutions
- CC, BCC, and reply-to settings

Required fields:
- personalizations: Array with recipient details (to, subject, substitutions)
- from: Sender email and name (must be verified)
- content: Array with email content (HTML/text)

Optional fields:
- reply_to: Reply-to address
- attachments: File attachments
- template_id: Use pre-built templates
- categories: For tracking and organization

Example usage:
send_mail with personalizations=[{to:[{email:"user@example.com"}], subject:"Hello"}], from={email:"sender@verified.com", name:"Your Name"}, content=[{type:"text/plain", value:"Hello world!"}]

Note: For marketing campaigns, use the single send tools instead of send_mail.

How can I help you with sending emails?`,
          },
        },
      ],
    }),
  },
};