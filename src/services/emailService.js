const config = require('../config/config');
const AWSSESProvider = require('./emailProviders/awsSesProvider');
const SendGridProvider = require('./emailProviders/sendgridProvider');
const MailgunProvider = require('./emailProviders/mailgunProvider');
const SMTPProvider = require('./emailProviders/smtpProvider');
const CustomSMTPProvider = require('./emailProviders/customSmtpProvider');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.provider = this.initializeProvider();
  }

  initializeProvider() {
    const providerName = config.email.provider;

    logger.info(`Initializing email provider: ${providerName}`);

    switch (providerName) {
      case 'aws-ses':
        return new AWSSESProvider();
      case 'sendgrid':
        return new SendGridProvider();
      case 'mailgun':
        return new MailgunProvider();
      case 'smtp':
        return new SMTPProvider();
      case 'custom-smtp':
        return new CustomSMTPProvider();
      default:
        throw new Error(`Unknown email provider: ${providerName}`);
    }
  }

  async send(emailData) {
    try {
      logger.info(`Sending email to: ${emailData.to}`);
      const result = await this.provider.send(emailData);
      logger.info(`Email sent successfully: ${result.messageId}`);
      return result;
    } catch (error) {
      logger.error(`Email sending failed: ${error.message}`);
      throw error;
    }
  }

  async sendBulk(emails) {
    try {
      logger.info(`Sending ${emails.length} emails in bulk`);
      const results = await this.provider.sendBulk(emails);
      const successCount = results.filter(r => r.success).length;
      logger.info(`Bulk send completed: ${successCount}/${emails.length} successful`);
      return results;
    } catch (error) {
      logger.error(`Bulk email sending failed: ${error.message}`);
      throw error;
    }
  }

  async verify() {
    if (this.provider.verify) {
      return await this.provider.verify();
    }
    return { success: true, message: 'Provider does not support verification' };
  }
}

module.exports = new EmailService();
