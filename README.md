# SendGrid MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to SendGrid's API v3 for email marketing and transactional email operations.

## Features

- **Marketing Automations**: Create and manage email automation workflows
- **Single Send Campaigns**: Manage one-time email campaigns
- **Contact Management**: Handle email lists, segments, and contacts
- **Mail Sending**: Send transactional emails via SendGrid
- **Suppression Lists**: Manage bounces, spam reports, and unsubscribes
- **Account Settings**: Access account details and configuration
- **Browser Integration**: Quick links to SendGrid web interface

## Quick Start

### 1. Installation

```bash
git clone <repository-url>
cd sendgrid-mcp
npm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your SendGrid API key
nano .env
```

### 3. Get SendGrid API Key

1. Go to [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
2. Click "Create API Key"
3. Choose "Full Access" or select specific permissions
4. Copy the generated key (starts with `SG.`)

### 4. Configure Environment

Edit `.env` file:

```bash
# Required: Your SendGrid API key
SENDGRID_API_KEY=SG.your_actual_api_key_here

# Optional: Server configuration
MCP_SERVER_NAME=sendgrid-mcp
MCP_SERVER_VERSION=1.0.0
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
```

### 5. Build and Run

```bash
# Build the server
npm run build

# Run the server
./build/index.js
```

## MCP Integration

### Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sendgrid": {
      "command": "node",
      "args": ["/path/to/sendgrid-mcp/build/index.js"],
      "env": {
        "SENDGRID_API_KEY": "SG.your_api_key_here",
        "READ_ONLY": "true"
      }
    }
  }
}
```

### Other MCP-Compatible AI Agents

For other AI agents that support MCP, use these connection details:

```bash
# Direct execution
node /path/to/sendgrid-mcp/build/index.js

