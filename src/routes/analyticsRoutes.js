const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

router.get('/summary', async (req, res, next) => {
  try {
    const summary = await analyticsService.getAnalyticsSummary();
    res.status(200).json({
      success: true,
      analytics: summary
    });
  } catch (error) {
    logger.error('Error getting analytics summary:', error);
    next(error);
  }
});

router.get('/full', async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAnalytics();
    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Error getting full analytics:', error);
    next(error);
  }
});

router.post('/reset', async (req, res, next) => {
  try {
    await analyticsService.resetAnalytics();
    res.status(200).json({
      success: true,
      message: 'Analytics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting analytics:', error);
    next(error);
  }
});

module.exports = router;
