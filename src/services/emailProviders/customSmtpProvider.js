const CustomSMTPClient = require('../../smtp-server/smtpClient');
const config = require('../../config/config');

class CustomSMTPProvider {
  constructor() {
    this.client = new CustomSMTPClient({
      host: config.email.customSmtp?.host || 'localhost',
      port: config.email.customSmtp?.port || 2525,
      secure: config.email.customSmtp?.secure || false,
      auth: config.email.customSmtp?.auth || null,
      from: config.email.customSmtp?.fromEmail
    });
  }

  async send({ to, subject, html, text }) {
    try {
      const result = await this.client.send({
        to,
        subject,
        html,
        text
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'custom-smtp',
        response: result.response
      };
    } catch (error) {
      throw new Error(`Custom SMTP Error: ${error.message}`);
    }
  }

  async sendBulk(emails) {
    return await this.client.sendBulk(emails);
  }

  async verify() {
    return await this.client.verify();
  }

  getStats() {
    return this.client.getStats();
  }
}

module.exports = CustomSMTPProvider;
