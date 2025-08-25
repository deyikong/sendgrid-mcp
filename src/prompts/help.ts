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

Contact CRUD Operations:
- list_contacts: List all contacts with pagination
- get_contact: Get detailed information about a specific contact
- create_contact: Create new contacts
- update_contact: Update existing contact information
- delete_contact: Delete contacts permanently
- search_contacts: Search for contacts using query conditions
- search_contacts_by_emails: Search for specific contacts by email addresses

List Management:
- list_email_lists: View all your email lists
- create_email_list: Create a new email list
- update_email_list: Update email list properties
- delete_email_list: Delete an email list
- create_contact_with_lists: Create contacts and assign to lists
- remove_contact_from_lists: Remove contacts from a specific list

Segments & Custom Fields:
- list_segments: View segments with parent relationships
- open_segment_creator: Open segment creator in browser
- list_custom_fields: List custom field definitions
- create_custom_field: Create new custom fields
- update_custom_field: Update existing custom field definitions
- delete_custom_field: Delete custom field definitions

Senders & Import:
- list_senders: List verified sender identities
- create_sender: Create new sender identity
- delete_sender: Delete a verified sender identity
- open_csv_uploader: Open CSV upload interface

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

  sendgrid_list_management_help: {
    config: {
      title: "SendGrid List Management Help",
      description: "Get help with managing SendGrid email lists",
      argsSchema: {
        operation: z.string().optional().describe("What you want to do with email lists"),
      },
    },
    handler: ({ operation }: { operation?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid email list management${operation ? ` specifically: ${operation}` : ""}.

Available list management tools:

Creating & Managing Lists:
- create_email_list: Create a new email list for organizing contacts
- list_email_lists: View all your existing email lists
- update_email_list: Update email list properties (like name)
- delete_email_list: Delete an email list (this will remove the list but not the contacts)

Managing List Membership:
- create_contact_with_lists: Create new contacts and add them to specific lists
- remove_contact_from_lists: Remove contacts from a specific list (contacts remain in your account)

Key concepts:
- Email lists are collections of contacts used for organizing your audience
- Contacts can belong to multiple lists simultaneously
- Deleting a list doesn't delete the contacts themselves
- Lists are used for targeting in campaigns and automations
- You can create lists based on different criteria (customers, prospects, etc.)

Best practices:
- Use descriptive names for your lists (e.g., "Newsletter Subscribers", "VIP Customers")
- Regularly clean up unused lists to keep your account organized
- Consider using segments for dynamic filtering rather than static lists

How can I help you with your email list management?`,
          },
        },
      ],
    }),
  },

  sendgrid_contact_crud_help: {
    config: {
      title: "SendGrid Contact CRUD Help", 
      description: "Get help with creating, reading, updating, and deleting contacts",
      argsSchema: {
        operation: z.string().optional().describe("What contact operation you want to perform"),
      },
    },
    handler: ({ operation }: { operation?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid contact CRUD operations${operation ? ` specifically: ${operation}` : ""}.

Available contact CRUD tools:

Creating Contacts:
- create_contact: Create new contacts (added to global contact list)
- create_contact_with_lists: Create contacts and assign them to specific lists

Reading Contacts:
- list_contacts: List all contacts with pagination support
- get_contact: Get detailed information about a specific contact by ID
- search_contacts: Search for contacts using query conditions
- search_contacts_by_emails: Search for specific contacts by their email addresses

Updating Contacts:
- update_contact: Update existing contact information (email, name, custom fields, etc.)

Deleting Contacts:
- delete_contact: Delete contacts permanently (removes from all lists)
- remove_contact_from_lists: Remove contacts from specific lists (keeps contacts in account)

Key concepts:
- All contacts are stored in a global contact database
- Contacts can be assigned to multiple lists
- Custom fields can store additional contact information
- Contact IDs are unique identifiers for each contact
- Email addresses must be unique across your account

Tips:
- Use search_contacts_by_emails for quick lookups by email
- Update operations require the contact ID
- Always backup important contact data before bulk deletions
- Use custom fields for additional contact attributes

How can I help you with contact management?`,
          },
        },
      ],
    }),
  },

  sendgrid_sender_management_help: {
    config: {
      title: "SendGrid Sender Management Help",
      description: "Get help with managing SendGrid sender identities",
      argsSchema: {
        task: z.string().optional().describe("What you want to do with sender identities"),
      },
    },
    handler: ({ task }: { task?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid sender identity management${task ? ` specifically: ${task}` : ""}.

Available sender management tools:
- list_senders: View all your verified sender identities
- create_sender: Create a new sender identity
- delete_sender: Delete a verified sender identity

What are sender identities?
Sender identities are verified email addresses and associated information (name, physical address) that you can use as the "from" address when sending emails through SendGrid.

Creating a sender identity requires:
- nickname: A friendly name for this sender
- from: Object with email and name
- reply_to: Object with reply-to email and name  
- address: Physical street address
- city: City name
- state: State/province
- zip: Postal code
- country: Country name

Important notes:
- Email domains must be verified before you can send from them
- Physical address is required for CAN-SPAM compliance
- You'll receive a verification email that must be confirmed
- Only verified senders can be used with the send_mail tool
- Sender identities help establish trust and deliverability

Best practices:
- Use business email addresses, not personal ones
- Keep sender information accurate and up-to-date
- Use recognizable "from" names that recipients will trust
- Set up proper reply-to addresses for customer responses

How can I help you with sender identity management?`,
          },
        },
      ],
    }),
  },

  sendgrid_custom_fields_help: {
    config: {
      title: "SendGrid Custom Fields Help",
      description: "Get help with managing SendGrid custom field definitions",
      argsSchema: {
        operation: z.string().optional().describe("What you want to do with custom fields"),
      },
    },
    handler: ({ operation }: { operation?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid custom field management${operation ? ` specifically: ${operation}` : ""}.

Available custom field management tools:

Creating & Managing Custom Fields:
- list_custom_fields: View all your custom field definitions
- create_custom_field: Create a new custom field (Text, Number, or Date type)
- update_custom_field: Update an existing custom field definition (change name)
- delete_custom_field: Delete a custom field definition

What are custom fields?
Custom fields allow you to store additional contact information beyond the standard fields (email, first_name, last_name). You can create up to 500 custom fields per account.

Available field types:
- Text: For storing text values (names, descriptions, etc.)
- Number: For storing numeric values (age, purchase amounts, etc.)
- Date: For storing date values (birthdays, subscription dates, etc.)

Key concepts:
- Each custom field has a unique ID and name
- Field names are case-insensitive and must be unique
- Custom field names cannot conflict with reserved field names
- Fields can be used in contact records, segments, and campaigns
- Deleting a field removes it from all contacts that have that field

Important notes:
- Save the field ID when creating fields for future updates/deletions
- You cannot change a field's type after creation
- Reserved fields (like email, first_name) cannot be deleted
- Custom field data is lost when a field is deleted

Best practices:
- Use descriptive names for your custom fields
- Plan your field structure before creating many contacts
- Consider using segments for filtering rather than many custom fields
- Regularly audit and clean up unused custom fields

Example field names:
- "customer_tier" (Text): "Gold", "Silver", "Bronze"
- "purchase_count" (Number): 5, 12, 0
- "last_purchase_date" (Date): "2023-12-15"

How can I help you with custom field management?`,
          },
        },
      ],
    }),
  },

  sendgrid_update_list_help: {
    config: {
      title: "SendGrid Update Email List Help",
      description: "Get help with updating, renaming, or modifying SendGrid email lists",
      argsSchema: {
        action: z.string().optional().describe("What you want to update about the list"),
      },
    },
    handler: ({ action }: { action?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with updating SendGrid email lists${action ? ` specifically: ${action}` : ""}.

Key tool for updating lists:
- update_email_list: Update email list properties like the name

To rename or update an email list:
1. First, get the list ID using list_email_lists to see all your lists
2. Use update_email_list with the list_id and new name

Example workflow:
1. Run list_email_lists to find your list
2. Note the "id" field of the list you want to rename
3. Use update_email_list with: list_id="your_list_id_here", name="New List Name"

Important notes:
- You need the exact list ID (not just the name) to update a list
- Currently, you can only update the list name - other properties aren't editable
- The list ID remains the same after renaming
- Contacts in the list are not affected by renaming
- List updates take effect immediately

Related tools that might be helpful:
- list_email_lists: View all your lists to find the one you want to update
- create_email_list: Create a new list if needed
- delete_email_list: Delete a list if you want to remove it entirely

Need to rename a list? I can help you find the list ID and update it with a new name!`,
          },
        },
      ],
    }),
  },

  sendgrid_segment_management_help: {
    config: {
      title: "SendGrid Segment Management Help",
      description: "Get help with managing SendGrid segments - creating, updating, and deleting dynamic contact segments",
      argsSchema: {
        operation: z.string().optional().describe("What you want to do with segments"),
      },
    },
    handler: ({ operation }: { operation?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid segment management${operation ? ` specifically: ${operation}` : ""}.

Available segment management tools:

Viewing Segments:
- list_segments: View all your segments with their parent list relationships

Updating Segments:
- update_segment: Update an existing segment's name or query criteria

Deleting Segments:
- delete_segment: Delete an existing segment

Creating Segments:
- open_segment_creator: Open the SendGrid web interface to create new segments

What are segments?
Segments are dynamic, filtered subsets of your contacts based on criteria you define. Unlike static lists, segments automatically update as contacts meet or no longer meet the specified criteria.

To update a segment:
1. Use list_segments to find the segment you want to modify
2. Note the segment ID from the results
3. Use update_segment with:
   - segment_id: The ID of the segment to update
   - name: (optional) New name for the segment
   - query_dsl: (optional) New query criteria as JSON string

To delete a segment:
1. Use list_segments to find the segment you want to delete
2. Use delete_segment with the segment_id

Important notes:
- Segments update approximately once per hour based on contact changes
- Deleting a segment doesn't delete the contacts themselves
- Query DSL must be valid JSON format for segment criteria
- Segment counts and samples refresh hourly, not immediately
- You need the exact segment ID (not name) for updates/deletions

Query DSL examples:
- Email domain filter: {"query_dsl": {"and": [{"field": "email", "value": "@example.com", "operator": "like"}]}}
- Custom field filter: {"query_dsl": {"and": [{"field": "custom_field_name", "value": "VIP", "operator": "eq"}]}}

Best practices:
- Use descriptive names for your segments
- Test query criteria before applying to large contact bases
- Regular cleanup of unused segments keeps your account organized
- Consider using segments instead of static lists for dynamic filtering

How can I help you with segment management?`,
          },
        },
      ],
    }),
  },

  sendgrid_stats_help: {
    config: {
      title: "SendGrid Email Statistics Help",
      description: "Get help with analyzing SendGrid email performance and statistics across multiple dimensions",
      argsSchema: {
        metric_type: z.string().optional().describe("What type of statistics you want to analyze"),
      },
    },
    handler: ({ metric_type }: { metric_type?: string }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with SendGrid email statistics${metric_type ? ` specifically: ${metric_type}` : ""}.

Available statistics tools:

Global Statistics:
- get_global_stats: Retrieve overall email performance metrics
- get_stats_overview: Get comprehensive statistics across multiple dimensions

Performance by Technology:
- get_stats_by_browser: Statistics broken down by browser (Chrome, Firefox, Safari, etc.)
- get_stats_by_client_type: Statistics by email client type (desktop, mobile, webmail)
- get_stats_by_device_type: Statistics by device type (desktop, mobile, tablet)
- get_stats_by_mailbox_provider: Statistics by provider (Gmail, Outlook, Yahoo, etc.)

Geographic Analysis:
- get_stats_by_country: Statistics broken down by country and state/province

Advanced Segmentation:
- get_category_stats: Statistics for specific email categories (13 months history)
- get_subuser_stats: Statistics for specific subusers

Key Parameters:
- start_date: Required, format YYYY-MM-DD
- end_date: Optional, defaults to today
- aggregated_by: day/week/month (default: day)

Common metrics included:
- delivered: Successfully delivered emails
- opens: Email open events
- clicks: Link click events  
- bounces: Hard and soft bounces
- spam_reports: Emails marked as spam
- unsubscribes: Unsubscribe requests
- blocks: Emails blocked by recipient servers

Example workflows:

1. Weekly Performance Review:
   - get_global_stats with last 7 days
   - get_stats_by_mailbox_provider to identify provider issues
   - get_stats_by_device_type for mobile optimization insights

2. Geographic Campaign Analysis:
   - get_stats_by_country to see regional performance
   - Compare engagement rates across different markets

3. Technical Performance Audit:
   - get_stats_by_browser to identify rendering issues
   - get_stats_by_client_type for client-specific problems

4. Comprehensive Report:
   - get_stats_overview for all metrics in one call
   - Includes global, browser, geographic, and provider breakdowns

Important notes:
- Category statistics limited to previous 13 months
- Statistics update regularly but may have slight delays
- Use date ranges wisely to avoid large data sets
- Aggregate by week/month for longer time periods

Resources available:
- sendgrid://stats: 30-day overview with multiple breakdowns
- sendgrid://stats/browsers: 7-day browser performance
- sendgrid://stats/devices: 7-day device performance
- sendgrid://stats/geography: 7-day geographic performance
- sendgrid://stats/providers: 7-day mailbox provider performance

Best practices:
- Start with get_global_stats for overall trends
- Use specific breakdowns to identify issues
- Compare metrics over time to spot patterns
- Focus on actionable metrics like open/click rates
- Monitor bounce rates and spam reports closely

How can I help you analyze your email performance?`,
          },
        },
      ],
    }),
  },
};