const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class CustomSMTPServer {
  constructor(options = {}) {
    this.port = options.port || 2525;
    this.host = options.host || '0.0.0.0';
    this.domain = options.domain || 'localhost';
    this.authRequired = options.authRequired !== false;
    this.users = new Map();
    this.inboxDir = path.join(__dirname, '../../data/inbox');
    this.initializeInbox();

    this.server = new SMTPServer({
      banner: `${this.domain} SMTP Server Ready`,

      // Authentication
      authOptional: !this.authRequired,

      onAuth: (auth, session, callback) => {
        if (!this.authRequired) {
          return callback(null, { user: 'anonymous' });
        }

        const username = auth.username;
        const password = auth.password;

        logger.info(`SMTP auth attempt for user: ${username}`);

        const user = this.users.get(username);
        if (user && user.password === password) {
          logger.info(`SMTP auth successful for: ${username}`);
          callback(null, { user: username });
        } else {
          logger.warn(`SMTP auth failed for: ${username}`);
          callback(new Error('Invalid username or password'));
        }
      },

      // Connection validation
      onConnect: (session, callback) => {
        logger.info(`SMTP connection from ${session.remoteAddress}`);
        callback();
      },

      // Sender validation
      onMailFrom: (address, session, callback) => {
        logger.info(`SMTP MAIL FROM: ${address.address}`);
        callback();
      },

      // Recipient validation
      onRcptTo: (address, session, callback) => {
        logger.info(`SMTP RCPT TO: ${address.address}`);
        callback();
      },

      // Message handling
      onData: async (stream, session, callback) => {
        try {
          let emailData = '';

          stream.on('data', (chunk) => {
            emailData += chunk.toString();
          });

          stream.on('end', async () => {
            try {
              const parsed = await simpleParser(emailData);

              logger.info(`Email received: ${parsed.subject} from ${parsed.from.text}`);

              await this.saveEmail(parsed, session);

              logger.info(`Email saved successfully`);
              callback();
            } catch (error) {
              logger.error(`Error parsing email: ${error.message}`);
              callback(new Error('Failed to process email'));
            }
          });

          stream.on('error', (error) => {
            logger.error(`Stream error: ${error.message}`);
            callback(error);
          });
        } catch (error) {
          logger.error(`Error in onData: ${error.message}`);
          callback(error);
        }
      },

      // TLS/SSL (optional - for production you'd add proper certificates)
      secure: false,
      disabledCommands: ['STARTTLS'],

      // Size limits
      size: 10 * 1024 * 1024, // 10MB max

      // Timeouts
      socketTimeout: 60000,
      closeTimeout: 30000
    });

    this.setupErrorHandlers();
  }

  async initializeInbox() {
    try {
      await fs.mkdir(this.inboxDir, { recursive: true });
      logger.info(`Inbox directory created at: ${this.inboxDir}`);
    } catch (error) {
      logger.error(`Failed to create inbox directory: ${error.message}`);
    }
  }

  async saveEmail(parsed, session) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}_${parsed.messageId || Date.now()}.json`;
    const filepath = path.join(this.inboxDir, filename);

    const emailData = {
      messageId: parsed.messageId,
      from: parsed.from.text,
      to: parsed.to ? parsed.to.text : '',
      cc: parsed.cc ? parsed.cc.text : '',
      subject: parsed.subject,
      date: parsed.date,
      text: parsed.text,
      html: parsed.html,
      attachments: parsed.attachments ? parsed.attachments.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size
      })) : [],
      headers: Object.fromEntries(parsed.headers),
      receivedAt: new Date().toISOString(),
      session: {
        remoteAddress: session.remoteAddress,
        user: session.user
      }
    };

    await fs.writeFile(filepath, JSON.stringify(emailData, null, 2));
    return filepath;
  }

  addUser(username, password) {
    this.users.set(username, { username, password });
    logger.info(`SMTP user added: ${username}`);
  }

  removeUser(username) {
    this.users.delete(username);
    logger.info(`SMTP user removed: ${username}`);
  }

  listUsers() {
    return Array.from(this.users.keys());
  }

  setupErrorHandlers() {
    this.server.on('error', (error) => {
      logger.error(`SMTP server error: ${error.message}`);
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, (error) => {
        if (error) {
          logger.error(`Failed to start SMTP server: ${error.message}`);
          reject(error);
        } else {
          logger.info(`SMTP server listening on ${this.host}:${this.port}`);
          console.log(`\n📧 Custom SMTP Server started`);
          console.log(`   Host: ${this.host}`);
          console.log(`   Port: ${this.port}`);
          console.log(`   Domain: ${this.domain}`);
          console.log(`   Auth Required: ${this.authRequired}`);
          console.log(`   Inbox: ${this.inboxDir}\n`);
          resolve();
        }
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('SMTP server stopped');
        resolve();
      });
    });
  }

  async getInbox() {
    try {
      const files = await fs.readdir(this.inboxDir);
      const emails = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.inboxDir, file), 'utf-8');
          emails.push(JSON.parse(content));
        }
      }

      return emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    } catch (error) {
      logger.error(`Error reading inbox: ${error.message}`);
      return [];
    }
  }

  async getEmailById(messageId) {
    try {
      const files = await fs.readdir(this.inboxDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.inboxDir, file), 'utf-8');
          const email = JSON.parse(content);
          if (email.messageId === messageId) {
            return email;
          }
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error getting email: ${error.message}`);
      return null;
    }
  }

  async deleteEmail(messageId) {
    try {
      const files = await fs.readdir(this.inboxDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.inboxDir, file), 'utf-8');
          const email = JSON.parse(content);
          if (email.messageId === messageId) {
            await fs.unlink(path.join(this.inboxDir, file));
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error(`Error deleting email: ${error.message}`);
      return false;
    }
  }

  async clearInbox() {
    try {
      const files = await fs.readdir(this.inboxDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.inboxDir, file));
        }
      }

      logger.info('Inbox cleared');
      return true;
    } catch (error) {
      logger.error(`Error clearing inbox: ${error.message}`);
      return false;
    }
  }
}

module.exports = CustomSMTPServer;
