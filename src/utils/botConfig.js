/**
 * Mutable runtime configuration store
 * Allows the dashboard to change bot settings at runtime
 */

const botConfig = {
  // Auto-role: role ID to assign on member join
  autoRoleId: '1427706395163099153',

  // Welcome messages
  welcome: {
    enabled: false,
    channelId: null,
    guildId: null,
    message: 'Welcome {user} to **{server}**! You are member #{memberCount}.',
  },

  // Presence (mirrors what was set via command or dashboard)
  presence: {
    name: 'Game Servers | Discord Bots | VPS',
    type: 'streaming',
    status: 'online',
    url: 'https://www.mambahost.com/',
  },

  // Track command executions
  commandsRun: 0,
};

export default botConfig;
