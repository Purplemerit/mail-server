const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.analyticsFile = path.join(__dirname, '../../data/analytics.json');
    this.initializeAnalytics();
  }

  async initializeAnalytics() {
    try {
      const dir = path.dirname(this.analyticsFile);
      await fs.mkdir(dir, { recursive: true });

      try {
        await fs.access(this.analyticsFile);
      } catch {
        await fs.writeFile(this.analyticsFile, JSON.stringify({
          totalSent: 0,
          totalFailed: 0,
          byProvider: {},
          byTemplate: {},
          byDay: {},
          recentEmails: []
        }, null, 2));
      }
    } catch (error) {
      logger.error('Failed to initialize analytics:', error);
    }
  }

  async readAnalytics() {
    try {
      const data = await fs.readFile(this.analyticsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read analytics:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        byProvider: {},
        byTemplate: {},
        byDay: {},
        recentEmails: []
      };
    }
  }

  async writeAnalytics(data) {
    try {
      await fs.writeFile(this.analyticsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error('Failed to write analytics:', error);
    }
  }

  async trackEmailSent({ to, provider, template, success, messageId }) {
    try {
      const analytics = await this.readAnalytics();
      const today = new Date().toISOString().split('T')[0];

      if (success) {
        analytics.totalSent += 1;
      } else {
        analytics.totalFailed += 1;
      }

      analytics.byProvider[provider] = (analytics.byProvider[provider] || 0) + 1;

      if (template) {
        analytics.byTemplate[template] = (analytics.byTemplate[template] || 0) + 1;
      }

      analytics.byDay[today] = (analytics.byDay[today] || 0) + 1;

      analytics.recentEmails.unshift({
        to,
        provider,
        template,
        success,
        messageId,
        timestamp: new Date().toISOString()
      });

      if (analytics.recentEmails.length > 100) {
        analytics.recentEmails = analytics.recentEmails.slice(0, 100);
      }

      await this.writeAnalytics(analytics);
    } catch (error) {
      logger.error('Failed to track email:', error);
    }
  }

  async getAnalytics() {
    return await this.readAnalytics();
  }

  async getAnalyticsSummary() {
    const analytics = await this.readAnalytics();

    const last7Days = {};
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = analytics.byDay[dateStr] || 0;
    }

    return {
      total: {
        sent: analytics.totalSent,
        failed: analytics.totalFailed,
        successRate: analytics.totalSent > 0
          ? ((analytics.totalSent / (analytics.totalSent + analytics.totalFailed)) * 100).toFixed(2) + '%'
          : '0%'
      },
      byProvider: analytics.byProvider,
      byTemplate: analytics.byTemplate,
      last7Days,
      recentEmails: analytics.recentEmails.slice(0, 10)
    };
  }

  async resetAnalytics() {
    await this.writeAnalytics({
      totalSent: 0,
      totalFailed: 0,
      byProvider: {},
      byTemplate: {},
      byDay: {},
      recentEmails: []
    });
    logger.info('Analytics reset');
  }
}

module.exports = new AnalyticsService();
