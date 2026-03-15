import { Router } from 'express';
import { EmbedBuilder } from 'discord.js';
import { createModCase, getModCases, getModCasesForUser, deleteModCase } from '../../utils/database.js';

function getModeratorId(req) {
  // Dashboard uses password auth, no per-user identity — attribute to the bot
  return req.app.locals.client.user.id;
}

export function createModerationRouter() {
  const router = Router();

  // POST /api/moderation/:guildId/ban
  router.post('/:guildId/ban', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const { userId, reason, deleteMessages } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      await guild.members.ban(userId, {
        reason: reason || undefined,
        deleteMessageSeconds: deleteMessages ? 7 * 24 * 60 * 60 : 0,
      });
      const caseId = await createModCase(guildId, userId, getModeratorId(req), 'ban', reason);
      res.json({ success: true, caseId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/moderation/:guildId/kick
  router.post('/:guildId/kick', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const { userId, reason } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const member = await guild.members.fetch(userId);
      await member.kick(reason || undefined);
      const caseId = await createModCase(guildId, userId, getModeratorId(req), 'kick', reason);
      res.json({ success: true, caseId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/moderation/:guildId/timeout
  router.post('/:guildId/timeout', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const { userId, reason, duration } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const member = await guild.members.fetch(userId);
      const ms = (duration || 60) * 1000;
      await member.timeout(ms, reason || undefined);
      const caseId = await createModCase(guildId, userId, getModeratorId(req), 'timeout', reason, duration);
      res.json({ success: true, caseId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/moderation/:guildId/warn
  router.post('/:guildId/warn', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const { userId, reason } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      const user = await client.users.fetch(userId);
      const embed = new EmbedBuilder()
        .setColor(0xF0B232)
        .setTitle('Warning')
        .setDescription(reason || 'You have been warned.')
        .addFields({ name: 'Server', value: guild.name })
        .setTimestamp();

      try {
        await user.send({ embeds: [embed] });
      } catch {
        // User may have DMs disabled — still log the case
      }

      const caseId = await createModCase(guildId, userId, getModeratorId(req), 'warn', reason);
      res.json({ success: true, caseId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/moderation/:guildId/unban
  router.post('/:guildId/unban', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const { userId } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    try {
      await guild.members.unban(userId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/moderation/:guildId/cases?page=1
  router.get('/:guildId/cases', async (req, res) => {
    const { client } = req.app.locals;
    const { guildId } = req.params;
    const page = parseInt(req.query.page) || 1;

    try {
      const result = await getModCases(guildId, page);

      // Enrich with usernames
      const enriched = await Promise.all(
        result.cases.map(async (c) => {
          let username = 'Unknown User';
          let moderatorName = 'Unknown';
          try { username = (await client.users.fetch(c.user_id)).username; } catch {}
          try { moderatorName = (await client.users.fetch(c.moderator_id)).username; } catch {}
          return { ...c, username, moderatorName };
        })
      );

      res.json({ ...result, cases: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/moderation/:guildId/cases/:userId
  router.get('/:guildId/cases/:userId', async (req, res) => {
    const { guildId, userId } = req.params;
    const { client } = req.app.locals;

    try {
      const cases = await getModCasesForUser(guildId, userId);

      const enriched = await Promise.all(
        cases.map(async (c) => {
          let username = 'Unknown User';
          let moderatorName = 'Unknown';
          try { username = (await client.users.fetch(c.user_id)).username; } catch {}
          try { moderatorName = (await client.users.fetch(c.moderator_id)).username; } catch {}
          return { ...c, username, moderatorName };
        })
      );

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/moderation/cases/:caseId
  router.delete('/cases/:caseId', async (req, res) => {
    try {
      const deleted = await deleteModCase(req.params.caseId);
      if (!deleted) return res.status(404).json({ error: 'Case not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
