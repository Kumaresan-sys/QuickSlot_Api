const jwt = require('jsonwebtoken');
const authRepository = require('../modules/auth/auth.repository');

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function attachHeaderUser(req, res, next, userId) {
  if (!uuidRegex.test(userId)) {
    return res.status(401).json({
      message: 'Invalid X-User-Id header',
    });
  }

  const user = await authRepository.findUserById(userId);
  if (!user) {
    return res.status(401).json({
      message: 'Unknown X-User-Id user',
    });
  }

  req.user = {
    id: user.id,
    email: user.email,
  };

  return next();
}

async function authMiddleware(req, res, next) {
  try {
    const headerUserId = req.headers['x-user-id'];
    if (typeof headerUserId === 'string' && headerUserId.trim()) {
      return attachHeaderUser(req, res, next, headerUserId.trim());
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access token missing',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired access token',
    });
  }
}

module.exports = authMiddleware;
