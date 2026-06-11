const pool = require('../../config/db');

async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0];
}

async function findUserById(userId) {
  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
  return result.rows[0];
}

async function createRefreshToken(userId, tokenHash, expiresAt) {
  const result = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

async function revokeRefreshToken(tokenHash) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`,
    [tokenHash]
  );
}

async function findActiveRefreshToken(tokenHash) {
  const result = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked = FALSE AND expires_at > CURRENT_TIMESTAMP`,
    [tokenHash]
  );
  return result.rows[0];
}

module.exports = { createUser, findUserByEmail, findUserById, createRefreshToken, revokeRefreshToken, findActiveRefreshToken };
