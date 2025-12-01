const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email service is running',
    timestamp: new Date().toISOString()
  });
});

router.get('/verify', async (req, res, next) => {
  try {
    const result = await emailService.verify();
    res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    logger.error('Error verifying email service:', error);
    next(error);
  }
});

module.exports = router;
