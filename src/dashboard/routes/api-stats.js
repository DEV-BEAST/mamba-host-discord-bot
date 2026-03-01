import { Router } from 'express';

export function createStatsRouter() {
  const router = Router();

  // GET /api/stats
  router.get('/', (req, res) => {
    const { client, botConfig } = req.app.locals;

    const guilds = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    const channels = client.channels.cache.size;
    const uptime = client.uptime; // ms
    const ping = client.ws.ping;
    const memory = process.memoryUsage();

    res.json({
      guilds,
      users,
      channels,
      uptime,
      ping,
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024),
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      },
      commandsRun: botConfig.commandsRun,
      nodeVersion: process.version,
    });
  });

  return router;
}
