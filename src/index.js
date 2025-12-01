const express = require('express');
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const emailRoutes = require('./routes/emailRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const healthRoutes = require('./routes/healthRoutes');
const smtpRoutes = require('./routes/smtpRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.use('/health', healthRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/smtp', smtpRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Email Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      email: '/api/email',
      analytics: '/api/analytics',
      smtp: '/api/smtp'
    },
    documentation: {
      sendEmail: 'POST /api/email/send',
      sendOTP: 'POST /api/email/send-otp',
      sendPasswordReset: 'POST /api/email/send-password-reset',
      sendWelcome: 'POST /api/email/send-welcome',
      sendBulk: 'POST /api/email/send-bulk',
      queueStats: 'GET /api/email/queue/stats',
      analyticsSummary: 'GET /api/analytics/summary',
      analyticsAll: 'GET /api/analytics/full',
      dnsCheck: 'POST /api/smtp/dns/check',
      generateSPF: 'POST /api/smtp/dns/generate-spf',
      generateDMARC: 'POST /api/smtp/dns/generate-dmarc'
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`Email service started on port ${PORT}`);
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`Email provider: ${config.email.provider}`);
  console.log(`\n🚀 Email Service is running on http://localhost:${PORT}`);
  console.log(`📧 Provider: ${config.email.provider}`);
  console.log(`📊 Documentation: http://localhost:${PORT}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;
