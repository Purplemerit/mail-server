# Email Service - VPS Deployment Guide

## Quick Deploy to VPS

### Prerequisites
- VPS with Ubuntu/Debian
- Domain name (e.g., purplemerit.com)
- Hostinger SMTP credentials

### Step 1: SSH into VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Install Node.js and Git

```bash
apt update -y
apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
```

### Step 3: Clone Repository

```bash
cd /var
mkdir mailer
cd mailer
git clone https://github.com/YOUR_USERNAME/email-service.git .
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Create Production .env File

```bash
nano .env
```

Paste this configuration:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Email Provider
EMAIL_PROVIDER=smtp

# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=jobmessenger@purplemerit.com
SMTP_PASS=YOUR_PASSWORD_HERE
SMTP_FROM_EMAIL=jobmessenger@purplemerit.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application Settings
APP_NAME=PurpleMerit Mailer
APP_URL=https://mailer.purplemerit.com
```

Save: `CTRL + S`, Exit: `CTRL + X`

### Step 6: Install and Setup Redis

```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
redis-cli ping  # Should return PONG
```

### Step 7: Test the Service

```bash
npm start
```

You should see:
```
🚀 Email Service is running on http://localhost:4000
📧 Provider: smtp
```

Test the API:
```bash
curl http://localhost:4000/health
```

Stop the test: `CTRL + C`

### Step 8: Setup PM2 for Production

```bash
npm install -g pm2
pm2 start src/index.js --name mailer-service
pm2 save
pm2 startup
```

Copy and run the command PM2 shows you.

Check status:
```bash
pm2 status
pm2 logs mailer-service
```

### Step 9: Configure Firewall

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 4000/tcp # Email Service API
ufw enable
```

### Step 10: Setup Domain & SSL (Optional)

#### Install Nginx

```bash
apt install -y nginx
```

#### Configure Nginx

```bash
nano /etc/nginx/sites-available/mailer
```

Paste:

```nginx
server {
    listen 80;
    server_name mailer.purplemerit.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/mailer /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Install SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d mailer.purplemerit.com
```

Follow the prompts. Certificate will auto-renew.

### Step 11: Test Production API

```bash
curl https://mailer.purplemerit.com/health
```

Send test email:

```bash
curl -X POST https://mailer.purplemerit.com/api/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","userName":"Test","otpCode":"123456"}'
```

## Maintenance Commands

```bash
# View logs
pm2 logs mailer-service

# Restart service
pm2 restart mailer-service

# Stop service
pm2 stop mailer-service

# Update code from GitHub
cd /var/mailer
git pull
npm install
pm2 restart mailer-service
```

## Troubleshooting

### Service not starting
```bash
pm2 logs mailer-service
# Check for errors
```

### Redis connection failed
```bash
systemctl status redis-server
systemctl restart redis-server
```

### Emails not sending
- Check SMTP credentials in .env
- Verify Hostinger SMTP settings
- Check logs: `tail -f logs/error.log`

## API Endpoints

Once deployed, your API will be available at:

- Health Check: `https://mailer.purplemerit.com/health`
- Send OTP: `POST https://mailer.purplemerit.com/api/email/send-otp`
- Send Password Reset: `POST https://mailer.purplemerit.com/api/email/send-password-reset`
- Send Welcome: `POST https://mailer.purplemerit.com/api/email/send-welcome`

## Security Notes

- Never commit .env to GitHub
- Use strong passwords
- Keep Node.js and packages updated
- Monitor logs regularly
- Setup fail2ban for SSH protection
