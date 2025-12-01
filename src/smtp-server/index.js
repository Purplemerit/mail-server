require('dotenv').config();
const express = require('express');
const CustomSMTPServer = require('./smtpServer');
const logger = require('../utils/logger');

const app = express();
app.use(express.json());

const smtpPort = parseInt(process.env.CUSTOM_SMTP_PORT) || 2525;
const smtpHost = process.env.CUSTOM_SMTP_HOST || '0.0.0.0';
const smtpDomain = process.env.CUSTOM_SMTP_DOMAIN || 'localhost';
const apiPort = parseInt(process.env.SMTP_API_PORT) || 3001;
const authRequired = process.env.CUSTOM_SMTP_AUTH_REQUIRED !== 'false';

const smtpServer = new CustomSMTPServer({
  port: smtpPort,
  host: smtpHost,
  domain: smtpDomain,
  authRequired
});

if (authRequired) {
  const defaultUser = process.env.CUSTOM_SMTP_USER || 'admin';
  const defaultPass = process.env.CUSTOM_SMTP_PASS || 'password123';
  smtpServer.addUser(defaultUser, defaultPass);
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SMTP Management API is running',
    smtp: {
      port: smtpPort,
      host: smtpHost,
      domain: smtpDomain,
      authRequired
    }
  });
});

app.get('/inbox', async (req, res) => {
  try {
    const emails = await smtpServer.getInbox();
    res.json({
      success: true,
      count: emails.length,
      emails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/inbox/:messageId', async (req, res) => {
  try {
    const email = await smtpServer.getEmailById(req.params.messageId);
    if (email) {
      res.json({
        success: true,
        email
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/inbox/:messageId', async (req, res) => {
  try {
    const deleted = await smtpServer.deleteEmail(req.params.messageId);
    if (deleted) {
      res.json({
        success: true,
        message: 'Email deleted'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/inbox', async (req, res) => {
  try {
    await smtpServer.clearInbox();
    res.json({
      success: true,
      message: 'Inbox cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/users', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    smtpServer.addUser(username, password);
    res.json({
      success: true,
      message: 'User added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/users/:username', (req, res) => {
  try {
    smtpServer.removeUser(req.params.username);
    res.json({
      success: true,
      message: 'User removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/users', (req, res) => {
  try {
    const users = smtpServer.listUsers();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

async function start() {
  try {
    await smtpServer.start();

    app.listen(apiPort, () => {
      logger.info(`SMTP Management API listening on port ${apiPort}`);
      console.log(`📊 Management API: http://localhost:${apiPort}`);
      console.log(`\nEndpoints:`);
      console.log(`  GET  /health - Health check`);
      console.log(`  GET  /inbox - List all emails`);
      console.log(`  GET  /inbox/:messageId - Get specific email`);
      console.log(`  DEL  /inbox/:messageId - Delete email`);
      console.log(`  DEL  /inbox - Clear all emails`);
      console.log(`  POST /users - Add SMTP user`);
      console.log(`  GET  /users - List users`);
      console.log(`  DEL  /users/:username - Remove user\n`);
    });
  } catch (error) {
    logger.error(`Failed to start servers: ${error.message}`);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await smtpServer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await smtpServer.stop();
  process.exit(0);
});

start();

module.exports = { smtpServer, app };
