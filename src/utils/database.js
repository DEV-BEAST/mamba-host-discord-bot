import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
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
  console.log('✓ Database initialized (user_xp table ready)');
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

export async function getGuildLeaderboard(guildId, limit = 100) {
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT user_id, xp, messages FROM user_xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?',
    [guildId, String(limit)]
  );
  return rows;
}
