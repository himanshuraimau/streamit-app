# Configuration & Setup Guide

Complete guide for configuring and deploying the StreamIt backend.

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Database Setup](#database-setup)
3. [Authentication Setup](#authentication-setup)
4. [AWS S3 Setup](#aws-s3-setup)
5. [LiveKit Setup](#livekit-setup)
6. [Dodo Payments Setup](#dodo-payments-setup)
7. [Email Service Setup](#email-service-setup)
8. [Local Development](#local-development)
9. [Production Deployment](#production-deployment)
10. [Docker Deployment](#docker-deployment)

---

## Environment Variables

### Required Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/streamit"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-random-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Frontend Configuration
FRONTEND_URL="http://localhost:5173"

# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="your-bucket-name"

# LiveKit Configuration
LIVEKIT_URL="wss://your-livekit-instance.livekit.cloud"
LIVEKIT_API_KEY="APIxxxxxxxxx"
LIVEKIT_API_SECRET="secretxxxxxxxxxxxxxx"

# Dodo Payments Configuration
DODO_API_KEY="test_xxxxxxxxxxxxxxxxxx"
DODO_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxx"

# Resend Email Service
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxx"

# Server Configuration
PORT=3000
NODE_ENV="development"
```

### Environment-Specific Settings

**Development**:
```bash
NODE_ENV="development"
BETTER_AUTH_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
```

**Production**:
```bash
NODE_ENV="production"
BETTER_AUTH_URL="https://api.voltstream.space"
FRONTEND_URL="https://voltstream.space"
```

---

## Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Docker**:
```bash
docker run -d \
  --name streamit-postgres \
  -e POSTGRES_USER=streamit \
  -e POSTGRES_PASSWORD=streamit \
  -e POSTGRES_DB=streamit \
  -p 5432:5432 \
  postgres:15
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE streamit;
CREATE USER streamit WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE streamit TO streamit;
\q
```

### 3. Configure Connection String

```bash
DATABASE_URL="postgresql://streamit:your_password@localhost:5432/streamit"
```

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

### 4. Run Migrations

```bash
cd backend

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed database (optional)
bun run db:seed
bun run db:seed-discount
```

### 5. Verify Setup

```bash
# Open Prisma Studio
bun run db:studio
```

Visit `http://localhost:5555` to view your database.

---

## Authentication Setup

StreamIt uses **Better Auth** for authentication.

### 1. Generate Secret

```bash
# Generate a random secret (32+ characters)
openssl rand -base64 32
```

### 2. Configure Better Auth

```bash
BETTER_AUTH_SECRET="generated_secret_here"
BETTER_AUTH_URL="http://localhost:3000"  # Your backend URL
```

### 3. Frontend Configuration

The frontend must send credentials with requests:

```typescript
// In frontend API client
fetch('http://localhost:3000/api/auth/get-session', {
  credentials: 'include',  // Important!
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 4. CORS Configuration

Update `src/index.ts` with your frontend URLs:

```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'https://your-production-domain.com',
];
```

### 5. Cookie Configuration

**Development** (same domain):
```typescript
sameSite: "lax"
secure: false
```

**Production** (cross-domain):
```typescript
sameSite: "none"
secure: true
partitioned: true
```

---

## AWS S3 Setup

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3api create-bucket \
  --bucket your-streamit-bucket \
  --region us-east-1
```

Or use AWS Console: https://console.aws.amazon.com/s3/

### 2. Configure CORS

Add CORS configuration to your bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Create IAM User

1. Go to IAM Console
2. Create new user: `streamit-s3-user`
3. Attach policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-streamit-bucket",
        "arn:aws:s3:::your-streamit-bucket/*"
      ]
    }
  ]
}
```

4. Generate access keys
5. Add to `.env`:

```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
S3_BUCKET_NAME="your-streamit-bucket"
```

### 4. Enable Public Access (Optional)

For public file access, configure bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-streamit-bucket/public/*"
    }
  ]
}
```

---

## LiveKit Setup

LiveKit powers the WebRTC streaming functionality.

### Option 1: LiveKit Cloud (Recommended)

1. **Sign up**: https://cloud.livekit.io/
2. **Create Project**
3. **Get Credentials**:
   - API Key
   - API Secret
   - WebSocket URL

```bash
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="APIxxxxxxxxx"
LIVEKIT_API_SECRET="secretxxxxxxxxxxxxxxxxxx"
```

### Option 2: Self-Hosted

**Using Docker**:
```bash
docker run -d \
  --name livekit \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -e LIVEKIT_KEYS="APIxxxxxxxxx: secretxxxxxxxxxxxxxxxxxx" \
  livekit/livekit-server:latest
```

**Configuration file** (`livekit.yaml`):
```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  APIxxxxxxxxx: secretxxxxxxxxxxxxxxxxxx
```

### Webhook Configuration

1. Go to LiveKit Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-backend.com/api/webhook/livekit`
3. Enable events:
   - `ingress_started`
   - `ingress_ended`
   - `room_finished`

### Local Development with ngrok

For local webhook testing:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Use the provided HTTPS URL in LiveKit webhook config
# Example: https://abc123.ngrok.io/api/webhook/livekit
```

---

## Dodo Payments Setup

### 1. Create Account

Sign up at: https://dodopayments.com/

### 2. Get API Keys

1. Go to Developer → API Keys
2. Copy **Test Mode** API key
3. Copy webhook secret

```bash
DODO_API_KEY="test_xxxxxxxxxxxxxxxxxx"
DODO_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxx"
```

### 3. Create Products

Create coin packages in Dodo dashboard:

1. Go to Products → Create Product
2. Create packages matching your `CoinPackage` model
3. Note the product IDs

**Update seed file** (`prisma/seed-payment.ts`):
```typescript
await prisma.coinPackage.create({
  data: {
    id: 'prod_dodo_id_from_dashboard',  // Dodo product ID
    name: 'Starter Pack',
    coins: 100,
    price: 9900,
    // ...
  },
});
```

### 4. Configure Webhooks

1. Go to Developer → Webhooks
2. Add webhook endpoint: `https://your-backend.com/api/webhook/dodo`
3. Select events:
   - `payment.completed`
   - `payment.failed`
4. Save webhook secret to `.env`

### 5. Test Mode vs Production

**Test Mode** (development):
```bash
DODO_API_KEY="test_xxxxxxxxxxxxxxxxxx"
```

**Production Mode**:
```bash
DODO_API_KEY="prod_xxxxxxxxxxxxxxxxxx"
```

Update `src/services/payment.service.ts`:
```typescript
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY || '',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'test_mode',
});
```

---

## Email Service Setup

StreamIt uses **Resend** for transactional emails.

### 1. Create Account

Sign up at: https://resend.com/

### 2. Get API Key

1. Go to API Keys
2. Create new API key
3. Add to `.env`:

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxx"
```

### 3. Verify Domain (Production)

For production, verify your sending domain:

1. Go to Domains → Add Domain
2. Add DNS records (TXT, MX, CNAME)
3. Wait for verification

**Development**: Use `onboarding@resend.dev` (included with free tier)

### 4. Email Templates

Email templates are in `src/lib/email-templates.ts`:

```typescript
export const emailTemplates = {
  verification: (otp: string) => `...`,
  signin: (otp: string) => `...`,
  passwordReset: (otp: string) => `...`,
};
```

Customize as needed.

---

## Local Development

### 1. Install Dependencies

```bash
cd backend
bun install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

### 4. Start Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000` with hot reload.

### 5. Test API

```bash
# Health check
curl http://localhost:3000/health

# Test auth
curl http://localhost:3000/api/auth/get-session
```

### 6. Development Tools

**Prisma Studio** (Database GUI):
```bash
bun run db:studio
```

**Generate Prisma Client** (after schema changes):
```bash
bun run db:generate
```

---

## Production Deployment

### Prerequisites

- PostgreSQL database
- Domain name with SSL certificate
- Configured external services (S3, LiveKit, Dodo, Resend)

### 1. Environment Configuration

Create production `.env`:

```bash
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@prod-db:5432/streamit"
BETTER_AUTH_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
# ... other production credentials
```

### 2. Build Application

```bash
bun run build
```

### 3. Run Migrations

```bash
bun run db:migrate:deploy
```

### 4. Start Server

```bash
bun start
```

### 5. Process Manager (Recommended)

**Using PM2**:
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start "bun start" --name streamit-backend

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

**Using systemd**:

Create `/etc/systemd/system/streamit-backend.service`:

```ini
[Unit]
Description=StreamIt Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/streamit/backend
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/streamit/backend/.env
ExecStart=/usr/local/bin/bun start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable streamit-backend
sudo systemctl start streamit-backend
```

### 6. Reverse Proxy (Nginx)

Configure Nginx:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com
```

### 8. Monitoring

**Health checks**:
```bash
curl https://api.yourdomain.com/health
```

**View logs** (PM2):
```bash
pm2 logs streamit-backend
```

**View logs** (systemd):
```bash
sudo journalctl -u streamit-backend -f
```

---

## Docker Deployment

### 1. Build Image

```bash
cd backend
docker build -t streamit-backend .
```

### 2. Run Container

```bash
docker run -d \
  --name streamit-backend \
  -p 3000:3000 \
  --env-file .env \
  streamit-backend
```

### 3. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: streamit
      POSTGRES_PASSWORD: streamit
      POSTGRES_DB: streamit
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://streamit:streamit@postgres:5432/streamit
      NODE_ENV: production
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres-data:
```

Run:
```bash
docker-compose up -d
```

### 4. Production with Docker

**Build for production**:
```bash
docker build -t streamit-backend:latest .
docker tag streamit-backend:latest your-registry/streamit-backend:latest
docker push your-registry/streamit-backend:latest
```

**Deploy**:
```bash
docker pull your-registry/streamit-backend:latest
docker-compose up -d
```

---

## Deployment Script

The included `deploy.sh` script automates deployment:

```bash
#!/bin/bash

# Update code
git pull origin main

# Install dependencies
bun install

# Run migrations
bun run db:migrate:deploy

# Build application
bun run build

# Restart service
pm2 restart streamit-backend

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

---

## Security Checklist

- [ ] Use strong `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Enable SSL/TLS in production
- [ ] Use secure cookies (`sameSite: none`, `secure: true`)
- [ ] Encrypt sensitive data in database (financial info)
- [ ] Use environment-specific credentials
- [ ] Configure CORS for allowed origins only
- [ ] Enable rate limiting (TODO)
- [ ] Regular security updates
- [ ] Monitor error logs
- [ ] Backup database regularly

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -U streamit -d streamit -h localhost

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Authentication Issues

```bash
# Verify CORS settings
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3000/api/auth/sign-in/email

# Check cookies in browser DevTools → Application → Cookies
```

### File Upload Issues

```bash
# Test S3 credentials
aws s3 ls s3://your-bucket --profile streamit

# Check bucket CORS configuration
aws s3api get-bucket-cors --bucket your-bucket
```

### LiveKit Issues

```bash
# Test LiveKit connection
curl -H "Authorization: Bearer $LIVEKIT_API_KEY" \
     https://your-project.livekit.cloud/twirp/livekit.RoomService/ListRooms
```

### Payment Issues

```bash
# Test Dodo API
curl -H "Authorization: Bearer $DODO_API_KEY" \
     https://api.dodopayments.com/v1/products
```

---

## Performance Optimization

### Database

- Enable connection pooling
- Add indexes for frequently queried fields
- Use selective field queries
- Implement caching (Redis)

### File Storage

- Use CloudFront or CDN for S3
- Compress images before upload
- Generate thumbnails for videos

### API

- Implement response caching
- Use pagination for large datasets
- Optimize N+1 queries
- Add rate limiting

---

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup
pg_dump -U streamit streamit > backup-$(date +%Y%m%d).sql

# Restore from backup
psql -U streamit streamit < backup-20260108.sql
```

### S3 Backup

Enable S3 versioning and cross-region replication.

---

**Last Updated**: January 8, 2026
