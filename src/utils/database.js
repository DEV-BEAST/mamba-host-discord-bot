import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const url = new URL(process.env.DATABASE_URL);
    pool = mysql.createPool({
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
    });
  }
  return pool;
}

export async function initDatabase() {
  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_xp (
      guild_id VARCHAR(20) NOT NULL,
      user_id VARCHAR(20) NOT NULL,
      xp INT DEFAULT 0,
      messages INT DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mod_cases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      user_id VARCHAR(20) NOT NULL,
      moderator_id VARCHAR(20) NOT NULL,
      action ENUM('ban','kick','timeout','warn') NOT NULL,
      reason TEXT,
      duration INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_guild (guild_id),
      INDEX idx_user (guild_id, user_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reaction_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      channel_id VARCHAR(20) NOT NULL,
      message_id VARCHAR(20) NOT NULL,
      emoji VARCHAR(64) NOT NULL,
      role_id VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_reaction (message_id, emoji),
      INDEX idx_guild (guild_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_commands (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      name VARCHAR(50) NOT NULL,
      response TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_cmd (guild_id, name),
      INDEX idx_guild (guild_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      channel_id VARCHAR(20) NOT NULL,
      content TEXT DEFAULT NULL,
      embed_json TEXT DEFAULT NULL,
      send_at DATETIME NOT NULL,
      recurrence ENUM('once','daily','weekly') DEFAULT 'once',
      is_active TINYINT(1) DEFAULT 1,
      last_sent_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_guild (guild_id),
      INDEX idx_active (is_active, send_at)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS server_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      member_count INT NOT NULL DEFAULT 0,
      messages_today INT NOT NULL DEFAULT 0,
      recorded_at DATETIME NOT NULL,
      INDEX idx_guild_time (guild_id, recorded_at)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS message_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      channel_id VARCHAR(20) NOT NULL,
      message_date DATE NOT NULL,
      message_count INT NOT NULL DEFAULT 1,
      UNIQUE KEY unique_activity (guild_id, channel_id, message_date),
      INDEX idx_guild_date (guild_id, message_date)
    )
  `);
  console.log('✓ Database initialized (all tables ready)');
}

export async function getUser(guildId, userId) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT xp, messages FROM user_xp WHERE guild_id = ? AND user_id = ?',
    [guildId, userId]
  );
  return rows.length > 0 ? rows[0] : { xp: 0, messages: 0 };
}

export async function updateUser(guildId, userId, xp, messages) {
  const db = getPool();
  await db.execute(
    `INSERT INTO user_xp (guild_id, user_id, xp, messages)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE xp = ?, messages = ?`,
    [guildId, userId, xp, messages, xp, messages]
  );
}

export async function deleteUser(guildId, userId) {
  const db = getPool();
  const [result] = await db.execute(
    'DELETE FROM user_xp WHERE guild_id = ? AND user_id = ?',
    [guildId, userId]
  );
  return result.affectedRows > 0;
}

export async function createModCase(guildId, userId, moderatorId, action, reason, duration = null) {
  const db = getPool();
  const [result] = await db.execute(
    'INSERT INTO mod_cases (guild_id, user_id, moderator_id, action, reason, duration) VALUES (?, ?, ?, ?, ?, ?)',
    [guildId, userId, moderatorId, action, reason || null, duration]
  );
  return result.insertId;
}

export async function getModCases(guildId, page = 1, limit = 20) {
  const db = getPool();
  const offset = (page - 1) * limit;
  const [rows] = await db.execute(
    'SELECT * FROM mod_cases WHERE guild_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [guildId, String(limit), String(offset)]
  );
  const [[{ total }]] = await db.execute(
    'SELECT COUNT(*) as total FROM mod_cases WHERE guild_id = ?',
    [guildId]
  );
  return { cases: rows, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getModCasesForUser(guildId, userId) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT * FROM mod_cases WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC',
    [guildId, userId]
  );
  return rows;
}

export async function deleteModCase(caseId) {
  const db = getPool();
  const [result] = await db.execute('DELETE FROM mod_cases WHERE id = ?', [String(caseId)]);
  return result.affectedRows > 0;
}

export async function setSetting(key, value) {
  const db = getPool();
  const val = JSON.stringify(value);
  await db.execute(
    'INSERT INTO bot_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [key, val, val]
  );
}

export async function getAllSettings() {
  const db = getPool();
  const [rows] = await db.execute('SELECT setting_key, setting_value FROM bot_settings');
  const settings = {};
  for (const row of rows) {
    try { settings[row.setting_key] = JSON.parse(row.setting_value); } catch { settings[row.setting_key] = row.setting_value; }
  }
  return settings;
}

export async function getGuildLeaderboard(guildId, limit = 100) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT user_id, xp, messages FROM user_xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?',
    [guildId, String(limit)]
  );
  return rows;
}

// ── Reaction Roles ──

export async function getReactionRoles(guildId) {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM reaction_roles WHERE guild_id = ? ORDER BY created_at DESC', [guildId]);
  return rows;
}

export async function getReactionRoleByMessageAndEmoji(messageId, emoji) {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?', [messageId, emoji]);
  return rows.length > 0 ? rows[0] : null;
}

export async function createReactionRole(guildId, channelId, messageId, emoji, roleId) {
  const db = getPool();
  const [result] = await db.execute(
    'INSERT INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id) VALUES (?, ?, ?, ?, ?)',
    [guildId, channelId, messageId, emoji, roleId]
  );
  return result.insertId;
}

export async function deleteReactionRole(id) {
  const db = getPool();
  const [result] = await db.execute('DELETE FROM reaction_roles WHERE id = ?', [String(id)]);
  return result.affectedRows > 0;
}

// ── Custom Commands ──

export async function getCustomCommands(guildId) {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM custom_commands WHERE guild_id = ? ORDER BY name ASC', [guildId]);
  return rows;
}

export async function getCustomCommand(guildId, name) {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM custom_commands WHERE guild_id = ? AND name = ?', [guildId, name]);
  return rows.length > 0 ? rows[0] : null;
}

export async function createCustomCommand(guildId, name, response) {
  const db = getPool();
  const [result] = await db.execute(
    'INSERT INTO custom_commands (guild_id, name, response) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE response = ?',
    [guildId, name, response, response]
  );
  return result.insertId;
}

export async function deleteCustomCommand(id) {
  const db = getPool();
  const [result] = await db.execute('DELETE FROM custom_commands WHERE id = ?', [String(id)]);
  return result.affectedRows > 0;
}

// ── Scheduled Messages ──

export async function getScheduledMessages(guildId) {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM scheduled_messages WHERE guild_id = ? ORDER BY send_at ASC', [guildId]);
  return rows;
}

export async function getDueScheduledMessages() {
  const db = getPool();
  const [rows] = await db.execute('SELECT * FROM scheduled_messages WHERE is_active = 1 AND send_at <= NOW()');
  return rows;
}

export async function createScheduledMessage(guildId, channelId, content, embedJson, sendAt, recurrence) {
  const db = getPool();
  const [result] = await db.execute(
    'INSERT INTO scheduled_messages (guild_id, channel_id, content, embed_json, send_at, recurrence) VALUES (?, ?, ?, ?, ?, ?)',
    [guildId, channelId, content || null, embedJson || null, sendAt, recurrence || 'once']
  );
  return result.insertId;
}

export async function updateScheduledMessageSent(id, recurrence) {
  const db = getPool();
  if (recurrence === 'daily') {
    await db.execute('UPDATE scheduled_messages SET last_sent_at = NOW(), send_at = DATE_ADD(send_at, INTERVAL 1 DAY) WHERE id = ?', [String(id)]);
  } else if (recurrence === 'weekly') {
    await db.execute('UPDATE scheduled_messages SET last_sent_at = NOW(), send_at = DATE_ADD(send_at, INTERVAL 7 DAY) WHERE id = ?', [String(id)]);
  } else {
    await db.execute('UPDATE scheduled_messages SET last_sent_at = NOW(), is_active = 0 WHERE id = ?', [String(id)]);
  }
}

export async function deleteScheduledMessage(id) {
  const db = getPool();
  const [result] = await db.execute('DELETE FROM scheduled_messages WHERE id = ?', [String(id)]);
  return result.affectedRows > 0;
}

export async function toggleScheduledMessage(id, isActive) {
  const db = getPool();
  await db.execute('UPDATE scheduled_messages SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, String(id)]);
}

// ── Server Stats ──

export async function recordServerStats(guildId, memberCount, messagesToday) {
  const db = getPool();
  await db.execute(
    'INSERT INTO server_stats (guild_id, member_count, messages_today, recorded_at) VALUES (?, ?, ?, NOW())',
    [guildId, memberCount, messagesToday]
  );
}

export async function getServerStats(guildId, days = 30) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT member_count, messages_today, recorded_at FROM server_stats WHERE guild_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY recorded_at ASC',
    [guildId, String(days)]
  );
  return rows;
}

export async function incrementMessageActivity(guildId, channelId) {
  const db = getPool();
  await db.execute(
    'INSERT INTO message_activity (guild_id, channel_id, message_date, message_count) VALUES (?, ?, CURDATE(), 1) ON DUPLICATE KEY UPDATE message_count = message_count + 1',
    [guildId, channelId]
  );
}

export async function getMessageActivity(guildId, days = 30) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT message_date, SUM(message_count) as total FROM message_activity WHERE guild_id = ? AND message_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY message_date ORDER BY message_date ASC',
    [guildId, String(days)]
  );
  return rows;
}

export async function getChannelActivity(guildId, days = 30) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT channel_id, SUM(message_count) as total FROM message_activity WHERE guild_id = ? AND message_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY channel_id ORDER BY total DESC LIMIT 10',
    [guildId, String(days)]
  );
  return rows;
}
