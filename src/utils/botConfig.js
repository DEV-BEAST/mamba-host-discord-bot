/**
 * Mutable runtime configuration store with MariaDB persistence.
 * Allows the dashboard to change bot settings at runtime.
 * Settings are saved to the bot_settings table and restored on startup.
 */

import { getAllSettings, setSetting } from './database.js';

const defaults = {
  autoRoleId: null,
  welcome: {
    enabled: false,
    channelId: null,
    guildId: null,
    message: 'Welcome {user} to **{server}**! You are member #{memberCount}.',
  },
  presence: {
    name: 'Game Servers | Discord Bots | VPS',
    type: 'streaming',
    status: 'online',
    url: 'https://www.mambahost.com/',
  },
};

const botConfig = {
  autoRoleId: defaults.autoRoleId,
  welcome: { ...defaults.welcome },
  presence: { ...defaults.presence },
  commandPrefix: '!',
  commandsRun: 0,

  /** Persist current settings to database */
  async save() {
    try {
      await Promise.all([
        setSetting('autoRoleId', this.autoRoleId),
        setSetting('welcome', this.welcome),
        setSetting('presence', this.presence),
      ]);
    } catch (err) {
      console.error('Failed to save config to database:', err.message);
    }
  },
};

/**
 * Load saved settings from database into the in-memory config.
 * Call after initDatabase().
 */
export async function initBotConfig() {
  try {
    const saved = await getAllSettings();
    if (saved.autoRoleId !== undefined) botConfig.autoRoleId = saved.autoRoleId;
    if (saved.welcome) botConfig.welcome = { ...defaults.welcome, ...saved.welcome };
    if (saved.presence) botConfig.presence = { ...defaults.presence, ...saved.presence };
    console.log('✓ Bot config loaded from database');
  } catch (err) {
    console.error('Failed to load config from database, using defaults:', err.message);
  }
}

export default botConfig;
