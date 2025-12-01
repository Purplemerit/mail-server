const mailgun = require('mailgun-js');
const config = require('../../config/config');

class MailgunProvider {
  constructor() {
    this.mg = mailgun({
      apiKey: config.email.mailgun.apiKey,
      domain: config.email.mailgun.domain
    });
    this.fromEmail = config.email.mailgun.fromEmail;
  }

  async send({ to, subject, html, text }) {
    const data = {
      from: this.fromEmail,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    };

    try {
      const result = await this.mg.messages().send(data);
      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun'
      };
    } catch (error) {
      throw new Error(`Mailgun Error: ${error.message}`);
    }
  }

  async sendBulk(emails) {
    const results = await Promise.allSettled(
      emails.map(email => this.send(email))
    );

    return results.map((result, index) => ({
      email: emails[index].to,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason
    }));
  }
}

module.exports = MailgunProvider;
