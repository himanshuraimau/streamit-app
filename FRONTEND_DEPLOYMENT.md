# Frontend Deployment Guide (AWS)

## Prerequisites
- AWS EC2 instance with Ubuntu/Amazon Linux
- Docker and Docker Compose installed
- Git installed
- Domain pointing to your server IP

## Step 1: Connect to Server
```bash
ssh -i your-key.pem ubuntu@your-server-ip
```

## Step 2: Clone Repository
```bash
# Clone the repo
git clone https://github.com/himanshuraimau/streamit-app.git
cd streamit-app/frontend
```

## Step 3: Set Environment Variables
```bash
# Create .env.production file
nano .env.production
```

Add this environment variable:
```bash
VITE_API_URL=https://api.yourdomain.com
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Update nginx.conf (Optional)

If you need to customize Nginx settings:
```bash
nano nginx.conf
```

Default configuration should work, but you can adjust:
- Server name
- SSL settings
- Cache settings
- Compression

## Step 5: Build and Run with Docker
```bash
# Make sure you're in the frontend directory
cd /path/to/streamit-app/frontend

# Build and start the container
docker-compose up -d --build
```

This will:
1. Build the Vite app with production environment
2. Create an optimized production build
3. Serve the static files with Nginx
4. Start on port 80 (HTTP) and 443 (HTTPS)

## Step 6: Check Logs
```bash
# View logs
docker-compose logs -f frontend

# Check if container is running
docker ps
```

## Step 7: Setup SSL with Certbot

### Option A: Direct SSL (No External Nginx)

If you're using the Nginx inside the container:

1. Install Certbot on the host:
```bash
sudo apt update
sudo apt install certbot -y
```

2. Stop the container temporarily:
```bash
docker-compose down
```

3. Get certificate:
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

4. Copy certificates to project directory:
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chmod 644 ssl/*.pem
```

5. Update nginx.conf to use certificates and restart:
```bash
docker-compose up -d
```

### Option B: External Nginx (Recommended)

Use a separate Nginx as reverse proxy on the host:

Install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/frontend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 8: Verify Deployment

Check if the site is accessible:
```bash
curl http://localhost
curl https://yourdomain.com
```

Open in browser: `https://yourdomain.com`

## Container Management Commands

### Start container
```bash
docker-compose up -d
```

### Stop container
```bash
docker-compose down
```

### Restart container
```bash
docker-compose restart
```

### View logs
```bash
docker-compose logs -f frontend
```

### Rebuild and restart
```bash
docker-compose down
docker-compose up -d --build
```

### Access container shell
```bash
docker-compose exec frontend sh
```

## Updating the Application

```bash
# Pull latest changes
cd /path/to/streamit-app/frontend
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Check if frontend is running
```bash
curl http://localhost
```

### View Nginx logs inside container
```bash
docker-compose exec frontend cat /var/log/nginx/access.log
docker-compose exec frontend cat /var/log/nginx/error.log
```

### Check container status
```bash
docker ps -a
```

### Test API connection from frontend
Open browser console and check:
- Network requests to API
- CORS errors (should be none)
- Any JavaScript errors

### Common Issues

**API not connecting:**
- Check VITE_API_URL in .env.production
- Verify backend CORS settings include frontend URL
- Check backend is running: `curl https://api.yourdomain.com`

**Static assets not loading:**
- Check Nginx configuration in container
- Verify build completed successfully in logs
- Check file permissions

**Container won't start:**
- Check logs: `docker-compose logs frontend`
- Verify port 80/443 aren't already in use
- Check Dockerfile syntax

## Performance Optimization

The Nginx configuration includes:
- ✅ Gzip compression
- ✅ Browser caching for static assets
- ✅ Security headers
- ✅ Asset optimization

## Security Checklist

- [ ] SSL certificate installed and valid
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Environment variables properly set
- [ ] HTTPS redirect enabled
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Regular security updates scheduled

## Monitoring

### Check CPU/Memory usage
```bash
docker stats
```

### Check Nginx access logs
```bash
docker-compose logs -f frontend
```

### Check disk space
```bash
df -h
```

## Backup Strategy

Frontend needs minimal backup since it's static files that can be rebuilt:

```bash
# Backup environment variables
cp .env.production .env.production.backup

# Backup custom Nginx config if modified
cp nginx.conf nginx.conf.backup
```

## Port Information

- **Frontend Container**: Serves on port 80 (HTTP) inside container
- **Host**: Maps to port 80/443 (with external Nginx)
- **API Backend**: Port 3000 (proxied through api.yourdomain.com)

## Environment Variables Reference

- `VITE_API_URL`: Backend API URL (e.g., https://api.yourdomain.com)
  - ⚠️ Must NOT have trailing slash
  - ⚠️ Must be set BEFORE building
  - ⚠️ Requires rebuild if changed

## Cache Management

Clear browser cache after deployment:
- Press Ctrl+Shift+R (hard refresh)
- Or clear cache in browser settings

Set proper cache headers in nginx.conf for optimal performance.

## Testing Deployment

1. **Homepage loads**: Visit https://yourdomain.com
2. **Auth works**: Try signing in/up
3. **API calls work**: Check Network tab in browser
4. **Assets load**: Images, CSS, JS files load
5. **No CORS errors**: Check browser console
6. **HTTPS works**: Green padlock in browser
7. **Mobile responsive**: Test on mobile device

## Quick Deployment Script

Create a deployment script for easy updates:

```bash
nano deploy.sh
```

Add:
```bash
#!/bin/bash
cd /path/to/streamit-app/frontend
git pull origin main
docker-compose down
docker-compose up -d --build
echo "✅ Frontend deployed successfully!"
```

Make executable:
```bash
chmod +x deploy.sh
```

Use:
```bash
./deploy.sh
```

## Clean Up Old Images

To free up space:
```bash
# Remove old unused images
docker image prune -a

# Remove old containers
docker container prune
```

## Health Checks

1. **Frontend accessible**: `https://yourdomain.com`
2. **API connectivity**: Check Network tab for API calls
3. **SSL valid**: Check certificate expiry
4. **No console errors**: Open browser DevTools

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs -f frontend`
2. Verify environment variables are set
3. Check API backend is running
4. Verify domain DNS is correct
5. Check Nginx configuration
6. Verify SSL certificate

## Scaling (Optional)

For high traffic:
1. Use AWS ECS/Fargate instead of single EC2
2. Add CloudFront CDN in front
3. Use AWS ALB for load balancing
4. Enable auto-scaling

---

**Last Updated**: November 10, 2024
