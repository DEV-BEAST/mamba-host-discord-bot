import { Router } from 'express';
import { setCustomPresence, stopPresenceRotation, getCurrentPresence } from '../../utils/presence.js';

export function createSettingsRouter() {
  const router = Router();

  // GET /api/settings
  router.get('/', (req, res) => {
    const { client, botConfig } = req.app.locals;
    const presenceInfo = getCurrentPresence();

    res.json({
      presence: botConfig.presence,
      presenceInfo,
      autoRoleId: botConfig.autoRoleId,
      welcome: botConfig.welcome,
      bot: {
        username: client.user.username,
        displayName: client.user.displayName || client.user.username,
        avatar: client.user.displayAvatarURL({ size: 128 }),
        discriminator: client.user.discriminator,
      },
    });
  });

  // PUT /api/settings/presence
  router.put('/presence', (req, res) => {
    const { client, botConfig } = req.app.locals;
    const { name, type, status, url } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    // Stop any rotation
    stopPresenceRotation();

    // Update config
    botConfig.presence = { name, type, status: status || 'online', url: url || null };

    // Apply to bot
    setCustomPresence(client, botConfig.presence);
    botConfig.save();

    res.json({ success: true, presence: botConfig.presence });
  });

  // PUT /api/settings/autorole
  router.put('/autorole', (req, res) => {
    const { botConfig } = req.app.locals;
    const { roleId } = req.body;

    botConfig.autoRoleId = roleId || null;
    botConfig.save();
    res.json({ success: true, autoRoleId: botConfig.autoRoleId });
  });

  // PUT /api/settings/welcome
  router.put('/welcome', (req, res) => {
    const { botConfig } = req.app.locals;
    const { enabled, channelId, guildId, message } = req.body;

    if (enabled !== undefined) botConfig.welcome.enabled = enabled;
    if (channelId !== undefined) botConfig.welcome.channelId = channelId;
    if (guildId !== undefined) botConfig.welcome.guildId = guildId;
    if (message !== undefined) botConfig.welcome.message = message;
    botConfig.save();

    res.json({ success: true, welcome: botConfig.welcome });
  });

  return router;
}
