const Queue = require('bull');
const config = require('../config/config');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const emailQueue = new Queue('email-queue', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
  }
});

emailQueue.process(async (job) => {
  const { to, subject, html, metadata } = job.data;

  try {
    logger.info(`Processing email job ${job.id} for ${to}`);

    const result = await emailService.send({ to, subject, html });

    logger.info(`Email job ${job.id} completed successfully`);

    return {
      success: true,
      messageId: result.messageId,
      provider: result.provider,
      metadata
    };
  } catch (error) {
    logger.error(`Email job ${job.id} failed: ${error.message}`);
    throw error;
  }
});

emailQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed with result:`, result);
});

emailQueue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed with error:`, error.message);
});

emailQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

async function addEmailToQueue(emailData, options = {}) {
  const jobOptions = {
    attempts: options.attempts || 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false,
    ...options
  };

  const job = await emailQueue.add(emailData, jobOptions);
  logger.info(`Email job ${job.id} added to queue for ${emailData.to}`);

  return job;
}

async function addBulkEmailsToQueue(emails, options = {}) {
  const jobs = emails.map(email => ({
    data: email,
    opts: {
      attempts: options.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false,
      ...options
    }
  }));

  const addedJobs = await emailQueue.addBulk(jobs);
  logger.info(`${addedJobs.length} email jobs added to queue`);

  return addedJobs;
}

async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

async function clearQueue() {
  await emailQueue.empty();
  logger.info('Email queue cleared');
}

async function pauseQueue() {
  await emailQueue.pause();
  logger.info('Email queue paused');
}

async function resumeQueue() {
  await emailQueue.resume();
  logger.info('Email queue resumed');
}

module.exports = {
  emailQueue,
  addEmailToQueue,
  addBulkEmailsToQueue,
  getQueueStats,
  clearQueue,
  pauseQueue,
  resumeQueue
};
