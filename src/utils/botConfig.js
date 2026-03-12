/**
 * Mutable runtime configuration store with file persistence.
 * Allows the dashboard to change bot settings at runtime.
 * Settings are saved to data/config.json and restored on startup.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CONFIG_PATH = join(DATA_DIR, 'config.json');

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

function loadFromDisk() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      const saved = JSON.parse(raw);
      return {
        autoRoleId: saved.autoRoleId ?? defaults.autoRoleId,
        welcome: { ...defaults.welcome, ...saved.welcome },
        presence: { ...defaults.presence, ...saved.presence },
      };
    }
  } catch (err) {
    console.error('Failed to load config from disk, using defaults:', err.message);
  }
  return null;
}

function saveToDisk(config) {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_PATH, JSON.stringify({
      autoRoleId: config.autoRoleId,
      welcome: config.welcome,
      presence: config.presence,
    }, null, 2));
  } catch (err) {
    console.error('Failed to save config to disk:', err.message);
  }
}

// Load saved config or use defaults
const saved = loadFromDisk();

const botConfig = {
  autoRoleId: saved ? saved.autoRoleId : defaults.autoRoleId,
  welcome: saved ? saved.welcome : { ...defaults.welcome },
  presence: saved ? saved.presence : { ...defaults.presence },
  commandsRun: 0,

  /** Persist current settings to disk */
  save() {
    saveToDisk(this);
  },
};

export default botConfig;
