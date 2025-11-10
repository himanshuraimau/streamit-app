# Backend Deployment Guide (AWS)

## Prerequisites
- AWS EC2 instance with Ubuntu/Amazon Linux
- Docker and Docker Compose installed
- Git installed
- Domain/subdomain pointing to your server IP

## Step 1: Connect to Server
```bash
ssh -i your-key.pem ubuntu@your-server-ip
```

## Step 2: Clone Repository
```bash
# Clone the repo
git clone https://github.com/himanshuraimau/streamit-app.git
cd streamit-app/backend
```

## Step 3: Set Environment Variables
```bash
# Create .env file
nano .env
```

Add these environment variables:
```bash
# Database
DATABASE_URL="your-postgres-connection-string"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="https://api.yourdomain.com"

# Frontend URL (for CORS)
FRONTEND_URL="https://yourdomain.com"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# AWS S3 (for uploads)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="your-region"
AWS_BUCKET_NAME="your-bucket-name"

# Razorpay (payments)
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Node Environment
NODE_ENV="production"
PORT=3000
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Build and Run with Docker
```bash
# Make sure you're in the backend directory
cd /path/to/streamit-app/backend

# Build and start the container
docker-compose up -d --build
```

## Step 5: Run Database Migrations
```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Optional: Seed database
docker-compose exec backend npx prisma db seed
```

## Step 6: Check Logs
```bash
# View logs
docker-compose logs -f backend

# Check if container is running
docker ps
```

## Step 7: Setup Nginx (Reverse Proxy)

Install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

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

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Setup SSL with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is set up automatically
```

## Container Management Commands

### Start containers
```bash
docker-compose up -d
```

### Stop containers
```bash
docker-compose down
```

### Restart containers
```bash
docker-compose restart
```

### View logs
```bash
docker-compose logs -f backend
```

### Rebuild and restart
```bash
docker-compose down
docker-compose up -d --build
```

### Access container shell
```bash
docker-compose exec backend sh
```

## Updating the Application

```bash
# Pull latest changes
cd /path/to/streamit-app/backend
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run new migrations if any
docker-compose exec backend npx prisma migrate deploy
```

## Troubleshooting

### Check if backend is running
```bash
curl http://localhost:3000/api/health
```

### View all logs
```bash
docker-compose logs -f
```

### Check container status
```bash
docker ps -a
```

### Restart if crashed
```bash
docker-compose restart backend
```

### Check disk space
```bash
df -h
```

### Clean up old containers/images
```bash
docker system prune -a
```

## Health Checks

1. **API Health**: `https://api.yourdomain.com/api/health`
2. **Database Connection**: Check logs for DB connection success
3. **Auth Endpoints**: Test with `curl https://api.yourdomain.com/api/auth/`

## Security Checklist

- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] SSH key-based authentication only
- [ ] Environment variables are secure
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] Database credentials are strong
- [ ] CORS origins properly configured

## Backup Strategy

### Database Backup
```bash
# Manual backup
docker-compose exec backend npx prisma db pull
# or use your database provider's backup tools
```

### Application Backup
```bash
# Backup .env and uploads
tar -czf backup-$(date +%Y%m%d).tar.gz .env uploads/
```

## Monitoring

### Check CPU/Memory usage
```bash
docker stats
```

### Check application logs
```bash
docker-compose logs -f backend --tail=100
```

## Port Information

- **Backend Container**: Port 3000
- **Nginx**: Ports 80 (HTTP) and 443 (HTTPS)
- **PostgreSQL**: Usually port 5432 (if self-hosted)

## Environment-Specific Notes

- All environment variables must be set before running Docker
- Use production database URL, not development
- Ensure `NODE_ENV=production` is set
- Backend URL should match your domain

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure database is accessible
4. Check Nginx configuration
5. Verify SSL certificate is valid

---

**Last Updated**: November 10, 2024
