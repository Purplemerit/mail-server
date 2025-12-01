# Quick Start - Custom SMTP Server

Get your own SMTP server running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
EMAIL_PROVIDER=custom-smtp
CUSTOM_SMTP_PORT=2525
CUSTOM_SMTP_DOMAIN=yourdomain.com
CUSTOM_SMTP_USER=admin
CUSTOM_SMTP_PASS=yourpassword
```

## Step 3: Start SMTP Server

**Terminal 1:**
```bash
npm run smtp
```

You'll see:
```
📧 Custom SMTP Server started
   Port: 2525
   Domain: yourdomain.com
📊 Management API: http://localhost:3001
```

## Step 4: Start Email API

**Terminal 2:**
```bash
npm run dev
```

## Step 5: Test It!

**Send an OTP email:**
```bash
curl -X POST http://localhost:3000/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"test@example.com\",\"otpCode\":\"123456\"}"
```

**Check the inbox:**
```bash
curl http://localhost:3001/inbox
```

## What You Can Do

### Send Emails via API

```bash
# OTP
POST http://localhost:3000/api/email/send-otp

# Password Reset
POST http://localhost:3000/api/email/send-password-reset

# Welcome Email
POST http://localhost:3000/api/email/send-welcome

# Custom Email
POST http://localhost:3000/api/email/send
```

### Manage Inbox

```bash
# List all received emails
GET http://localhost:3001/inbox

# Get specific email
GET http://localhost:3001/inbox/:messageId

# Delete email
DELETE http://localhost:3001/inbox/:messageId

# Clear all emails
DELETE http://localhost:3001/inbox
```

### Check DNS Configuration

```bash
curl -X POST http://localhost:3000/api/smtp/dns/check \
  -H "Content-Type: application/json" \
  -d '{"domain":"yourdomain.com"}'
```

### Generate DNS Records

```bash
# Generate SPF record
curl -X POST http://localhost:3000/api/smtp/dns/generate-spf \
  -H "Content-Type: application/json" \
  -d '{"includeIPs":["your.server.ip"],"includeDomains":["mx"]}'

# Generate DMARC record
curl -X POST http://localhost:3000/api/smtp/dns/generate-dmarc \
  -H "Content-Type: application/json" \
  -d '{"policy":"quarantine","reportEmail":"admin@yourdomain.com"}'
```

## Integration Example

### Node.js

```javascript
const axios = require('axios');

async function sendOTP(email, code) {
  const response = await axios.post('http://localhost:3000/api/email/send-otp', {
    to: email,
    otpCode: code,
    expiryMinutes: 10
  });

  return response.data;
}

await sendOTP('user@example.com', '123456');
```

### Python

```python
import requests

def send_otp(email, code):
    response = requests.post(
        'http://localhost:3000/api/email/send-otp',
        json={'to': email, 'otpCode': code}
    )
    return response.json()

send_otp('user@example.com', '123456')
```

## Architecture

```
┌──────────────┐
│ Your App     │
└──────┬───────┘
       │ HTTP POST
       ▼
┌──────────────────┐     SMTP      ┌──────────────────┐
│ Email API        ├──────────────▶│ SMTP Server      │
│ (Port 3000)      │                │ (Port 2525)      │
│                  │                │                  │
│ - Templates      │                │ - Receives       │
│ - Queue          │                │ - Authenticates  │
│ - Rate Limiting  │                │ - Stores         │
└──────────────────┘                └──────────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ Inbox API        │
                                    │ (Port 3001)      │
                                    └──────────────────┘
```

## Next Steps

1. **For Development:** You're all set! Keep using localhost.

2. **For Production:**
   - Get a domain name
   - Get a server with static IP
   - Configure DNS records (MX, SPF, DMARC)
   - Add SSL/TLS certificates
   - Use port 587 instead of 2525
   - Set up reverse DNS

See `CUSTOM_SMTP_GUIDE.md` for detailed production setup.

## Troubleshooting

**SMTP server won't start:**
- Check if port 2525 is already in use
- Try a different port in `.env`

**Can't send emails:**
- Verify SMTP server is running: `curl http://localhost:3001/health`
- Check authentication credentials in `.env`

**Emails go to spam:**
- Normal for localhost/development
- For production, set up proper DNS records
- See DNS Setup section in CUSTOM_SMTP_GUIDE.md

## Important Notes

**Deliverability:**
- Emails from custom SMTP often go to spam without proper DNS setup
- For production transactional emails (OTP, password reset), use AWS SES or SendGrid
- Use custom SMTP for internal tools, testing, or when you have proper infrastructure

**Security:**
- Always enable authentication in production
- Use strong passwords
- Add SSL/TLS for production
- Don't expose to internet without security measures

## Files Structure

```
SMTP/
├── src/
│   ├── smtp-server/
│   │   ├── index.js          # SMTP server entry point
│   │   ├── smtpServer.js     # SMTP server implementation
│   │   └── smtpClient.js     # SMTP client for sending
│   ├── services/
│   │   └── emailProviders/
│   │       └── customSmtpProvider.js  # Custom SMTP provider
│   └── utils/
│       └── dnsHelper.js      # DNS validation tools
├── data/
│   └── inbox/                # Received emails stored here
└── logs/                     # Server logs
```

## Resources

- Full documentation: `CUSTOM_SMTP_GUIDE.md`
- Email API docs: `README.md`
- Setup guide: `SETUP_GUIDE.md`

## Support

For issues or questions, check the logs:
```bash
tail -f logs/combined.log
```

Happy emailing! 📧
