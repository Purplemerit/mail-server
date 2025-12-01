const templateEngine = require('./templateEngine');
const config = require('../config/config');

class EmailTemplates {
  async sendOTP({ to, userName, otpCode, expiryMinutes = 10 }) {
    const html = await templateEngine.render('otp', {
      appName: config.app.name,
      userName: userName || 'User',
      otpCode,
      expiryMinutes,
      currentYear: new Date().getFullYear()
    });

    return {
      to,
      subject: `Your OTP Code - ${config.app.name}`,
      html
    };
  }

  async sendPasswordReset({ to, userName, resetToken, expiryMinutes = 30 }) {
    const resetLink = `${config.app.url}/reset-password?token=${resetToken}`;

    const html = await templateEngine.render('password-reset', {
      appName: config.app.name,
      userName: userName || 'User',
      resetLink,
      expiryMinutes,
      currentYear: new Date().getFullYear()
    });

    return {
      to,
      subject: `Reset Your Password - ${config.app.name}`,
      html
    };
  }

  async sendWelcome({ to, userName, features = [], ctaLink, ctaText = 'Get Started' }) {
    const html = await templateEngine.render('welcome', {
      appName: config.app.name,
      userName: userName || 'User',
      features,
      ctaLink,
      ctaText,
      currentYear: new Date().getFullYear()
    });

    return {
      to,
      subject: `Welcome to ${config.app.name}!`,
      html
    };
  }

  async sendCustom({ to, subject, templateName, data }) {
    const html = await templateEngine.render(templateName, {
      ...data,
      appName: config.app.name,
      currentYear: new Date().getFullYear()
    });

    return {
      to,
      subject,
      html
    };
  }
}

module.exports = new EmailTemplates();
