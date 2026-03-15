import { getDueScheduledMessages, updateScheduledMessageSent } from './database.js';
import { EmbedBuilder } from 'discord.js';

let intervalId = null;

export function startScheduler(client) {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      const messages = await getDueScheduledMessages();

      for (const msg of messages) {
        try {
          const guild = client.guilds.cache.get(msg.guild_id);
          if (!guild) continue;

          const channel = guild.channels.cache.get(msg.channel_id);
          if (!channel) continue;

          const sendPayload = {};

          if (msg.content) {
            sendPayload.content = msg.content;
          }

          if (msg.embed_json) {
            try {
              const embedData = JSON.parse(msg.embed_json);
              const embed = new EmbedBuilder();
              if (embedData.title) embed.setTitle(embedData.title);
              if (embedData.description) embed.setDescription(embedData.description);
              if (embedData.color) embed.setColor(Number(embedData.color));
              sendPayload.embeds = [embed];
            } catch {
              // Invalid embed JSON, skip embed
            }
          }

          if (sendPayload.content || sendPayload.embeds) {
            await channel.send(sendPayload);
          }

          await updateScheduledMessageSent(msg.id, msg.recurrence);
        } catch (err) {
          console.error(`Failed to send scheduled message ${msg.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  }, 30_000); // Check every 30 seconds

  console.log('✓ Scheduled message sender started (30s interval)');
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
