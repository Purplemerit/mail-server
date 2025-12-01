const nodemailer = require('nodemailer');
const config = require('../../config/config');

class SMTPProvider {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: config.email.smtp.auth
    });
    this.fromEmail = config.email.smtp.fromEmail;
  }

  async send({ to, subject, html, text }) {
    const mailOptions = {
      from: this.fromEmail,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp'
      };
    } catch (error) {
      throw new Error(`SMTP Error: ${error.message}`);
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

  async verify() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = SMTPProvider;
