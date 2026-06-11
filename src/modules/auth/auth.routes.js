const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { authLimiter, refreshLimiter } = require('../../middlewares/rateLimit.middleware');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
