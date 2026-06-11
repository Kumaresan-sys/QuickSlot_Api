const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/appError');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function register(payload) {
  const { name, email, password } = payload;
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  return authRepository.createUser({ name, email, passwordHash });
}

async function login(payload) {
  const { email, password } = payload;
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  const decodedRefresh = jwt.decode(refreshToken);
  const expiresAt = new Date(decodedRefresh.exp * 1000);

  await authRepository.createRefreshToken(user.id, tokenHash, expiresAt);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token and rotate the refresh token.
 * The old refresh token is revoked; a new one is issued.
 */
async function refresh(refreshToken) {
  if (!refreshToken) throw new AppError('Refresh token is required', 401);

  const tokenHash = hashToken(refreshToken);
  const activeToken = await authRepository.findActiveRefreshToken(tokenHash);
  if (!activeToken) throw new AppError('Invalid or expired refresh token', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await authRepository.findUserById(decoded.userId);
  if (!user) throw new AppError('User not found', 404);

  // Rotate: revoke old token, issue a new pair
  await authRepository.revokeRefreshToken(tokenHash);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newTokenHash = hashToken(newRefreshToken);
  const decodedNew = jwt.decode(newRefreshToken);
  const expiresAt = new Date(decodedNew.exp * 1000);

  await authRepository.createRefreshToken(user.id, newTokenHash, expiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await authRepository.revokeRefreshToken(tokenHash);
}

module.exports = { register, login, refresh, logout };
