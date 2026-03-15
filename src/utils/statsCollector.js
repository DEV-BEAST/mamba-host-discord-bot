import { recordServerStats, getMessageActivity } from './database.js';

let intervalId = null;

export function startStatsCollector(client) {
  if (intervalId) return;

  // Record immediately on start, then every hour
  recordAll(client);

  intervalId = setInterval(() => recordAll(client), 60 * 60 * 1000); // 1 hour

  console.log('✓ Stats collector started (1h interval)');
}

async function recordAll(client) {
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      // Get today's message count from message_activity
      const activity = await getMessageActivity(guildId, 1);
      const messagesToday = activity.length > 0 ? Number(activity[0].total) : 0;

      await recordServerStats(guildId, guild.memberCount, messagesToday);
    } catch (err) {
      console.error(`Stats collector error for ${guildId}:`, err.message);
    }
  }
}

export function stopStatsCollector() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
