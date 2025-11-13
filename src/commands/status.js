import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const API_URL = 'https://status.mambahost.com/api/status-page/heartbeat/mambahost';
const STATUS_PAGE_URL = 'https://status.mambahost.com';

// Cache for API responses (5 minute TTL)
const cache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5 minutes
};

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Check MambaHost service status and uptime statistics');

/**
 * Fetch status data from Uptime Kuma API
 */
async function fetchStatusData(useCache = true) {
  // Check cache first
  if (useCache && cache.data && (Date.now() - cache.timestamp < cache.TTL)) {
    return { data: cache.data, cached: true };
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        'User-Agent': 'MambaHost-Discord-Bot/1.0',
        'Accept': 'application/json',
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    cache.data = data;
    cache.timestamp = Date.now();

    return { data, cached: false };
  } catch (error) {
    console.error('Error fetching status data:', error);

    // Return cached data if available, even if expired
    if (cache.data) {
      return { data: cache.data, cached: true, error: true };
    }

    throw error;
  }
}

/**
 * Calculate uptime percentage
 */
function calculateUptime(heartbeats) {
  if (!heartbeats || heartbeats.length === 0) return 100;

  const upCount = heartbeats.filter(h => h.status === 1).length;
  return ((upCount / heartbeats.length) * 100).toFixed(2);
}

/**
 * Get status emoji and color
 */
function getStatusDisplay(status) {
  switch (status) {
    case 1:
      return { emoji: '🟢', text: 'Operational', color: 0x00FF00 };
    case 0:
      return { emoji: '🔴', text: 'Down', color: 0xFF0000 };
    case 2:
      return { emoji: '🟡', text: 'Degraded', color: 0xFFFF00 };
    default:
      return { emoji: '⚪', text: 'Unknown', color: 0x808080 };
  }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Create status embed
 */
function createStatusEmbed(statusData, cached = false, error = false) {
  const embed = new EmbedBuilder()
    .setColor(0xFF6F00)
    .setTitle('🖥️ MambaHost Service Status')
    .setURL(STATUS_PAGE_URL)
    .setTimestamp();

  // Add footer with cache info
  let footerText = 'Data updates every 5 minutes';
  if (cached && error) {
    footerText = '⚠️ Using cached data (API temporarily unavailable)';
    embed.setColor(0xFFAA00);
  } else if (cached) {
    footerText = '💾 Cached data (updates every 5 minutes)';
  }
  embed.setFooter({ text: footerText });

  try {
    if (!statusData || !statusData.heartbeatList) {
      embed.setDescription('❌ Unable to fetch status data. The API may be temporarily unavailable.');
      embed.setColor(0xFF0000);
      return embed;
    }

    // Debug logging
    console.log('[Status] API Response Keys:', Object.keys(statusData));
    console.log('[Status] Has publicGroupList:', !!statusData.publicGroupList);
    if (statusData.publicGroupList) {
      console.log('[Status] publicGroupList length:', statusData.publicGroupList.length);
      console.log('[Status] publicGroupList structure:', JSON.stringify(statusData.publicGroupList, null, 2).substring(0, 500));
    }

    const { heartbeatList, publicGroupList, config } = statusData;

    // Overall status
    let allOperational = true;
    const monitorStatuses = [];

    // Process each monitor/service
    if (publicGroupList && publicGroupList.length > 0) {
      for (const group of publicGroupList) {
        if (group.monitorList) {
          for (const monitor of group.monitorList) {
            const monitorId = monitor.id;
            const heartbeats = heartbeatList[monitorId] || [];
            const latestHeartbeat = heartbeats[heartbeats.length - 1];

            const status = latestHeartbeat ? latestHeartbeat.status : 0;
            const { emoji, text, color } = getStatusDisplay(status);
            const uptime = calculateUptime(heartbeats);
            const ping = latestHeartbeat?.ping ? `${Math.round(latestHeartbeat.ping)}ms` : 'N/A';

            if (status !== 1) allOperational = false;

            monitorStatuses.push({
              name: `${emoji} ${monitor.name}`,
              value: `**Status:** ${text}\n**Uptime:** ${uptime}%\n**Response:** ${ping}`,
              inline: true
            });
          }
        }
      }
    }

    // If we have monitor statuses, add them
    if (monitorStatuses.length > 0) {
      // Overall status banner
      if (allOperational) {
        embed.setDescription('✅ **All systems operational**');
        embed.setColor(0x00FF00);
      } else {
        embed.setDescription('⚠️ **Some services experiencing issues**');
        embed.setColor(0xFFAA00);
      }

      // Add each service status
      embed.addFields(monitorStatuses);

      // Add statistics section
      const totalMonitors = monitorStatuses.length;
      const operationalMonitors = monitorStatuses.filter(m => m.name.includes('🟢')).length;

      embed.addFields({
        name: '📊 Statistics',
        value: `**Total Services:** ${totalMonitors}\n**Operational:** ${operationalMonitors}/${totalMonitors}\n**Last Updated:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: false
      });
    } else {
      embed.setDescription('📊 Status page configured but no monitors found.');
    }

    // Add maintenance info if available
    if (config && config.statusPageMessage) {
      embed.addFields({
        name: '📢 Notice',
        value: config.statusPageMessage,
        inline: false
      });
    }

  } catch (error) {
    console.error('Error creating embed:', error);
    embed.setDescription('❌ Error processing status data.');
    embed.setColor(0xFF0000);
  }

  return embed;
}

/**
 * Create action buttons
 */
function createActionRow() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('status_refresh')
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('Status Page')
        .setURL(STATUS_PAGE_URL)
        .setStyle(ButtonStyle.Link)
    );
}

export async function execute(interaction) {
  // Defer reply as API call might take time
  await interaction.deferReply();

  try {
    const { data: statusData, cached, error } = await fetchStatusData();
    const embed = createStatusEmbed(statusData, cached, error);
    const actionRow = createActionRow();

    await interaction.editReply({
      embeds: [embed],
      components: [actionRow]
    });
  } catch (error) {
    console.error('Error executing status command:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Error')
      .setDescription('Unable to fetch status data. The service may be temporarily unavailable.')
      .addFields({
        name: 'Alternative',
        value: `Visit the [status page](${STATUS_PAGE_URL}) directly for real-time information.`
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Handle button interactions for this command
 * This function should be called from the main interaction handler
 */
export async function handleStatusButton(interaction) {
  if (interaction.customId === 'status_refresh') {
    await interaction.deferUpdate();

    try {
      // Force fresh data (bypass cache)
      const { data: statusData, error } = await fetchStatusData(false);
      const embed = createStatusEmbed(statusData, false, error);
      const actionRow = createActionRow();

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow]
      });
    } catch (error) {
      console.error('Error refreshing status:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Refresh Failed')
        .setDescription('Unable to fetch fresh status data. Please try again later.')
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed],
        components: [createActionRow()]
      });
    }
  }
}
