import { SlashCommandBuilder, PermissionFlagsBits, ActivityType } from 'discord.js';
import {
  setCustomPresence,
  startPresenceRotation,
  stopPresenceRotation,
  setStatisticsPresence,
  getCurrentPresence
} from '../utils/presence.js';

export const data = new SlashCommandBuilder()
  .setName('presence')
  .setDescription('Manage bot rich presence (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('Set a custom bot presence')
      .addStringOption(option =>
        option
          .setName('activity')
          .setDescription('The activity text to display')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('type')
          .setDescription('The type of activity')
          .setRequired(true)
          .addChoices(
            { name: 'Playing', value: 'playing' },
            { name: 'Watching', value: 'watching' },
            { name: 'Listening', value: 'listening' },
            { name: 'Competing', value: 'competing' },
            { name: 'Streaming', value: 'streaming' }
          )
      )
      .addStringOption(option =>
        option
          .setName('status')
          .setDescription('Bot online status')
          .setRequired(false)
          .addChoices(
            { name: 'Online', value: 'online' },
            { name: 'Idle', value: 'idle' },
            { name: 'Do Not Disturb', value: 'dnd' },
            { name: 'Invisible', value: 'invisible' }
          )
      )
      .addStringOption(option =>
        option
          .setName('url')
          .setDescription('Streaming URL (only for streaming type)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('rotate')
      .setDescription('Start automatic presence rotation')
      .addIntegerOption(option =>
        option
          .setName('interval')
          .setDescription('Rotation interval in seconds (default: 30)')
          .setRequired(false)
          .setMinValue(10)
          .setMaxValue(300)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('stop')
      .setDescription('Stop automatic presence rotation')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('Show server and user statistics in presence')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('Show current presence configuration')
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'set': {
        const activity = interaction.options.getString('activity');
        const typeStr = interaction.options.getString('type');
        const status = interaction.options.getString('status') || 'online';
        const url = interaction.options.getString('url');

        // Map string to ActivityType
        const activityTypes = {
          'playing': ActivityType.Playing,
          'watching': ActivityType.Watching,
          'listening': ActivityType.Listening,
          'competing': ActivityType.Competing,
          'streaming': ActivityType.Streaming,
        };

        const type = activityTypes[typeStr];

        // Validate streaming URL
        if (type === ActivityType.Streaming && !url) {
          return interaction.reply({
            content: '❌ Streaming type requires a URL!',
            ephemeral: true
          });
        }

        // Stop rotation before setting custom presence
        stopPresenceRotation();

        setCustomPresence(interaction.client, {
          name: activity,
          type: type,
          status: status,
          url: url
        });

        const typeEmojis = {
          'playing': '🎮',
          'watching': '👀',
          'listening': '🎧',
          'competing': '🏆',
          'streaming': '📺'
        };

        await interaction.reply({
          content: `✅ Bot presence updated!\n${typeEmojis[typeStr]} **${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)}** ${activity}\n\n*Rotation has been stopped. Use \`/presence rotate\` to re-enable.*`,
          ephemeral: true
        });
        break;
      }

      case 'rotate': {
        const interval = interaction.options.getInteger('interval') || 30;
        const intervalMs = interval * 1000;

        startPresenceRotation(interaction.client, intervalMs);

        await interaction.reply({
          content: `✅ Presence rotation started!\n🔄 Rotating every **${interval} seconds**\n\nActivities include:\n• Watching MambaHost Services\n• Playing /status for uptime info\n• Watching server status\n• Watching your infrastructure\n• Listening /help for commands`,
          ephemeral: true
        });
        break;
      }

      case 'stop': {
        stopPresenceRotation();

        await interaction.reply({
          content: '✅ Presence rotation stopped!\nThe current presence will remain until changed.',
          ephemeral: true
        });
        break;
      }

      case 'stats': {
        // Stop rotation before setting stats presence
        stopPresenceRotation();

        setStatisticsPresence(interaction.client);

        const serverCount = interaction.client.guilds.cache.size;
        const userCount = interaction.client.users.cache.size;

        await interaction.reply({
          content: `✅ Presence set to show statistics!\n📊 **${serverCount}** servers | **${userCount}** users\n\n*Rotation has been stopped. This is a static presence.*`,
          ephemeral: true
        });
        break;
      }

      case 'info': {
        const presenceInfo = getCurrentPresence();
        const client = interaction.client;
        const currentPresence = client.user.presence;

        const statusEmojis = {
          'online': '🟢',
          'idle': '🟡',
          'dnd': '🔴',
          'invisible': '⚫'
        };

        const activityTypeNames = {
          [ActivityType.Playing]: 'Playing',
          [ActivityType.Watching]: 'Watching',
          [ActivityType.Listening]: 'Listening',
          [ActivityType.Competing]: 'Competing',
          [ActivityType.Streaming]: 'Streaming',
        };

        const currentActivity = currentPresence.activities[0];
        const activityText = currentActivity
          ? `${activityTypeNames[currentActivity.type]} **${currentActivity.name}**`
          : 'No activity set';

        const rotationStatus = presenceInfo.isRotating
          ? '🔄 **Enabled** (rotating through activities)'
          : '⏸️ **Disabled** (static presence)';

        await interaction.reply({
          content: `📊 **Current Presence Info**\n\n**Status:** ${statusEmojis[currentPresence.status] || '⚪'} ${currentPresence.status}\n**Activity:** ${activityText}\n**Rotation:** ${rotationStatus}\n**Total Activities:** ${presenceInfo.totalActivities}`,
          ephemeral: true
        });
        break;
      }

      default:
        await interaction.reply({
          content: '❌ Unknown subcommand!',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Error executing presence command:', error);

    const errorMessage = {
      content: '❌ There was an error updating the bot presence!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}
