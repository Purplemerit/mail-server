require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'aws-ses',

    aws: {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      fromEmail: process.env.AWS_SES_FROM_EMAIL
    },

    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL
    },

    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
      fromEmail: process.env.MAILGUN_FROM_EMAIL
    },

    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      fromEmail: process.env.SMTP_FROM_EMAIL
    },

    customSmtp: {
      host: process.env.CUSTOM_SMTP_HOST || 'localhost',
      port: parseInt(process.env.CUSTOM_SMTP_PORT) || 2525,
      secure: process.env.CUSTOM_SMTP_SECURE === 'true',
      auth: process.env.CUSTOM_SMTP_AUTH_REQUIRED !== 'false' ? {
        user: process.env.CUSTOM_SMTP_USER,
        pass: process.env.CUSTOM_SMTP_PASS
      } : null,
      fromEmail: process.env.CUSTOM_SMTP_FROM_EMAIL
    }
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  app: {
    name: process.env.APP_NAME || 'Email Service',
    url: process.env.APP_URL || 'http://localhost:3000'
  }
};
