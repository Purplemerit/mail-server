# Email Service Setup Guide

Complete step-by-step guide to get your email service running.

## Prerequisites

1. Node.js (v14 or higher)
2. Redis server
3. Email provider account (AWS SES, SendGrid, Mailgun, or SMTP server)

## Step 1: Install Node.js Dependencies

```bash
cd C:\Users\chitr\Desktop\SMTP
npm install
```

## Step 2: Setup Redis

### Option A: Using Docker (Easiest)

```bash
docker run -d --name redis -p 6379:6379 redis
```

### Option B: Windows Installation

1. Download Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Verify: Open another terminal and run `redis-cli ping` (should return "PONG")

### Option C: WSL (Windows Subsystem for Linux)

```bash
wsl
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
redis-cli ping
```

## Step 3: Choose and Configure Email Provider

### Recommended: AWS SES (Most Cost-Effective)

#### Setup AWS SES:

1. **Create AWS Account** (if you don't have one)
   - Go to https://aws.amazon.com
   - Sign up for free tier

2. **Verify Email or Domain**
   - Go to AWS Console > SES
   - Click "Verified identities"
   - Click "Create identity"
   - Choose "Email address" for testing or "Domain" for production
   - Follow verification steps

3. **Create IAM User**
   - Go to IAM Console
   - Click "Users" > "Add user"
   - User name: `ses-email-sender`
   - Access type: "Programmatic access"
   - Attach policy: `AmazonSESFullAccess`
   - Copy Access Key ID and Secret Access Key

4. **Request Production Access** (to send to any email)
   - In SES Console, click "Account dashboard"
   - If in sandbox mode, click "Request production access"
   - Fill out the form (usually approved within 24 hours)

5. **Configure in .env**
   ```env
   EMAIL_PROVIDER=aws-ses
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_SES_FROM_EMAIL=noreply@yourdomain.com
   ```

### Alternative: SendGrid

1. Sign up at https://sendgrid.com
2. Verify your sender email
3. Go to Settings > API Keys
4. Create API Key with "Mail Send" permission
5. Copy the API key

Configure in .env:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Alternative: Mailgun

1. Sign up at https://mailgun.com
2. Add and verify your domain
3. Get API key from Settings > API Security
4. Note your domain name

Configure in .env:
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

### Alternative: Gmail SMTP (For Testing Only)

1. Enable 2-Factor Authentication on your Google account
2. Generate App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and your device
   - Copy the 16-character password

Configure in .env:
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM_EMAIL=youremail@gmail.com
```

**Gmail Limits:**
- 500 emails per day
- Not recommended for production

## Step 4: Create .env File

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Choose your provider and configure (see Step 3 above)
EMAIL_PROVIDER=aws-ses

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application Settings
APP_NAME=My Application
APP_URL=http://localhost:3000
```

## Step 5: Create Required Directories

The application will create these automatically, but you can create them manually:

```bash
mkdir logs
mkdir data
```

## Step 6: Start the Service

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

You should see:
```
🚀 Email Service is running on http://localhost:3000
📧 Provider: aws-ses
📊 Documentation: http://localhost:3000
```

## Step 7: Test the Service

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Email service is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test 2: Send Test OTP

```bash
curl -X POST http://localhost:3000/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"your-email@example.com\",\"userName\":\"Test User\",\"otpCode\":\"123456\"}"
```

### Test 3: Check Queue Stats

```bash
curl http://localhost:3000/api/email/queue/stats
```

### Test 4: Check Analytics

```bash
curl http://localhost:3000/api/analytics/summary
```

## Verification Checklist

- [ ] Node.js installed and version checked
- [ ] Redis server running
- [ ] Email provider configured
- [ ] .env file created with correct values
- [ ] Service starts without errors
- [ ] Health check returns success
- [ ] Test email sent successfully
- [ ] Email received in inbox (check spam folder too)

## Common Issues

### Issue: "Redis connection refused"

**Solution:**
- Check if Redis is running: `redis-cli ping`
- Verify REDIS_HOST and REDIS_PORT in .env
- For Docker: Ensure container is running: `docker ps`

### Issue: "AWS credentials error"

**Solution:**
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Check IAM user has SES permissions
- Ensure region is correct

### Issue: "Email not received"

**Solution:**
- Check spam/junk folder
- Verify sender email is verified in provider
- For AWS SES sandbox: Verify recipient email too
- Check logs: `tail -f logs/combined.log`

### Issue: "Rate limit exceeded"

**Solution:**
- Adjust RATE_LIMIT_MAX_REQUESTS in .env
- Wait for the time window to reset
- Implement authentication for trusted clients

### Issue: Port already in use

**Solution:**
- Change PORT in .env to another port (e.g., 3001)
- Or stop the service using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F

  # Linux/Mac
  lsof -ti:3000 | xargs kill
  ```

## Next Steps

1. **Test all email templates:**
   - OTP email
   - Password reset email
   - Welcome email

2. **Configure domain settings** (for production):
   - Set up SPF record
   - Set up DKIM record
   - Set up DMARC record

3. **Implement authentication:**
   - Add API key authentication
   - Protect sensitive endpoints

4. **Set up monitoring:**
   - Configure logging
   - Set up alerts for failures
   - Monitor queue performance

5. **Deploy to production:**
   - Use PM2 or Docker
   - Set NODE_ENV=production
   - Use a production Redis instance
   - Enable HTTPS

## Production Checklist

Before deploying to production:

- [ ] Email provider verified and out of sandbox mode
- [ ] Domain DNS records configured (SPF, DKIM, DMARC)
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured appropriately
- [ ] Logging and monitoring set up
- [ ] Error alerting configured
- [ ] Redis persistence enabled
- [ ] Backups configured
- [ ] Load testing completed
- [ ] Security audit performed

## Getting Help

If you encounter issues:

1. Check the logs: `logs/error.log` and `logs/combined.log`
2. Verify all environment variables
3. Test email provider credentials separately
4. Check Redis connection
5. Review the README.md for API documentation

## Example Integration

Once setup is complete, integrate with your application:

```javascript
// In your Node.js application
const axios = require('axios');

async function sendOTP(userEmail, code) {
  try {
    const response = await axios.post('http://localhost:3000/api/email/send-otp', {
      to: userEmail,
      userName: 'User',
      otpCode: code,
      expiryMinutes: 10
    });

    console.log('OTP sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw error;
  }
}

// Usage
await sendOTP('user@example.com', '123456');
```

Congratulations! Your email service is now ready to use.
