# Email Sender Service

A scalable, production-ready email service for sending transactional emails like OTPs, password resets, and welcome emails. Built with Node.js, supports multiple email providers, queue system, rate limiting, and analytics.

## Features

- **Multiple Email Providers**: AWS SES, SendGrid, Mailgun, and custom SMTP
- **Beautiful Templates**: Pre-built HTML templates for OTP, password reset, and welcome emails
- **Queue System**: Background job processing with Bull and Redis
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Analytics**: Track email delivery, success rates, and provider statistics
- **Scalable**: Handle unlimited emails with queue-based architecture
- **Production Ready**: Error handling, logging, and monitoring

## Why Use Email Service Providers?

For transactional emails, using a service provider (AWS SES, SendGrid, Mailgun) is recommended over custom SMTP:

| Feature | Email Service Provider | Custom SMTP |
|---------|----------------------|-------------|
| Deliverability | High (whitelisted IPs) | Low (often marked as spam) |
| Infrastructure | Managed | Self-managed |
| Analytics | Built-in | Manual implementation |
| Scalability | Unlimited | Limited by server |
| Cost | $0.10/1000 emails (AWS SES) | Server + maintenance costs |
| Setup Time | 10 minutes | Hours/days |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Redis

**Windows:**
- Download Redis from: https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis`

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure your email provider:

**Option A: AWS SES (Recommended - Cheapest)**
```env
EMAIL_PROVIDER=aws-ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

**Option B: SendGrid**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Option C: Mailgun**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

**Option D: Custom SMTP (Gmail, etc.)**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
```

### 4. Start the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will start on `http://localhost:3000`

## API Endpoints

### Send OTP Email

```bash
POST /api/email/send-otp
```

**Request:**
```json
{
  "to": "user@example.com",
  "userName": "John Doe",
  "otpCode": "123456",
  "expiryMinutes": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP email queued successfully",
  "jobId": "123"
}
```

### Send Password Reset Email

```bash
POST /api/email/send-password-reset
```

**Request:**
```json
{
  "to": "user@example.com",
  "userName": "John Doe",
  "resetToken": "abc123xyz",
  "expiryMinutes": 30
}
```

### Send Welcome Email

```bash
POST /api/email/send-welcome
```

**Request:**
```json
{
  "to": "user@example.com",
  "userName": "John Doe",
  "features": [
    "Access to premium features",
    "24/7 customer support",
    "Free trial for 30 days"
  ],
  "ctaLink": "https://yourapp.com/dashboard",
  "ctaText": "Get Started"
}
```

### Send Custom Email

```bash
POST /api/email/send
```

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Your subject here",
  "html": "<h1>Hello World</h1>",
  "useQueue": true
}
```

### Send Bulk Emails

```bash
POST /api/email/send-bulk
```

**Request:**
```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Subject 1",
      "html": "<h1>Email 1</h1>"
    },
    {
      "to": "user2@example.com",
      "subject": "Subject 2",
      "html": "<h1>Email 2</h1>"
    }
  ]
}
```

### Get Queue Statistics

```bash
GET /api/email/queue/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3,
    "delayed": 0,
    "total": 110
  }
}
```

### Get Analytics

```bash
GET /api/analytics/summary
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "total": {
      "sent": 1000,
      "failed": 10,
      "successRate": "99.00%"
    },
    "byProvider": {
      "aws-ses": 1000
    },
    "byTemplate": {
      "otp": 500,
      "password-reset": 300,
      "welcome": 200
    },
    "last7Days": {
      "2024-01-01": 150,
      "2024-01-02": 200
    }
  }
}
```

### Health Check

```bash
GET /health
```

```bash
GET /health/verify
```

## Setting Up Email Providers

### AWS SES (Recommended)

1. Go to AWS Console > SES
2. Verify your domain or email address
3. Create IAM user with SES permissions
4. Generate access key and secret
5. Move out of sandbox mode for production (can send to any email)

**Cost:** $0.10 per 1,000 emails

### SendGrid

1. Sign up at https://sendgrid.com
2. Verify your sender identity
3. Generate API key
4. Free tier: 100 emails/day

### Mailgun

1. Sign up at https://mailgun.com
2. Add and verify your domain
3. Get API key from settings
4. Free tier: 5,000 emails/month

### Gmail SMTP

1. Enable 2-factor authentication
2. Generate App Password
3. Use in SMTP configuration

**Note:** Gmail has daily sending limits (500 emails/day)

## Integration Examples

### Node.js/Express

```javascript
const axios = require('axios');

async function sendOTP(email, code) {
  const response = await axios.post('http://localhost:3000/api/email/send-otp', {
    to: email,
    userName: 'John Doe',
    otpCode: code,
    expiryMinutes: 10
  });

  return response.data;
}
```

### Python

```python
import requests

def send_password_reset(email, token):
    response = requests.post('http://localhost:3000/api/email/send-password-reset',
        json={
            'to': email,
            'userName': 'John Doe',
            'resetToken': token,
            'expiryMinutes': 30
        }
    )
    return response.json()
```

### cURL

```bash
curl -X POST http://localhost:3000/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "userName": "John Doe",
    "otpCode": "123456"
  }'
```

## Rate Limiting

Default rate limits (configurable in `.env`):

- **Email endpoints**: 100 requests per 15 minutes
- **Bulk email**: 10 requests per hour
- **Per IP address**: Automatically enforced

## Creating Custom Templates

1. Create a new `.hbs` file in `src/templates/html/`
2. Use Handlebars syntax for variables
3. Add a method in `src/templates/emailTemplates.js`

Example:
```handlebars
<!DOCTYPE html>
<html>
<body>
  <h1>Hello {{userName}}!</h1>
  <p>{{message}}</p>
</body>
</html>
```

## Production Deployment

### Environment Variables

Ensure these are set:
```env
NODE_ENV=production
PORT=3000
EMAIL_PROVIDER=aws-ses
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Process Manager (PM2)

```bash
npm install -g pm2
pm2 start src/index.js --name email-service
pm2 save
pm2 startup
```

## Monitoring

- **Logs**: Check `logs/combined.log` and `logs/error.log`
- **Queue**: Monitor at `/api/email/queue/stats`
- **Analytics**: View at `/api/analytics/summary`

## Troubleshooting

### Emails going to spam

- Use a verified domain
- Set up SPF, DKIM, and DMARC records
- Use a reputable email provider (AWS SES, SendGrid)
- Avoid spam trigger words

### Redis connection errors

- Ensure Redis is running: `redis-cli ping`
- Check Redis host and port in `.env`

### Rate limit errors

- Adjust limits in `.env`
- Implement API key authentication for trusted clients

## Cost Comparison

For 100,000 emails/month:

| Provider | Cost |
|----------|------|
| AWS SES | $10 |
| SendGrid | $15 (Essentials plan) |
| Mailgun | $35 (Foundation plan) |
| Custom SMTP | Server costs + maintenance |

## Security Best Practices

- Never commit `.env` file
- Use environment variables for secrets
- Implement API key authentication in production
- Enable HTTPS
- Monitor for unusual sending patterns
- Set up alerts for failed emails

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
