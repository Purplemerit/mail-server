const sgMail = require('@sendgrid/mail');
const config = require('../../config/config');

class SendGridProvider {
  constructor() {
    sgMail.setApiKey(config.email.sendgrid.apiKey);
    this.fromEmail = config.email.sendgrid.fromEmail;
  }

  async send({ to, subject, html, text }) {
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: this.fromEmail,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    };

    try {
      const result = await sgMail.send(msg);
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        provider: 'sendgrid'
      };
    } catch (error) {
      throw new Error(`SendGrid Error: ${error.message}`);
    }
  }

  async sendBulk(emails) {
    const messages = emails.map(email => ({
      to: email.to,
      from: this.fromEmail,
      subject: email.subject,
      text: email.text || email.html.replace(/<[^>]*>/g, ''),
      html: email.html
    }));

    try {
      const result = await sgMail.send(messages);
      return emails.map((email, index) => ({
        email: email.to,
        success: true,
        result: { messageId: result[index].headers['x-message-id'] }
      }));
    } catch (error) {
      throw new Error(`SendGrid Bulk Error: ${error.message}`);
    }
  }
}

module.exports = SendGridProvider;
