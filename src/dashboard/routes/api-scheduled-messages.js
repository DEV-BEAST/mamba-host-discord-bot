import { Router } from 'express';
import { getScheduledMessages, createScheduledMessage, deleteScheduledMessage, toggleScheduledMessage } from '../../utils/database.js';

export function createScheduledMessagesRouter() {
  const router = Router();

  // GET /api/scheduled-messages/:guildId
  router.get('/:guildId', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const messages = await getScheduledMessages(guildId);
      const enriched = messages.map(m => {
        const channel = guild.channels.cache.get(m.channel_id);
        return { ...m, channelName: channel ? channel.name : 'Unknown' };
      });
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/scheduled-messages/:guildId
  router.post('/:guildId', async (req, res) => {
    const { guildId } = req.params;
    const { channelId, content, embedJson, sendAt, recurrence } = req.body;

    if (!channelId || !sendAt) return res.status(400).json({ error: 'channelId and sendAt are required' });
    if (!content && !embedJson) return res.status(400).json({ error: 'Either content or embedJson is required' });

    try {
      const id = await createScheduledMessage(guildId, channelId, content, embedJson, sendAt, recurrence);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/scheduled-messages/:id/toggle
  router.put('/:id/toggle', async (req, res) => {
    const { isActive } = req.body;
    try {
      await toggleScheduledMessage(req.params.id, isActive);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/scheduled-messages/:id
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await deleteScheduledMessage(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Message not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
