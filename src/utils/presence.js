import { ActivityType } from 'discord.js';

/**
 * Rich Presence Manager for Discord Bot
 * Handles dynamic status updates and activity rotation
 */

const presenceActivities = [
  {
    name: 'Mamba Host Services',
    type: ActivityType.Watching,
  },
  {
    name: '/status for uptime info',
    type: ActivityType.Playing,
  },
  {
    name: 'server status',
    type: ActivityType.Watching,
  },
  {
    name: 'your infrastructure',
    type: ActivityType.Watching,
  },
  {
    name: '/help for commands',
    type: ActivityType.Listening,
  },
];

let currentActivityIndex = 0;
let presenceInterval = null;

/**
 * Set initial bot presence
 */
export function setInitialPresence(client) {
  try {
    const activity = presenceActivities[0];
    client.user.setPresence({
      activities: [{
        name: activity.name,
        type: activity.type,
      }],
      status: 'online',
    });
    console.log('✓ Bot presence set successfully');
  } catch (error) {
    console.error('Error setting initial presence:', error);
  }
}

/**
 * Start rotating presence activities
 * @param {Client} client - Discord.js client instance
 * @param {number} interval - Rotation interval in milliseconds (default: 30 seconds)
 */
export function startPresenceRotation(client, interval = 30000) {
  // Clear any existing interval
  if (presenceInterval) {
    clearInterval(presenceInterval);
  }

  // Set initial presence
  setInitialPresence(client);

  // Start rotation
  presenceInterval = setInterval(() => {
    try {
      currentActivityIndex = (currentActivityIndex + 1) % presenceActivities.length;
      const activity = presenceActivities[currentActivityIndex];

      client.user.setPresence({
        activities: [{
          name: activity.name,
          type: activity.type,
        }],
        status: 'online',
      });

      console.log(`[Presence] Rotated to: ${activity.name} (${getActivityTypeName(activity.type)})`);
    } catch (error) {
      console.error('Error rotating presence:', error);
    }
  }, interval);

  console.log(`✓ Presence rotation started (every ${interval / 1000}s)`);
}

/**
 * Stop presence rotation
 */
export function stopPresenceRotation() {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
    console.log('✓ Presence rotation stopped');
  }
}

/**
 * Set custom presence with dynamic data
 * @param {Client} client - Discord.js client instance
 * @param {Object} options - Presence options
 */
export function setCustomPresence(client, options = {}) {
  try {
    const {
      name = 'Mamba Host',
      type = ActivityType.Watching,
      status = 'online',
      url = null,
    } = options;

    const activity = {
      name,
      type,
    };

    // Add URL for streaming type
    if (type === ActivityType.Streaming && url) {
      activity.url = url;
    }

    client.user.setPresence({
      activities: [activity],
      status,
    });

    console.log(`✓ Custom presence set: ${name} (${getActivityTypeName(type)})`);
  } catch (error) {
    console.error('Error setting custom presence:', error);
  }
}

/**
 * Set presence with server statistics
 * @param {Client} client - Discord.js client instance
 */
export function setStatisticsPresence(client) {
  try {
    const serverCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;

    client.user.setPresence({
      activities: [{
        name: `${serverCount} servers | ${userCount} users`,
        type: ActivityType.Watching,
      }],
      status: 'online',
    });

    console.log(`✓ Statistics presence set: ${serverCount} servers, ${userCount} users`);
  } catch (error) {
    console.error('Error setting statistics presence:', error);
  }
}

/**
 * Add custom activity to rotation
 * @param {Object} activity - Activity object with name and type
 */
export function addActivityToRotation(activity) {
  if (activity && activity.name && activity.type !== undefined) {
    presenceActivities.push(activity);
    console.log(`✓ Added activity to rotation: ${activity.name}`);
  } else {
    console.error('Invalid activity object. Must have name and type properties.');
  }
}

/**
 * Get human-readable activity type name
 */
function getActivityTypeName(type) {
  const types = {
    [ActivityType.Playing]: 'Playing',
    [ActivityType.Streaming]: 'Streaming',
    [ActivityType.Listening]: 'Listening',
    [ActivityType.Watching]: 'Watching',
    [ActivityType.Competing]: 'Competing',
  };
  return types[type] || 'Unknown';
}

/**
 * Get current presence configuration
 */
export function getCurrentPresence() {
  return {
    currentActivity: presenceActivities[currentActivityIndex],
    totalActivities: presenceActivities.length,
    isRotating: presenceInterval !== null,
  };
}
