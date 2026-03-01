import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createAuthRouter, requireAuth } from './auth.js';
import { createStatsRouter } from './routes/api-stats.js';
import { createGuildsRouter } from './routes/api-guilds.js';
import { createSettingsRouter } from './routes/api-settings.js';
import { createEmbedRouter } from './routes/api-embed.js';
import { createLeaderboardRouter } from './routes/api-leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start the Express dashboard server
 * @param {Client} client - Discord.js client
 * @param {Object} botConfig - Mutable bot configuration
 */
export function startDashboard(client, botConfig) {
  const app = express();
  const port = process.env.SERVER_PORT || process.env.PORT || 3000;

  // Store references for route access
  app.locals.client = client;
  app.locals.botConfig = botConfig;

  // Middleware
  app.use(express.json());
  app.use(session({
    secret: 'Beast1987!?-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
    },
  }));

  // Static files
  const publicPath = join(__dirname, '..', '..', 'dashboard', 'public');
  app.use(express.static(publicPath));

  // Auth routes (no auth required)
  app.use('/api/auth', createAuthRouter());

  // Protected API routes
  app.use('/api/stats', requireAuth, createStatsRouter());
  app.use('/api/guilds', requireAuth, createGuildsRouter());
  app.use('/api/settings', requireAuth, createSettingsRouter());
  app.use('/api/embed', requireAuth, createEmbedRouter());
  app.use('/api/leaderboard', requireAuth, createLeaderboardRouter());

  // SPA fallback — serve index.html for non-API routes
  app.get('*', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`✓ Dashboard running at http://localhost:${port}`);
  });
}
