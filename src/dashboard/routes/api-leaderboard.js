import { Router } from 'express';
import { userXP, calculateLevel } from '../../commands/leveling.js';

export function createLeaderboardRouter() {
  const router = Router();

  // GET /api/leaderboard/:guildId
  router.get('/:guildId', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const entries = Array.from(userXP.entries())
      .filter(([key]) => key.startsWith(guildId + '-'))
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 100); // top 100

    const leaderboard = await Promise.all(
      entries.map(async ([key, data], idx) => {
        const userId = key.split('-')[1];
        try {
          const user = await client.users.fetch(userId);
          return {
            rank: idx + 1,
            userId,
            username: user.username,
            displayName: user.globalName || user.username,
            avatar: user.displayAvatarURL({ size: 32 }),
            level: calculateLevel(data.xp),
            xp: data.xp,
            messages: data.messages,
          };
        } catch {
          return {
            rank: idx + 1,
            userId,
            username: 'Unknown User',
            displayName: 'Unknown User',
            avatar: null,
            level: calculateLevel(data.xp),
            xp: data.xp,
            messages: data.messages,
          };
        }
      })
    );

    res.json({ guildName: guild.name, leaderboard });
  });

  return router;
}
