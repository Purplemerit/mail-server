const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const logger = require('../utils/logger');

const emailRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many email requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many email requests from this IP, please try again later.'
    });
  },
  skip: (req) => {
    if (req.ip === '127.0.0.1' || req.ip === '::1') {
      return config.server.env === 'development';
    }
    return false;
  }
});

const strictRateLimiter = rateLimit({
  windowMs: 60000,
  max: 5,
  message: {
    success: false,
    error: 'Too many requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const bulkEmailRateLimiter = rateLimit({
  windowMs: 3600000,
  max: 10,
  message: {
    success: false,
    error: 'Too many bulk email requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  emailRateLimiter,
  strictRateLimiter,
  bulkEmailRateLimiter
};
