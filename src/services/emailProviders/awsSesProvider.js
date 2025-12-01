const AWS = require('aws-sdk');
const config = require('../../config/config');

class AWSSESProvider {
  constructor() {
    AWS.config.update({
      region: config.email.aws.region,
      accessKeyId: config.email.aws.accessKeyId,
      secretAccessKey: config.email.aws.secretAccessKey
    });

    this.ses = new AWS.SES({ apiVersion: '2010-12-01' });
    this.fromEmail = config.email.aws.fromEmail;
  }

  async send({ to, subject, html, text }) {
    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8'
          },
          Text: {
            Data: text || html.replace(/<[^>]*>/g, ''),
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-ses'
      };
    } catch (error) {
      throw new Error(`AWS SES Error: ${error.message}`);
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

module.exports = AWSSESProvider;
