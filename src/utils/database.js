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
  console.log('✓ Database initialized (user_xp, mod_cases tables ready)');
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

export async function getGuildLeaderboard(guildId, limit = 100) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT user_id, xp, messages FROM user_xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?',
    [guildId, String(limit)]
  );
  return rows;
}
