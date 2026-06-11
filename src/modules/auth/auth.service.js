const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const AppError = require("../../utils/appError");

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Register a new user.
 * @param {Object} payload - Registration data.
 * @param {string} payload.name - User's full name.
 * @param {string} payload.email - User's email address.
 * @param {string} payload.password - Plain text password.
 * @throws {AppError} If user with email already exists.
 * @returns {Promise<Object>} Created user object.
 */
async function register(payload) {
  const { name, email, password } = payload;
  
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await authRepository.createUser({ name, email, passwordHash });
  return user;
}

/**
 * Authenticate a user and issue access & refresh tokens.
 * @param {Object} payload - Login credentials.
 * @param {string} payload.email - User's email address.
 * @param {string} payload.password - Plain text password.
 * @throws {AppError} If credentials are invalid.
 * @returns {Promise<Object>} Object containing user info and tokens.
 */
async function login(payload) {
  const { email, password } = payload;
  
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  const tokenHash = hashToken(refreshToken);
  
  // Calculate expiration date for DB
  const decodedRefresh = jwt.decode(refreshToken);
  const expiresAt = new Date(decodedRefresh.exp * 1000);

  await authRepository.createRefreshToken(user.id, tokenHash, expiresAt);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken
  };
}

/**
 * Refresh an access token using a valid refresh token.
 * @param {string} refreshToken - The refresh token issued during login.
 * @throws {AppError} If token is missing, invalid, or expired.
 * @returns {Promise<Object>} Object containing a new access token.
 */
async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const activeToken = await authRepository.findActiveRefreshToken(tokenHash);
  
  if (!activeToken) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await authRepository.findUserById(decoded.userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const newAccessToken = generateAccessToken(user);
  
  return { accessToken: newAccessToken };
}

async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }
  const tokenHash = hashToken(refreshToken);
  await authRepository.revokeRefreshToken(tokenHash);
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
