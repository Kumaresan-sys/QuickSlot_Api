const authService = require("./auth.service");
const { registerSchema, loginSchema } = require("../../validators/auth.validator");

/**
 * Register a new user.
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Registration payload.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
async function register(req, res, next) {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: validation.error.flatten() 
      });
    }

    const user = await authService.register(validation.data);
    res.status(201).json({
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in a user.
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Login payload.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
async function login(req, res, next) {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: validation.error.flatten() 
      });
    }

    const result = await authService.login(validation.data);
    res.status(200).json({
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.status(200).json({
      message: "Token refreshed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
