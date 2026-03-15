import { Client, Collection, Events, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { handleButtonInteraction, handleModalSubmit } from './src/events/interactionCreate.js';
import { handleMessageForXP } from './src/commands/leveling.js';
import { setCustomPresence } from './src/utils/presence.js';
import { attachClient } from './src/dashboard/server.js';
import botConfig, { initBotConfig } from './src/utils/botConfig.js';
import { initDatabase, incrementMessageActivity } from './src/utils/database.js';
import { handleReactionAdd, handleReactionRemove } from './src/events/reactionRoles.js';
import { handleCustomCommand } from './src/events/customCommands.js';
import { startScheduler } from './src/utils/scheduler.js';
import { startStatsCollector } from './src/utils/statsCollector.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Reaction,
    Partials.User,
  ],
});

client.commands = new Collection();

// Load commands
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = join(__dirname, 'src', 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== 'index.js');

const commands = [];

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✓ Loaded command: ${command.data.name}`);
  } else {
    console.warn(`⚠ Command at ${filePath} is missing "data" or "execute"`);
  }
}

// Register slash commands
const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally or to a specific guild
    const data = process.env.GUILD_ID
      ? await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commands },
        )
      : await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands },
        );

    console.log(`✓ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

// Bot ready event
client.once(Events.ClientReady, (c) => {
  console.log(`✓ Bot is ready! Logged in as ${c.user.tag}`);

  // Apply saved presence (or defaults)
  setCustomPresence(c, botConfig.presence);

  // Attach Discord client to the dashboard server
  attachClient(c, botConfig);

  // Start background systems
  startScheduler(c);
  startStatsCollector(c);
});

// Auto-assign role on member join + welcome messages
client.on(Events.GuildMemberAdd, async (member) => {
  // Auto-role — only if the role exists in this guild
  if (botConfig.autoRoleId && member.guild.roles.cache.has(botConfig.autoRoleId)) {
    try {
      await member.roles.add(botConfig.autoRoleId);
      console.log(`✓ Auto-assigned role to ${member.user.tag}`);
    } catch (error) {
      console.error(`Error auto-assigning role to ${member.user.tag}:`, error);
    }
  }

  // Welcome message
  if (botConfig.welcome.enabled && botConfig.welcome.channelId) {
    try {
      const channel = member.guild.channels.cache.get(botConfig.welcome.channelId);
      if (channel) {
        const msg = botConfig.welcome.message
          .replace(/{user}/g, member.toString())
          .replace(/{server}/g, member.guild.name)
          .replace(/{memberCount}/g, member.guild.memberCount);
        await channel.send(msg);
      }
    } catch (error) {
      console.error(`Error sending welcome message for ${member.user.tag}:`, error);
    }
  }
});

// Reaction role handlers
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    await handleReactionAdd(reaction, user);
  } catch (error) {
    console.error('Error handling reaction add:', error);
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  try {
    await handleReactionRemove(reaction, user);
  } catch (error) {
    console.error('Error handling reaction remove:', error);
  }
});

// Handle messages for XP tracking, custom commands, and message activity
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // Custom commands (check first, skip XP if it was a command)
  try {
    const handled = await handleCustomCommand(message, botConfig);
    if (handled) return;
  } catch (error) {
    console.error('Error handling custom command:', error);
  }

  // XP tracking
  try {
    await handleMessageForXP(message);
  } catch (error) {
    console.error('Error handling message for XP:', error);
  }

  // Track message activity (fire-and-forget)
  incrementMessageActivity(message.guild.id, message.channel.id).catch(() => {});
});

// Handle interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      botConfig.commandsRun++;
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);

      const errorMessage = {
        content: 'There was an error while executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  // Handle button interactions
  else if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction);
    } catch (error) {
      console.error('Error handling button interaction:', error);

      const errorMessage = {
        content: 'There was an error while processing this button!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  // Handle modal submissions
  else if (interaction.isModalSubmit()) {
    try {
      await handleModalSubmit(interaction);
    } catch (error) {
      console.error('Error handling modal submission:', error);

      const errorMessage = {
        content: 'There was an error while processing this form!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
});

// Global error handlers to prevent crashes
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Initialize database, load config, and login to Discord
await initDatabase();
await initBotConfig();
client.login(process.env.BOT_TOKEN);
