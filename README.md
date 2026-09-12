# Discord MCP Server

A production-ready Model Context Protocol (MCP) server that enables AI agents to interact with Discord through the official Discord Bot API.

## Features

- **Send messages** to Discord channels
- **Read message history** from channels
- **Send direct messages** to users
- **List guilds** the bot is a member of
- **List channels** in a guild
- Full error handling with helpful Discord API error messages
- Secure authentication via environment variable
- TypeScript for type safety
- Minimal dependencies (discord.js + MCP SDK)

## Prerequisites

1. **Create a Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Navigate to the "Bot" tab
   - Click "Add Bot"
   - Copy the bot token (you'll need this for `DISCORD_BOT_TOKEN`)

2. **Enable Required Intents**
   - In the Bot settings, scroll to "Privileged Gateway Intents"
   - Enable **MESSAGE CONTENT INTENT** (required to read message content)
   - Enable **SERVER MEMBERS INTENT** (optional, for member info)

3. **Invite the Bot to Your Server**
   - Go to OAuth2 → URL Generator
   - Select scopes: `bot`
   - Select bot permissions:
     - View Channels
     - Send Messages
     - Read Message History
     - Send Messages in Threads (optional)
   - Copy the generated URL and open it in your browser
   - Select a server and authorize the bot

## Installation

```bash
# Clone or navigate to this repository
cd discord-mcp

# Install dependencies
npm install

# Copy environment example
cp .env.example .env

# Edit .env and add your bot token
# DISCORD_BOT_TOKEN=your_bot_token_here
```

## Usage

### Running Standalone

```bash
# Development mode (with TypeScript)
npm run dev

# Production build
npm run build
npm start
```

### Adding to Cursor / Claude Desktop / Grok Bot

Add this to your MCP settings file:

**For Cursor** (`~/.cursor/mcp_settings.json` or workspace settings):

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/absolute/path/to/discord-mcp/dist/index.js"],
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/absolute/path/to/discord-mcp/dist/index.js"],
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

**Alternative: Using npx (development mode)**

```json
{
  "mcpServers": {
    "discord": {
      "command": "npx",
      "args": ["-y", "tsx", "/absolute/path/to/discord-mcp/src/index.ts"],
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

### Adding to Hermes AI

For Hermes or other MCP clients that support stdio servers, use similar configuration with the `command` and `args` pointing to the server executable and `env` containing the token.

## Available Tools

### 1. `list_guilds`

List all guilds (servers) the bot is a member of.

**Parameters:** None

**Returns:** Array of guilds with `id`, `name`, and `icon`.

### 2. `list_channels`

List all text channels in a specific guild.

**Parameters:**
- `guild_id` (string, required): The Discord guild (server) ID

**Returns:** Array of text channels with `id`, `name`, and `type`.

### 3. `send_message`

Send a text message to a Discord channel.

**Parameters:**
- `channel_id` (string, required): The Discord channel ID
- `content` (string, required): Message content (max 2000 characters)

**Returns:** Confirmation with `message_id`, `channel_id`, `content`, and `timestamp`.

### 4. `get_messages`

Retrieve recent messages from a Discord channel.

**Parameters:**
- `channel_id` (string, required): The Discord channel ID
- `limit` (number, optional): Number of messages (1-100, default: 50)

**Returns:** Array of messages with author info, content, timestamp, and metadata.

### 5. `send_dm`

Send a direct message to a Discord user.

**Parameters:**
- `user_id` (string, required): The Discord user ID
- `content` (string, required): Message content (max 2000 characters)

**Returns:** Confirmation with `dm_channel_id`, `message_id`, and `timestamp`.

## Error Handling

The server provides clear error messages for common Discord API issues:

- **Missing Access**: Bot doesn't have permission to access the resource
- **Missing Permissions**: Bot lacks required permissions (Send Messages, Read Message History, etc.)
- **Unknown Channel/Guild/User**: Invalid or inaccessible ID
- **Missing Token**: `DISCORD_BOT_TOKEN` not configured
- **Message Content Intent**: Required intent not enabled in bot settings

## Finding Discord IDs

- **Channel ID**: Right-click a channel → Copy Channel ID (requires Developer Mode enabled in Discord settings)
- **Guild ID**: Right-click a server icon → Copy Server ID
- **User ID**: Right-click a user → Copy User ID

## Security

- **Never commit your bot token** to version control
- The `.env` file is gitignored by default
- Use `.env.example` as a template
- Store tokens in environment variables or secure secret management

## Troubleshooting

### "Missing Access" or "Missing Permissions" errors

- Verify the bot has been invited with the correct permissions
- Check channel-specific permission overrides in Discord
- Ensure the bot role has necessary permissions in Server Settings → Roles

### "Message Content Intent" errors

- Go to Discord Developer Portal → Your Application → Bot
- Enable "MESSAGE CONTENT INTENT" under Privileged Gateway Intents
- Save changes (may require re-verification for verified bots)

### Bot token not working

- Regenerate the token in the Developer Portal if compromised
- Ensure no extra spaces or quotes in the `.env` file
- Verify the token is being loaded (check startup logs on stderr)

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Technology Stack

- **TypeScript** for type safety
- **discord.js** for Discord REST API client
- **@modelcontextprotocol/sdk** for MCP protocol
- **dotenv** for environment variable management

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- TypeScript types are correct
- Error handling is comprehensive
- No secrets are committed
- README is updated for new features

## Resources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord API Documentation](https://discord.com/developers/docs/intro)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [discord.js Documentation](https://discord.js.org/)
