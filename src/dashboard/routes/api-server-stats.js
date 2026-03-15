import { Router } from 'express';
import { getServerStats, getMessageActivity, getChannelActivity } from '../../utils/database.js';

export function createServerStatsRouter() {
  const router = Router();

  // GET /api/server-stats/:guildId/overview?days=30
  router.get('/:guildId/overview', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const stats = await getServerStats(guildId, days);
      const messageActivity = await getMessageActivity(guildId, days);

      const totalMessages = messageActivity.reduce((sum, d) => sum + Number(d.total), 0);

      res.json({
        memberCount: guild.memberCount,
        totalMessages,
        memberHistory: stats.map(s => ({
          date: s.recorded_at,
          members: s.member_count,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/server-stats/:guildId/messages?days=30
  router.get('/:guildId/messages', async (req, res) => {
    const { guildId } = req.params;
    const days = parseInt(req.query.days) || 30;

    try {
      const activity = await getMessageActivity(guildId, days);
      res.json(activity.map(a => ({
        date: a.message_date,
        count: Number(a.total),
      })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/server-stats/:guildId/channels?days=30
  router.get('/:guildId/channels', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const channels = await getChannelActivity(guildId, days);
      const enriched = channels.map(c => {
        const channel = guild.channels.cache.get(c.channel_id);
        return {
          channelId: c.channel_id,
          channelName: channel ? channel.name : 'Unknown',
          count: Number(c.total),
        };
      });
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
