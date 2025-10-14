# Discord Bot Template

A clean, modern Discord bot template with slash commands support using discord.js v14.

## Features

- ✅ Slash commands with automatic registration
- ✅ Command handler with dynamic loading
- ✅ ES6 modules support
- ✅ Example commands (ping, hello, info)
- ✅ Error handling
- ✅ Environment variables with dotenv

## Prerequisites

- Node.js 16.11.0 or higher
- A Discord Bot Token ([Create one here](https://discord.com/developers/applications))

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_test_server_id_here  # Optional, for faster testing
```

### 3. Getting Your Credentials

- **BOT_TOKEN**: Go to [Discord Developer Portal](https://discord.com/developers/applications) → Your Application → Bot → Reset Token
- **CLIENT_ID**: Your Application → General Information → Application ID
- **GUILD_ID** (Optional): Enable Developer Mode in Discord → Right-click your server → Copy Server ID

### 4. Invite the Bot

Use this URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
```

### 5. Run the Bot

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Project Structure

```
discord-bot-template/
├─ src/
│  └─ commands/         # Command files
│     ├─ ping.js        # Example: Ping command
│     ├─ hello.js       # Example: Hello command with options
│     └─ info.js        # Example: Info command with subcommands
├─ index.js             # Main bot file
├─ package.json         # Dependencies and scripts
├─ .env                 # Your environment variables (create this)
├─ .env.example         # Environment template
└─ README.md            # This file
```

## Creating New Commands

Create a new file in `src/commands/`:

```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('commandname')
  .setDescription('Command description');

export async function execute(interaction) {
  await interaction.reply('Hello!');
}
```

The bot will automatically load it on restart.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Your Discord bot token |
| `CLIENT_ID` | Yes | Your Discord application/client ID |
| `GUILD_ID` | No | Server ID for guild-specific commands (recommended for development) |

**Note**: If `GUILD_ID` is set, commands will be registered to that specific server (instant updates). Without it, commands are registered globally (can take up to 1 hour to update).

## Example Commands

- `/ping` - Check bot latency
- `/hello [name]` - Get a greeting
- `/info bot` - Get bot information
- `/info server` - Get server information

## Troubleshooting

### Commands not showing up?
- Make sure the bot has `applications.commands` scope
- If using global commands (no GUILD_ID), wait up to 1 hour
- Check console for registration errors

### Bot won't start?
- Verify your BOT_TOKEN is correct
- Ensure Node.js version is 16.11.0+
- Check that all dependencies are installed

### Permission errors?
- Ensure bot has proper permissions in your server
- Check the invite URL includes required permissions

## Resources

- [Discord.js Guide](https://discordjs.guide/)
- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/applications)

## License

MIT License - See LICENSE file for details
