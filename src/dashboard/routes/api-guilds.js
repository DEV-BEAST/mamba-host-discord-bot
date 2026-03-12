import { Router } from 'express';
import { ChannelType } from 'discord.js';

export function createGuildsRouter() {
  const router = Router();

  // GET /api/guilds
  router.get('/', (req, res) => {
    const { client } = req.app.locals;
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));
    res.json(guilds);
  });

  // GET /api/guilds/:id/channels
  router.get('/:id/channels', (req, res) => {
    const { client } = req.app.locals;
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const textChannels = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText)
      .sort((a, b) => a.position - b.position)
      .map(c => ({
        id: c.id,
        name: c.name,
        category: c.parent ? c.parent.name : null,
        categoryId: c.parentId,
      }));

    // Group by category
    const grouped = {};
    for (const ch of textChannels) {
      const cat = ch.category || 'No Category';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ch);
    }

    res.json({ channels: textChannels, grouped });
  });

  // GET /api/guilds/:id/roles
  router.get('/:id/roles', (req, res) => {
    const { client } = req.app.locals;
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const roles = guild.roles.cache
      .filter(r => r.id !== guild.id) // exclude @everyone
      .sort((a, b) => b.position - a.position)
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
      }));

    res.json(roles);
  });

  // GET /api/guilds/:id/members?search=query
  router.get('/:id/members', async (req, res) => {
    const { client } = req.app.locals;
    const guild = client.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const query = req.query.search || '';
      let members;

      if (query) {
        members = await guild.members.fetch({ query, limit: 25 });
      } else {
        // Ensure we have some members cached
        if (guild.members.cache.size <= 1) {
          await guild.members.fetch({ limit: 100 });
        }
        members = guild.members.cache;
      }

      const result = [...members.values()]
        .filter(m => !m.user.bot)
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .slice(0, 50)
        .map(m => ({
          id: m.id,
          username: m.user.username,
          displayName: m.displayName,
          avatar: m.user.displayAvatarURL({ size: 32 }),
        }));

      res.json(result);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
