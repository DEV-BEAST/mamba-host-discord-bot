import { Router } from 'express';
import { calculateLevel } from '../../commands/leveling.js';
import { getGuildLeaderboard } from '../../utils/database.js';

export function createLeaderboardRouter() {
  const router = Router();

  // GET /api/leaderboard/:guildId
  router.get('/:guildId', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const entries = await getGuildLeaderboard(guildId, 100);

    const leaderboard = await Promise.all(
      entries.map(async (row, idx) => {
        try {
          const user = await client.users.fetch(row.user_id);
          return {
            rank: idx + 1,
            userId: row.user_id,
            username: user.username,
            displayName: user.globalName || user.username,
            avatar: user.displayAvatarURL({ size: 32 }),
            level: calculateLevel(row.xp),
            xp: row.xp,
            messages: row.messages,
          };
        } catch {
          return {
            rank: idx + 1,
            userId: row.user_id,
            username: 'Unknown User',
            displayName: 'Unknown User',
            avatar: null,
            level: calculateLevel(row.xp),
            xp: row.xp,
            messages: row.messages,
          };
        }
      })
    );

    res.json({ guildName: guild.name, leaderboard });
  });

  return router;
}
