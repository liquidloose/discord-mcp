#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Discord REST client for API calls
let rest: REST | null = null;
let discordClient: Client | null = null;

function ensureAuth(): REST {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error(
      "DISCORD_BOT_TOKEN environment variable is required. " +
        "Create a bot at https://discord.com/developers/applications and set the token."
    );
  }
  if (!rest) {
    rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);
  }
  return rest;
}

// Initialize Discord client for bot user info
async function getDiscordClient(): Promise<Client> {
  if (!discordClient) {
    if (!DISCORD_BOT_TOKEN) {
      throw new Error("DISCORD_BOT_TOKEN is required");
    }
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });
    await discordClient.login(DISCORD_BOT_TOKEN);
  }
  return discordClient;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface Channel {
  id: string;
  name: string;
  type: number;
  guild_id?: string;
}

interface Message {
  id: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  attachments?: any[];
}

interface DMChannel {
  id: string;
  type: number;
  recipients: Array<{
    id: string;
    username: string;
  }>;
}

const server = new Server(
  {
    name: "discord-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_guilds",
        description:
          "List all guilds (servers) the bot is a member of. Returns guild ID, name, icon, and permissions.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_channels",
        description:
          "List all text channels in a specific guild. Filters for text channels (type 0) and announcement channels (type 5).",
        inputSchema: {
          type: "object",
          properties: {
            guild_id: {
              type: "string",
              description: "The Discord guild (server) ID",
            },
          },
          required: ["guild_id"],
        },
      },
      {
        name: "send_message",
        description:
          "Send a text message to a Discord channel. Requires the bot to have Send Messages permission in the channel.",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: {
              type: "string",
              description: "The Discord channel ID to send the message to",
            },
            content: {
              type: "string",
              description: "The message content to send (max 2000 characters)",
            },
          },
          required: ["channel_id", "content"],
        },
      },
      {
        name: "get_messages",
        description:
          "Retrieve recent messages from a Discord channel. Requires Read Message History permission and Message Content Intent enabled in the bot settings.",
        inputSchema: {
          type: "object",
          properties: {
            channel_id: {
              type: "string",
              description: "The Discord channel ID to read messages from",
            },
            limit: {
              type: "number",
              description:
                "Number of messages to retrieve (1-100, default: 50)",
              default: 50,
            },
          },
          required: ["channel_id"],
        },
      },
      {
        name: "send_dm",
        description:
          "Send a direct message to a Discord user. Opens or reuses a DM channel with the user and sends a message.",
        inputSchema: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              description: "The Discord user ID to send a DM to",
            },
            content: {
              type: "string",
              description: "The message content to send (max 2000 characters)",
            },
          },
          required: ["user_id", "content"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const apiClient = ensureAuth();

    switch (name) {
      case "list_guilds": {
        const client = await getDiscordClient();
        const guilds = await client.guilds.fetch();
        const guildList = Array.from(guilds.values()).map((guild) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(guildList, null, 2),
            },
          ],
        };
      }

      case "list_channels": {
        const { guild_id } = args as { guild_id: string };
        if (!guild_id) {
          throw new Error("guild_id is required");
        }

        const channels = (await apiClient.get(
          Routes.guildChannels(guild_id)
        )) as Channel[];

        // Filter for text channels (type 0) and announcement channels (type 5)
        const textChannels = channels
          .filter((ch) => ch.type === 0 || ch.type === 5)
          .map((ch) => ({
            id: ch.id,
            name: ch.name,
            type: ch.type === 0 ? "text" : "announcement",
          }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(textChannels, null, 2),
            },
          ],
        };
      }

      case "send_message": {
        const { channel_id, content } = args as {
          channel_id: string;
          content: string;
        };
        if (!channel_id || !content) {
          throw new Error("channel_id and content are required");
        }

        if (content.length > 2000) {
          throw new Error("Message content cannot exceed 2000 characters");
        }

        const message = (await apiClient.post(Routes.channelMessages(channel_id), {
          body: { content },
        })) as Message;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message_id: message.id,
                  channel_id: message.channel_id,
                  content: message.content,
                  timestamp: message.timestamp,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_messages": {
        const { channel_id, limit = 50 } = args as {
          channel_id: string;
          limit?: number;
        };
        if (!channel_id) {
          throw new Error("channel_id is required");
        }

        const clampedLimit = Math.min(Math.max(1, limit), 100);

        const messages = (await apiClient.get(
          Routes.channelMessages(channel_id),
          { query: new URLSearchParams({ limit: clampedLimit.toString() }) }
        )) as Message[];

        const formattedMessages = messages.map((msg) => ({
          id: msg.id,
          author: {
            id: msg.author.id,
            username: msg.author.username,
            bot: msg.author.bot || false,
          },
          content: msg.content,
          timestamp: msg.timestamp,
          edited: msg.edited_timestamp !== null,
          attachments: msg.attachments?.length || 0,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  channel_id,
                  message_count: formattedMessages.length,
                  messages: formattedMessages,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "send_dm": {
        const { user_id, content } = args as {
          user_id: string;
          content: string;
        };
        if (!user_id || !content) {
          throw new Error("user_id and content are required");
        }

        if (content.length > 2000) {
          throw new Error("Message content cannot exceed 2000 characters");
        }

        // Create or get DM channel
        const dmChannel = (await apiClient.post(Routes.userChannels(), {
          body: { recipient_id: user_id },
        })) as DMChannel;

        // Send message to DM channel
        const message = (await apiClient.post(
          Routes.channelMessages(dmChannel.id),
          {
            body: { content },
          }
        )) as Message;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  dm_channel_id: dmChannel.id,
                  message_id: message.id,
                  recipient_user_id: user_id,
                  content: message.content,
                  timestamp: message.timestamp,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    // Return helpful error messages
    let errorMessage = error.message || "Unknown error occurred";

    // Enhance Discord API errors with helpful context
    if (error.code === 50001) {
      errorMessage =
        "Missing Access - The bot doesn't have permission to access this resource. Check channel permissions.";
    } else if (error.code === 50013) {
      errorMessage =
        "Missing Permissions - The bot lacks the required permissions for this action (e.g., Send Messages, Read Message History).";
    } else if (error.code === 10003) {
      errorMessage = "Unknown Channel - The channel ID doesn't exist or the bot can't access it.";
    } else if (error.code === 10004) {
      errorMessage = "Unknown Guild - The guild ID doesn't exist or the bot isn't a member.";
    } else if (error.code === 10013) {
      errorMessage = "Unknown User - The user ID doesn't exist.";
    } else if (error.rawError?.message) {
      errorMessage = `Discord API Error: ${error.rawError.message}`;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              message: errorMessage,
              code: error.code,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with stdio protocol
  console.error("Discord MCP server running on stdio");
  console.error(
    `Token configured: ${DISCORD_BOT_TOKEN ? "✓" : "✗ (will fail on first tool call)"}`
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
