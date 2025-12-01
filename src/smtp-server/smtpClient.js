const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class CustomSMTPClient {
  constructor(config) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 2525,
      secure: config.secure || false,
      auth: config.auth || null,
      pool: config.pool || true,
      maxConnections: config.maxConnections || 5,
      maxMessages: config.maxMessages || 100,
      rateDelta: config.rateDelta || 1000,
      rateLimit: config.rateLimit || 10
    };

    this.transporter = nodemailer.createTransport(this.config);
    this.stats = {
      sent: 0,
      failed: 0,
      totalBytes: 0
    };
  }

  async send({ from, to, subject, html, text, attachments = [] }) {
    const mailOptions = {
      from: from || this.config.from,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
      attachments
    };

    try {
      logger.info(`Sending email via custom SMTP to: ${to}`);

      const info = await this.transporter.sendMail(mailOptions);

      this.stats.sent++;
      this.stats.totalBytes += (html || text || '').length;

      logger.info(`Email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        provider: 'custom-smtp'
      };
    } catch (error) {
      this.stats.failed++;
      logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendBulk(emails) {
    const results = [];

    for (const email of emails) {
      try {
        const result = await this.send(email);
        results.push({
          email: email.to,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          email: email.to,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async verify() {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return {
        success: true,
        message: 'SMTP connection verified successfully'
      };
    } catch (error) {
      logger.error(`SMTP verification failed: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.sent > 0
        ? ((this.stats.sent / (this.stats.sent + this.stats.failed)) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  resetStats() {
    this.stats = {
      sent: 0,
      failed: 0,
      totalBytes: 0
    };
  }

  close() {
    this.transporter.close();
    logger.info('SMTP client connection closed');
  }
}

module.exports = CustomSMTPClient;
