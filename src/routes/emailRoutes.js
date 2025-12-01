const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const emailTemplates = require('../templates/emailTemplates');
const { addEmailToQueue, addBulkEmailsToQueue, getQueueStats } = require('../queues/emailQueue');
const analyticsService = require('../services/analyticsService');
const validators = require('../utils/validators');
const { emailRateLimiter, bulkEmailRateLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

router.post('/send', emailRateLimiter, async (req, res, next) => {
  try {
    const { error, value } = validators.validateEmail(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { to, subject, html, useQueue = true } = value;

    if (useQueue) {
      const job = await addEmailToQueue({ to, subject, html });
      return res.status(202).json({
        success: true,
        message: 'Email queued successfully',
        jobId: job.id
      });
    } else {
      const result = await emailService.send({ to, subject, html });
      await analyticsService.trackEmailSent({
        to,
        provider: result.provider,
        success: true,
        messageId: result.messageId
      });

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        provider: result.provider
      });
    }
  } catch (error) {
    logger.error('Error sending email:', error);
    await analyticsService.trackEmailSent({
      to: req.body.to,
      success: false
    });
    next(error);
  }
});

router.post('/send-otp', emailRateLimiter, async (req, res, next) => {
  try {
    const { error, value } = validators.validateOTP(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const emailData = await emailTemplates.sendOTP(value);
    const job = await addEmailToQueue({
      ...emailData,
      metadata: { template: 'otp' }
    });

    await analyticsService.trackEmailSent({
      to: value.to,
      template: 'otp',
      success: true,
      messageId: job.id
    });

    res.status(202).json({
      success: true,
      message: 'OTP email queued successfully',
      jobId: job.id
    });
  } catch (error) {
    logger.error('Error sending OTP email:', error);
    next(error);
  }
});

router.post('/send-password-reset', emailRateLimiter, async (req, res, next) => {
  try {
    const { error, value } = validators.validatePasswordReset(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const emailData = await emailTemplates.sendPasswordReset(value);
    const job = await addEmailToQueue({
      ...emailData,
      metadata: { template: 'password-reset' }
    });

    await analyticsService.trackEmailSent({
      to: value.to,
      template: 'password-reset',
      success: true,
      messageId: job.id
    });

    res.status(202).json({
      success: true,
      message: 'Password reset email queued successfully',
      jobId: job.id
    });
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    next(error);
  }
});

router.post('/send-welcome', emailRateLimiter, async (req, res, next) => {
  try {
    const { error, value } = validators.validateWelcome(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const emailData = await emailTemplates.sendWelcome(value);
    const job = await addEmailToQueue({
      ...emailData,
      metadata: { template: 'welcome' }
    });

    await analyticsService.trackEmailSent({
      to: value.to,
      template: 'welcome',
      success: true,
      messageId: job.id
    });

    res.status(202).json({
      success: true,
      message: 'Welcome email queued successfully',
      jobId: job.id
    });
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    next(error);
  }
});

router.post('/send-bulk', bulkEmailRateLimiter, async (req, res, next) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'emails must be a non-empty array'
      });
    }

    if (emails.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 emails allowed per bulk request'
      });
    }

    for (const email of emails) {
      const { error } = validators.validateEmail(email);
      if (error) {
        return res.status(400).json({
          success: false,
          error: `Invalid email data: ${error.details[0].message}`
        });
      }
    }

    const jobs = await addBulkEmailsToQueue(emails);

    res.status(202).json({
      success: true,
      message: `${jobs.length} emails queued successfully`,
      jobIds: jobs.map(job => job.id)
    });
  } catch (error) {
    logger.error('Error sending bulk emails:', error);
    next(error);
  }
});

router.get('/queue/stats', async (req, res, next) => {
  try {
    const stats = await getQueueStats();
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    next(error);
  }
});

module.exports = router;