# With environment variables
SENDGRID_API_KEY="SG.your_api_key_here" READ_ONLY="true" node /path/to/sendgrid-mcp/build/index.js
```

### Cline (VS Code Extension)

Add to your Cline MCP configuration:

```json
{
  "mcpServers": {
    "sendgrid": {
      "command": "node",
      "args": ["/path/to/sendgrid-mcp/build/index.js"],
      "env": {
        "SENDGRID_API_KEY": "SG.your_api_key_here",
        "READ_ONLY": "true"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/path/to/sendgrid-mcp/` with the actual absolute path to your project
- Replace `SG.your_api_key_here` with your actual SendGrid API key
- Restart Claude Desktop or your AI agent after updating the configuration
- Ensure the server builds successfully with `npm run build` before configuring

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SENDGRID_API_KEY` | ✅ | Your SendGrid API key (starts with SG.) | - |
| `MCP_SERVER_NAME` | ❌ | Server name for identification | `sendgrid-mcp` |
| `MCP_SERVER_VERSION` | ❌ | Server version | `1.0.0` |
| `LOG_LEVEL` | ❌ | Logging level (debug, info, warn, error) | `info` |
| `REQUEST_TIMEOUT` | ❌ | API request timeout in milliseconds | `30000` |
| `READ_ONLY` | ❌ | Enable read-only mode (true/false) | `true` |

## Read-Only Mode

By default, the SendGrid MCP server runs in **read-only mode** (`READ_ONLY=true`) for safety. All tools are registered and available, but mutable operations are blocked at runtime with helpful error messages.

### How Read-Only Mode Works

When `READ_ONLY=true` (default):
- **All tools are registered** and visible to the AI assistant
- **Non-mutating operations** work normally (list, get, search, open browser links)
- **Mutating operations** are blocked with a clear error message: 
  ```
  ❌ Operation blocked: Server is running in READ_ONLY mode. Set READ_ONLY=false in your environment to enable write operations.
  ```

### Read-Only Safe Operations

These operations work normally when `READ_ONLY=true`:

**Contact Operations:**
- `list_contacts`, `get_contact`, `search_contacts`, `search_contacts_by_emails`

**List Operations:**  
- `list_email_lists`, `list_segments`

**Field Operations:**
- `list_custom_fields`

**Sender Operations:**
- `list_senders`

**Campaign & Automation Operations:**
- `list_automations`, `list_single_sends`
- `open_automation_creator`, `open_automation_editor`
- `open_single_send_creator`, `open_single_send_stats`

**Utility Operations:**
- `get_scopes`, `open_segment_creator`, `open_csv_uploader`

### Blocked Operations in Read-Only Mode

These operations are blocked when `READ_ONLY=true`:
- `create_contact`, `update_contact`, `delete_contact`
- `create_contact_with_lists`, `remove_contact_from_lists`
- `create_email_list`, `update_email_list`, `delete_email_list`
- `create_custom_field`, `update_custom_field`, `delete_custom_field`
- `create_sender`, `delete_sender`
- `update_segment`, `delete_segment`
- `send_mail`

### Full Access Mode

To enable **create, update, delete, and send operations**, set `READ_ONLY=false` in your `.env` file:

```bash
READ_ONLY=false
```

This will allow all mutating operations to execute normally while maintaining all read operations.

**⚠️ Security Note:** Only disable read-only mode if you need write access and trust the environment where the server is running.

## Available Tools

### Marketing Automations
- `list_automations` - List all marketing automations
- `open_automation_creator` - Open automation creator in browser
- `open_automation_editor` - Open specific automation editor

### Single Send Campaigns
- `list_single_sends` - List all single send campaigns
- `open_single_send_creator` - Open campaign creator in browser
- `open_single_send_stats` - View campaign statistics

### Contact Management

#### Contact CRUD Operations
- `list_contacts` - List all contacts with pagination
- `get_contact` - Get detailed information about a specific contact
- `create_contact` - Create new contacts
- `update_contact` - Update existing contact information
- `delete_contact` - Delete contacts permanently
- `search_contacts` - Search for contacts using query conditions
- `search_contacts_by_emails` - Search for specific contacts by email addresses

#### List Management
- `list_email_lists` - List all email lists
- `create_email_list` - Create a new email list
- `update_email_list` - Update email list properties
- `delete_email_list` - Delete an email list
- `create_contact_with_lists` - Create contacts and assign to lists
- `remove_contact_from_lists` - Remove contacts from a specific list

#### Segments & Custom Fields
- `list_segments` - List segments with parent relationships
- `open_segment_creator` - Open segment creator in browser
- `update_segment` - Update existing segment name or query criteria
- `delete_segment` - Delete an existing segment
- `list_custom_fields` - List custom field definitions
- `create_custom_field` - Create new custom fields
- `update_custom_field` - Update existing custom field definitions
- `delete_custom_field` - Delete custom field definitions

#### Senders & Import
- `list_senders` - List verified sender identities
- `create_sender` - Create new sender identity
- `delete_sender` - Delete a verified sender identity
- `open_csv_uploader` - Open CSV upload interface

### Mail Sending
- `send_mail` - Send transactional emails
- `get_scopes` - Get available API permission scopes

### Email Statistics
- `get_global_stats` - Retrieve overall email performance metrics
- `get_stats_overview` - Get comprehensive statistics across multiple dimensions
- `get_stats_by_browser` - Statistics broken down by browser type
- `get_stats_by_client_type` - Statistics by email client type
- `get_stats_by_device_type` - Statistics by device type
- `get_stats_by_country` - Statistics by country and state/province
- `get_stats_by_mailbox_provider` - Statistics by mailbox provider
- `get_category_stats` - Statistics for specific email categories
- `get_subuser_stats` - Statistics for specific subusers

## Available Resources

- `sendgrid://automations` - Marketing automations data
- `sendgrid://singlesends` - Single send campaigns data
- `sendgrid://lists` - Email lists data
- `sendgrid://contacts` - Contact segments data
- `sendgrid://suppressions` - Suppression lists (bounces, spam, etc.)
- `sendgrid://account` - Account profile information
- `sendgrid://stats` - Global email statistics and performance metrics (30-day overview)
- `sendgrid://stats/browsers` - Email statistics by browser type (7-day data)
- `sendgrid://stats/devices` - Email statistics by device type (7-day data)
- `sendgrid://stats/geography` - Email statistics by geographic location (7-day data)
- `sendgrid://stats/providers` - Email statistics by mailbox provider (7-day data)

## Available Prompts

- `sendgrid_automation_help` - Get help with marketing automations
- `sendgrid_campaign_help` - Get help with single send campaigns
- `sendgrid_contacts_help` - Get help with comprehensive contact management
- `sendgrid_list_management_help` - Get help with email list CRUD operations
- `sendgrid_update_list_help` - Get help with updating/renaming email lists
- `sendgrid_contact_crud_help` - Get help with contact create/read/update/delete operations
- `sendgrid_custom_fields_help` - Get help with custom field definitions management
- `sendgrid_segment_management_help` - Get help with managing dynamic contact segments
- `sendgrid_sender_management_help` - Get help with sender identity management
- `sendgrid_suppressions_help` - Get help with suppression lists
- `sendgrid_settings_help` - Get help with account settings
- `sendgrid_mail_send_help` - Get help with sending emails
- `sendgrid_stats_help` - Get help with analyzing email performance and statistics

## Examples

📚 **For extensive examples and natural language prompts, see [EXAMPLE_PROMPTS.md](EXAMPLE_PROMPTS.md)**

The following are JSON-based tool examples. For natural language examples you can use with Claude, check the comprehensive examples file.

### Send a Simple Email

```json
{
  "tool": "send_mail",
  "arguments": {
    "personalizations": [
      {
        "to": [{"email": "recipient@example.com", "name": "John Doe"}],
        "subject": "Hello from SendGrid MCP!"
      }
    ],
    "from": {"email": "sender@yourdomain.com", "name": "Your Name"},
    "content": [
      {
        "type": "text/plain",
        "value": "Hello! This email was sent via SendGrid MCP server."
      }
    ]
  }
}
```

### Create a New Contact

```json
{
  "tool": "create_contact",
  "arguments": {
    "contacts": [
      {
        "email": "newuser@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    ]
  }
}
```

### Search for Contacts by Email

```json
{
  "tool": "search_contacts_by_emails",
  "arguments": {
    "emails": ["john@example.com", "jane@example.com"]
  }
}
```

### Search Contacts with Query Conditions

```json
{
  "tool": "search_contacts",
  "arguments": {
    "query": "email LIKE '@example.com'",
    "page_size": 10
  }
}
```

### Update Contact Information

```json
{
  "tool": "update_contact",
  "arguments": {
    "contacts": [
      {
        "id": "contact_id_here",
        "first_name": "John",
        "last_name": "Updated"
      }
    ]
  }
}
```

### Delete Contacts

```json
{
  "tool": "delete_contact",
  "arguments": {
    "contact_ids": ["contact_id_1", "contact_id_2"]
  }
}
```

### Remove Contacts from a List

```json
{
  "tool": "remove_contact_from_lists",
  "arguments": {
    "list_id": "list_id_here",
    "contact_ids": ["contact_id_1", "contact_id_2"]
  }
}
```

### Delete a Sender Identity

```json
{
  "tool": "delete_sender",
  "arguments": {
    "sender_id": "sender_id_here"
  }
}
```

### Update an Email List

```json
{
  "tool": "update_email_list",
  "arguments": {
    "list_id": "list_id_here",
    "name": "Updated List Name"
  }
}
```

### Delete an Email List

```json
{
  "tool": "delete_email_list",
  "arguments": {
    "list_id": "list_id_here"
  }
}
```

### Create a Custom Field

```json
{
  "tool": "create_custom_field",
  "arguments": {
    "name": "customer_tier",
    "field_type": "Text"
  }
}
```

### Update a Custom Field

```json
{
  "tool": "update_custom_field",
  "arguments": {
    "field_id": "field_id_here",
    "name": "customer_level"
  }
}
```

### Delete a Custom Field

```json
{
  "tool": "delete_custom_field",
  "arguments": {
    "field_id": "field_id_here"
  }
}
```

### List Email Lists

```json
{
  "tool": "list_email_lists",
  "arguments": {
    "page_size": 100
  }
}
```

### Update a Segment

```json
{
  "tool": "update_segment",
  "arguments": {
    "segment_id": "segment_id_here",
    "name": "Updated Segment Name"
  }
}
```

### Update Segment Query Criteria

```json
{
  "tool": "update_segment",
  "arguments": {
    "segment_id": "segment_id_here",
    "query_dsl": "{\"and\": [{\"field\": \"email\", \"value\": \"@example.com\", \"operator\": \"like\"}]}"
  }
}
```

### Delete a Segment

```json
{
  "tool": "delete_segment",
  "arguments": {
    "segment_id": "segment_id_here"
  }
}
```

### Get Global Email Statistics

```json
{
  "tool": "get_global_stats",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "aggregated_by": "day"
  }
}
```

### Get Statistics by Mailbox Provider

```json
{
  "tool": "get_stats_by_mailbox_provider",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-07",
    "aggregated_by": "day",
    "mailbox_providers": "gmail.com,outlook.com,yahoo.com"
  }
}
```

### Get Geographic Performance Statistics

```json
{
  "tool": "get_stats_by_country",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "country": "US",
    "aggregated_by": "week"
  }
}
```

### Get Comprehensive Statistics Overview

```json
{
  "tool": "get_stats_overview",
  "arguments": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-07",
    "aggregated_by": "day",
    "include_subusers": false
  }
}
```

## Development

### Project Structure

```
src/
├── index.ts                    # Main entry point
├── shared/                     # Shared utilities
│   ├── auth.ts                 # Authentication
│   ├── api.ts                  # SendGrid API client
│   ├── env.ts                  # Environment validation
│   └── types.ts                # Shared types
├── tools/                      # Tool definitions
│   ├── automations.ts          # Automation tools
│   ├── campaigns.ts            # Campaign tools
│   ├── contacts.ts             # Contact tools
│   ├── mail.ts                 # Mail sending tools
│   └── misc.ts                 # Miscellaneous tools
├── resources/                  # Resource definitions
│   └── sendgrid.ts             # SendGrid resources
└── prompts/                    # Prompt definitions
    └── help.ts                 # Help prompts
```

### Adding New Tools

1. Add tool definition to appropriate file in `src/tools/`
2. Export from `src/tools/index.ts`
3. Tool will be automatically registered

### Building

```bash
npm run build
```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm start` - Run the built server

## Troubleshooting

### Common Issues

1. **Invalid API Key**
   - Ensure your API key starts with `SG.`
   - Verify the key has necessary permissions
   - Check for typos in `.env` file

2. **Environment Validation Errors**
   - Check all required variables are set
   - Verify variable names match exactly
   - Ensure no extra spaces or quotes

3. **Permission Errors**
   - Your API key might not have sufficient permissions
   - Create a new key with "Full Access" or required scopes

### Getting Help

- Use the built-in help prompts (e.g., `sendgrid_automation_help`)
- Check SendGrid's [API documentation](https://docs.sendgrid.com/api-reference)
- Review the `.env.example` file for configuration reference

## License

This project is licensed under the ISC License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues related to:
- **SendGrid API**: Check [SendGrid Documentation](https://docs.sendgrid.com/)
- **MCP Protocol**: Check [Model Context Protocol](https://modelcontextprotocol.io/)
- **This Server**: Open an issue in this repository