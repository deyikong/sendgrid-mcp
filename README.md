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

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SENDGRID_API_KEY` | ✅ | Your SendGrid API key (starts with SG.) | - |
| `MCP_SERVER_NAME` | ❌ | Server name for identification | `sendgrid-mcp` |
| `MCP_SERVER_VERSION` | ❌ | Server version | `1.0.0` |
| `LOG_LEVEL` | ❌ | Logging level (debug, info, warn, error) | `info` |
| `REQUEST_TIMEOUT` | ❌ | API request timeout in milliseconds | `30000` |

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
- `list_email_lists` - List all email lists
- `create_email_list` - Create a new email list
- `list_segments` - List segments with parent relationships
- `open_segment_creator` - Open segment creator in browser
- `create_contact` - Create new contacts
- `create_contact_with_lists` - Create contacts and assign to lists
- `open_csv_uploader` - Open CSV upload interface
- `list_custom_fields` - List custom field definitions
- `create_custom_field` - Create new custom fields
- `list_senders` - List verified sender identities
- `create_sender` - Create new sender identity

### Mail Sending
- `send_mail` - Send transactional emails
- `get_scopes` - Get available API permission scopes

## Available Resources

- `sendgrid://automations` - Marketing automations data
- `sendgrid://singlesends` - Single send campaigns data
- `sendgrid://lists` - Email lists data
- `sendgrid://contacts` - Contact segments data
- `sendgrid://suppressions` - Suppression lists (bounces, spam, etc.)
- `sendgrid://account` - Account profile information

## Available Prompts

- `sendgrid_automation_help` - Get help with marketing automations
- `sendgrid_campaign_help` - Get help with single send campaigns
- `sendgrid_contacts_help` - Get help with contact management
- `sendgrid_suppressions_help` - Get help with suppression lists
- `sendgrid_settings_help` - Get help with account settings
- `sendgrid_mail_send_help` - Get help with sending emails

## Examples

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

### List Email Lists

```json
{
  "tool": "list_email_lists",
  "arguments": {
    "page_size": 100
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