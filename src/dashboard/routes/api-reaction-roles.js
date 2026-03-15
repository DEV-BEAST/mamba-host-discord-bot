import { Router } from 'express';
import { getReactionRoles, createReactionRole, deleteReactionRole } from '../../utils/database.js';

export function createReactionRolesRouter() {
  const router = Router();

  // GET /api/reaction-roles/:guildId
  router.get('/:guildId', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const mappings = await getReactionRoles(guildId);

      // Enrich with channel/role names
      const enriched = mappings.map(m => {
        const channel = guild.channels.cache.get(m.channel_id);
        const role = guild.roles.cache.get(m.role_id);
        return {
          ...m,
          channelName: channel ? channel.name : 'Unknown',
          roleName: role ? role.name : 'Unknown',
        };
      });

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/reaction-roles/:guildId
  router.post('/:guildId', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const { channelId, messageId, emoji, roleId } = req.body;

    if (!channelId || !messageId || !emoji || !roleId) {
      return res.status(400).json({ error: 'channelId, messageId, emoji, and roleId are required' });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const id = await createReactionRole(guildId, channelId, messageId, emoji, roleId);

      // Bot reacts to the message so users can see what to click
      try {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
          const message = await channel.messages.fetch(messageId);
          await message.react(emoji);
        }
      } catch (reactErr) {
        console.error('Could not react to message:', reactErr.message);
      }

      res.json({ success: true, id });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'A mapping for this emoji on this message already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/reaction-roles/:id
  router.delete('/:id', async (req, res) => {
    try {
      const deleted = await deleteReactionRole(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Mapping not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
