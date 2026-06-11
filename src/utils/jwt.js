const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7}d` }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
