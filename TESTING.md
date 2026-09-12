# Testing the Discord MCP Server

This guide helps you verify the Discord MCP server is working correctly.

## Quick Test Setup

1. **Set up your bot token:**
   ```bash
   cp .env.example .env
   # Edit .env and add your DISCORD_BOT_TOKEN
   ```

2. **Build and run:**
   ```bash
   npm install
   npm run build
   npm start
   ```

   You should see:
   ```
   Discord MCP server running on stdio
   Token configured: ✓
   ```

## Testing with MCP Inspector

The easiest way to test MCP servers is with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web UI where you can:
- View available tools
- Call tools with test parameters
- See responses in real-time

## Example Tool Calls

### 1. List Guilds

No parameters needed. This will show all servers your bot is in.

**Expected response:**
```json
[
  {
    "id": "123456789012345678",
    "name": "My Discord Server",
    "icon": "a1b2c3d4e5f6"
  }
]
```

### 2. List Channels

**Parameters:**
```json
{
  "guild_id": "123456789012345678"
}
```

**Expected response:**
```json
[
  {
    "id": "987654321098765432",
    "name": "general",
    "type": "text"
  },
  {
    "id": "876543210987654321",
    "name": "announcements",
    "type": "announcement"
  }
]
```

### 3. Send Message

**Parameters:**
```json
{
  "channel_id": "987654321098765432",
  "content": "Hello from Discord MCP! 🤖"
}
```

**Expected response:**
```json
{
  "success": true,
  "message_id": "1234567890123456789",
  "channel_id": "987654321098765432",
  "content": "Hello from Discord MCP! 🤖",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Get Messages

**Parameters:**
```json
{
  "channel_id": "987654321098765432",
  "limit": 10
}
```

**Expected response:**
```json
{
  "channel_id": "987654321098765432",
  "message_count": 10,
  "messages": [
    {
      "id": "1234567890123456789",
      "author": {
        "id": "111222333444555666",
        "username": "TestUser",
        "bot": false
      },
      "content": "Test message",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "edited": false,
      "attachments": 0
    }
  ]
}
```

### 5. Send DM

**Parameters:**
```json
{
  "user_id": "111222333444555666",
  "content": "Hello! This is a DM from the bot."
}
```

**Expected response:**
```json
{
  "success": true,
  "dm_channel_id": "777888999000111222",
  "message_id": "1234567890123456789",
  "recipient_user_id": "111222333444555666",
  "content": "Hello! This is a DM from the bot.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Common Test Errors

### "Missing Access" or "Missing Permissions"

**Problem:** The bot doesn't have the required permissions.

**Solution:**
1. Reinvite the bot with the correct permissions
2. Check channel-specific permission overrides
3. Verify the bot role has "Send Messages" and "Read Message History"

### "Unknown Channel"

**Problem:** The channel ID is wrong or the bot can't access it.

**Solution:**
1. Enable Developer Mode in Discord (User Settings → Advanced)
2. Right-click the channel → Copy Channel ID
3. Verify the bot can see the channel

### Token Not Configured

**Problem:** `DISCORD_BOT_TOKEN` is not set.

**Solution:**
1. Copy your bot token from the Developer Portal
2. Add it to `.env`: `DISCORD_BOT_TOKEN=your_token_here`
3. Restart the server

## Finding Discord IDs

### Enable Developer Mode
1. Open Discord
2. Go to User Settings → Advanced
3. Enable "Developer Mode"

### Get IDs
- **Channel ID:** Right-click a channel → Copy Channel ID
- **Server ID:** Right-click a server icon → Copy Server ID
- **User ID:** Right-click a user → Copy User ID
- **Message ID:** Right-click a message → Copy Message ID

## Integration Testing with Cursor

Add to your `~/.cursor/mcp_settings.json`:

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

Then in Cursor, ask:
- "List my Discord servers"
- "Send a message to channel [channel_id] saying hello"
- "Show me the last 5 messages from channel [channel_id]"

## Troubleshooting

### Server won't start

```bash
# Check Node.js version (needs 18+)
node --version

# Rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Messages not readable

Enable Message Content Intent:
1. Go to Discord Developer Portal
2. Select your application
3. Go to Bot → Privileged Gateway Intents
4. Enable "MESSAGE CONTENT INTENT"
5. Save changes

### Bot not responding

Check the bot is online:
1. The bot should appear online in your server
2. Check the server logs (stderr) for connection errors
3. Verify the token is correct and not expired

## Success Criteria

✅ Server starts without errors
✅ Token is recognized
✅ `list_guilds` returns your servers
✅ `list_channels` shows channels in a guild
✅ `send_message` successfully posts to a channel
✅ `get_messages` retrieves message history
✅ `send_dm` delivers a direct message

If all tests pass, the server is ready for production use! 🎉
