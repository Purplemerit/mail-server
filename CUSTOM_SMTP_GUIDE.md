# Custom SMTP Server Guide

Complete guide to building and running your own SMTP server for sending and receiving emails.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [DNS Setup](#dns-setup)
- [Security](#security)
- [Deliverability](#deliverability)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This custom SMTP server allows you to:

- **Send emails** through your own server
- **Receive emails** to your domain
- **Manage inbox** via REST API
- **Authentication** with username/password
- **DNS validation** and configuration tools
- **Full control** over your email infrastructure

### Pros vs Cons

**Pros:**
- Complete control over email infrastructure
- No third-party dependencies
- No per-email costs
- Privacy and data ownership
- Custom business logic

**Cons:**
- Deliverability challenges (emails may go to spam)
- Requires server management
- DNS configuration needed
- IP reputation building takes time
- More complex setup

**Recommendation:** Use for internal tools, testing, or learning. For production transactional emails (OTP, password reset), use AWS SES or SendGrid for better deliverability.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and edit `.env.example`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Use custom SMTP for sending
EMAIL_PROVIDER=custom-smtp

# Custom SMTP Server Settings
CUSTOM_SMTP_PORT=2525
CUSTOM_SMTP_HOST=0.0.0.0
CUSTOM_SMTP_DOMAIN=yourdomain.com
CUSTOM_SMTP_AUTH_REQUIRED=true
CUSTOM_SMTP_USER=admin
CUSTOM_SMTP_PASS=securepassword123
CUSTOM_SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_API_PORT=3001
```

### 3. Start SMTP Server

```bash
# Start the SMTP server
npm run smtp

# Or in development mode with auto-reload
npm run smtp:dev
```

You should see:

```
📧 Custom SMTP Server started
   Host: 0.0.0.0
   Port: 2525
   Domain: yourdomain.com
   Auth Required: true
   Inbox: C:\Users\chitr\Desktop\SMTP\data\inbox

📊 Management API: http://localhost:3001
```

### 4. Start Email Service API (Separate Terminal)

```bash
npm run dev
```

### 5. Send Test Email

```bash
curl -X POST http://localhost:3000/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"test@example.com\",\"otpCode\":\"123456\"}"
```

### 6. Check Inbox

```bash
curl http://localhost:3001/inbox
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│            Email Service API (Port 3000)                 │
│  - REST endpoints for sending emails                     │
│  - Templates (OTP, password reset, etc.)                 │
│  - Queue management                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         Custom SMTP Client (Nodemailer)                  │
│  - Connects to SMTP server                               │
│  - Sends emails                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│       Custom SMTP Server (Port 2525)                     │
│  - Receives SMTP connections                             │
│  - Authenticates users                                   │
│  - Stores emails in inbox                                │
│  - Management API (Port 3001)                            │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Port Selection

- **Port 25**: Standard SMTP port (requires root/admin, often blocked by ISPs)
- **Port 587**: Submission port (recommended, requires authentication)
- **Port 465**: SMTP over SSL (deprecated but still used)
- **Port 2525**: Alternative port (used in this setup, good for development)

For production, use port 587 with proper SSL/TLS.

### Authentication

Enable authentication to prevent open relay:

```env
CUSTOM_SMTP_AUTH_REQUIRED=true
CUSTOM_SMTP_USER=admin
CUSTOM_SMTP_PASS=your_secure_password
```

### Add Multiple Users

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"password123"}'
```

### List Users

```bash
curl http://localhost:3001/users
```

## DNS Setup

To send AND receive emails with your own domain, you need to configure DNS records.

### 1. Check Current DNS Configuration

```bash
curl -X POST http://localhost:3000/api/smtp/dns/check \
  -H "Content-Type: application/json" \
  -d '{"domain":"yourdomain.com","ip":"your.server.ip"}'
```

Response shows what's missing and recommendations.

### 2. Required DNS Records

#### A Record (Point domain to your server)

```
Type: A
Name: mail
Value: YOUR_SERVER_IP
TTL: 3600
```

#### MX Record (To receive emails)

```
Type: MX
Name: @
Value: mail.yourdomain.com
Priority: 10
TTL: 3600
```

#### SPF Record (Prevent spoofing)

Generate SPF record:

```bash
curl -X POST http://localhost:3000/api/smtp/dns/generate-spf \
  -H "Content-Type: application/json" \
  -d '{"includeIPs":["YOUR_SERVER_IP"],"includeDomains":["mx"],"policy":"~all"}'
```

Add to DNS:

```
Type: TXT
Name: @
Value: v=spf1 mx ip4:YOUR_SERVER_IP ~all
TTL: 3600
```

#### DMARC Record (Email authentication)

Generate DMARC record:

```bash
curl -X POST http://localhost:3000/api/smtp/dns/generate-dmarc \
  -H "Content-Type: application/json" \
  -d '{"policy":"quarantine","reportEmail":"dmarc@yourdomain.com"}'
```

Add to DNS:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
TTL: 3600
```

#### Reverse DNS (PTR Record)

Contact your hosting provider to set up reverse DNS for your server IP:

```
YOUR_SERVER_IP -> mail.yourdomain.com
```

### 3. Verify DNS Configuration

```bash
# Check MX records
curl http://localhost:3000/api/smtp/dns/mx/yourdomain.com

# Check SPF
curl http://localhost:3000/api/smtp/dns/spf/yourdomain.com

# Check DMARC
curl http://localhost:3000/api/smtp/dns/dmarc/yourdomain.com
```

## Security

### 1. Enable TLS/SSL

For production, add SSL certificates:

```javascript
// In src/smtp-server/smtpServer.js
const fs = require('fs');

this.server = new SMTPServer({
  secure: true,
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  // ... other options
});
```

### 2. Firewall Configuration

```bash
# Allow SMTP ports
sudo ufw allow 25/tcp
sudo ufw allow 587/tcp
sudo ufw allow 2525/tcp
sudo ufw allow 3001/tcp
```

### 3. Rate Limiting

The server includes built-in rate limiting. Configure in code or add IP-based restrictions.

### 4. Authentication

Always require authentication for sending:

```env
CUSTOM_SMTP_AUTH_REQUIRED=true
```

### 5. IP Whitelisting

For management API, consider adding IP restrictions.

## Deliverability

Getting your emails to inbox instead of spam:

### 1. Warm Up Your IP

- Start slow: Send 10-20 emails/day for first week
- Gradually increase volume
- Monitor bounce rates
- Avoid spam complaints

### 2. Build Sender Reputation

- Consistent sending patterns
- Low bounce rate (<5%)
- Low complaint rate (<0.1%)
- Proper DNS configuration
- Clean recipient lists

### 3. Email Content Best Practices

- Avoid spam trigger words (FREE, URGENT, CLICK HERE)
- Include plain text version
- Add unsubscribe link
- Use reputable from address
- Don't use URL shorteners

### 4. Monitor Blacklists

Check if your IP is blacklisted:

- https://mxtoolbox.com/blacklists.aspx
- https://www.spamhaus.org/lookup/

### 5. Authentication

- Implement DKIM signing
- Set up SPF record
- Configure DMARC policy
- Use reverse DNS

## Testing

### Test 1: Send Email via SMTP

```bash
# Using telnet
telnet localhost 2525

EHLO localhost
AUTH LOGIN
[base64 encoded username]
[base64 encoded password]
MAIL FROM: <noreply@yourdomain.com>
RCPT TO: <test@example.com>
DATA
Subject: Test Email
From: noreply@yourdomain.com
To: test@example.com

This is a test email.
.
QUIT
```

### Test 2: Send via API

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to":"test@example.com",
    "subject":"Test Email",
    "html":"<h1>Test</h1>"
  }'
```

### Test 3: Check Inbox

```bash
curl http://localhost:3001/inbox
```

### Test 4: Email Deliverability

Use online tools:

- https://www.mail-tester.com/
- https://www.emailonacid.com/

## Production Deployment

### 1. Use Standard Ports

Change to port 587 for production:

```env
CUSTOM_SMTP_PORT=587
```

### 2. Add SSL/TLS Certificates

Use Let's Encrypt:

```bash
sudo certbot certonly --standalone -d mail.yourdomain.com
```

### 3. Process Manager

Use PM2 to keep server running:

```bash
npm install -g pm2

# Start SMTP server
pm2 start src/smtp-server/index.js --name smtp-server

# Start email API
pm2 start src/index.js --name email-api

# Save and enable startup
pm2 save
pm2 startup
```

### 4. Monitoring

```bash
# View logs
pm2 logs smtp-server
pm2 logs email-api

# Monitor
pm2 monit
```

### 5. Backup

Regularly backup inbox directory:

```bash
cp -r data/inbox /backup/inbox-$(date +%Y%m%d)
```

## Management API Endpoints

The SMTP server exposes a management API on port 3001:

### Inbox Management

```bash
# List all emails
GET http://localhost:3001/inbox

# Get specific email
GET http://localhost:3001/inbox/:messageId

# Delete email
DELETE http://localhost:3001/inbox/:messageId

# Clear all emails
DELETE http://localhost:3001/inbox
```

### User Management

```bash
# Add user
POST http://localhost:3001/users
{"username":"user@example.com","password":"password"}

# List users
GET http://localhost:3001/users

# Remove user
DELETE http://localhost:3001/users/:username
```

### Health Check

```bash
GET http://localhost:3001/health
```

## Troubleshooting

### Emails Not Sending

1. Check SMTP server is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Verify authentication credentials

3. Check logs:
   ```bash
   tail -f logs/combined.log
   ```

### Emails Going to Spam

1. Check DNS configuration:
   ```bash
   curl -X POST http://localhost:3000/api/smtp/dns/check \
     -H "Content-Type: application/json" \
     -d '{"domain":"yourdomain.com"}'
   ```

2. Test email with https://www.mail-tester.com/

3. Verify SPF, DKIM, and DMARC records

4. Check IP reputation:
   ```bash
   https://www.senderbase.org/
   ```

### Can't Receive Emails

1. Check MX records:
   ```bash
   nslookup -type=mx yourdomain.com
   ```

2. Verify port 25 is open:
   ```bash
   sudo netstat -tulpn | grep :25
   ```

3. Check firewall:
   ```bash
   sudo ufw status
   ```

### Connection Refused

1. Verify server is listening:
   ```bash
   netstat -an | grep 2525
   ```

2. Check firewall rules

3. Verify host/port in configuration

## Cost Analysis

### Self-Hosted SMTP

**Costs:**
- Server: $5-20/month
- Domain: $10-15/year
- SSL certificate: Free (Let's Encrypt)
- Time: Setup and maintenance

**Best for:**
- Learning and development
- Internal tools
- High volume (100,000+ emails/month)
- Privacy-sensitive applications

### Email Service Provider (AWS SES)

**Costs:**
- $0.10 per 1,000 emails
- $0 infrastructure costs

**Best for:**
- Production applications
- Transactional emails (OTP, password reset)
- Better deliverability needed
- Less technical overhead

## Advanced Configuration

### DKIM Signing

To add DKIM signing, use `nodemailer-dkim`:

```javascript
const DKIMSigner = require('nodemailer-dkim').DKIMSigner;

// Generate DKIM keys first
// openssl genrsa -out dkim_private.pem 2048
// openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

const signer = new DKIMSigner({
  domainName: 'yourdomain.com',
  keySelector: 'default',
  privateKey: fs.readFileSync('dkim_private.pem')
});
```

### Custom Email Handlers

Modify `src/smtp-server/smtpServer.js` to add custom logic:

```javascript
onData: async (stream, session, callback) => {
  // Custom validation
  // Spam filtering
  // Auto-responders
  // Forwarding rules
}
```

### Queue Integration

Connect SMTP server with Redis queue for processing:

```javascript
const emailQueue = require('../queues/emailQueue');

await emailQueue.addEmailToQueue({
  to: parsed.to.text,
  subject: parsed.subject,
  html: parsed.html
});
```

## Resources

- [SMTP Protocol RFC](https://www.rfc-editor.org/rfc/rfc5321)
- [Email Authentication Best Practices](https://www.m3aawg.org/sites/default/files/m3aawg-email-authentication-recommended-best-practices-09-2020.pdf)
- [SPF Record Syntax](http://www.open-spf.org/SPF_Record_Syntax/)
- [DMARC Guide](https://dmarc.org/overview/)

## Conclusion

Running your own SMTP server gives you complete control but requires more setup and maintenance. For production transactional emails, consider using AWS SES, SendGrid, or Mailgun for better deliverability.

Use custom SMTP for:
- Development and testing
- Internal tools
- Learning email infrastructure
- High-volume scenarios where cost matters
- Privacy-sensitive applications

For best results, combine both: use your SMTP server for internal emails and a service provider for customer-facing transactional emails.
