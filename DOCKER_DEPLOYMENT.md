# StreamIt Docker Deployment Guide

## 🐳 Docker Setup Complete!

I've created Docker containers for both the backend and frontend using Bun. Here's what was created:

### Files Created:

1. **Backend:**
   - `backend/Dockerfile` - Multi-stage Bun Docker image
   - `backend/.dockerignore` - Optimized build context

2. **Frontend:**
   - `frontend/Dockerfile` - Bun build + Nginx serve
   - `frontend/nginx.conf` - Production nginx configuration
   - `frontend/.dockerignore` - Optimized build context

3. **Orchestration:**
   - `docker-compose.yml` - Complete stack (Postgres + Backend + Frontend)
   - `.env.docker` - Environment variables template

---

## 🚀 Quick Start (Local Testing)

### 1. Setup Environment Variables

```bash
# Copy the template
cp .env.docker .env

# Edit .env and fill in your actual credentials
nano .env
```

### 2. Build and Run with Docker Compose

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Initialize Database

```bash
# Run Prisma migrations
docker-compose exec backend bunx prisma migrate deploy

# (Optional) Seed data if you have seeds
docker-compose exec backend bunx prisma db seed
```

### 4. Access Your Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000
- **Database:** localhost:5432 (accessible from host)

---

## 🏗️ AWS Deployment (Separate EC2 Instances)

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend EC2  │────────▶│   Backend EC2   │
│   (Nginx)       │         │   (Bun + API)   │
└─────────────────┘         └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼────┐    ┌────▼─────┐   ┌────▼─────┐
              │ RDS      │    │ S3       │   │ LiveKit  │
              │ Postgres │    │ Bucket   │   │ Cloud    │
              └──────────┘    └──────────┘   └──────────┘
```

---

## 📦 Backend EC2 Setup

### 1. Launch EC2 Instance

```bash
# Recommended: Ubuntu 22.04 LTS
# Instance type: t3.medium or larger
# Security Group: Allow ports 22 (SSH), 3000 (API)
```

### 2. Connect and Install Dependencies

```bash
# SSH into your backend EC2
ssh -i your-key.pem ubuntu@your-backend-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group to take effect
exit
```

### 3. Setup Application

```bash
# Clone your repository
git clone https://github.com/himanshuraimau/streamit-app.git
cd streamit-app/backend

# Create .env file
nano .env
```

**Backend .env file:**
```env
# Database (Use RDS endpoint)
DATABASE_URL=postgresql://username:password@your-rds-endpoint.rds.amazonaws.com:5432/streamit

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=http://your-backend-ip:3000

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name

# LiveKit
LIVEKIT_URL=wss://your-livekit.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret

# Email
RESEND_API_KEY=your_resend_key

# CORS
FRONTEND_URL=http://your-frontend-ip

# Environment
NODE_ENV=production
PORT=3000
```

### 4. Build and Run Backend

```bash
# Build Docker image
docker build -t streamit-backend .

# Run container
docker run -d \
  --name streamit-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  streamit-backend

# Check logs
docker logs -f streamit-backend

# Run migrations
docker exec streamit-backend bunx prisma migrate deploy
```

### 5. Setup as System Service (Optional but Recommended)

```bash
# Create systemd service
sudo nano /etc/systemd/system/streamit-backend.service
```

```ini
[Unit]
Description=StreamIt Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/streamit-app/backend
ExecStart=/usr/bin/docker start streamit-backend
ExecStop=/usr/bin/docker stop streamit-backend
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable streamit-backend
sudo systemctl start streamit-backend
sudo systemctl status streamit-backend
```

---

## 🌐 Frontend EC2 Setup

### 1. Launch EC2 Instance

```bash
# Recommended: Ubuntu 22.04 LTS
# Instance type: t3.small or larger
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### 2. Connect and Install Dependencies

```bash
# SSH into your frontend EC2
ssh -i your-key.pem ubuntu@your-frontend-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Logout and login again
exit
```

### 3. Setup Application

```bash
# Clone your repository
git clone https://github.com/himanshuraimau/streamit-app.git
cd streamit-app/frontend

# No need for .env file - we'll use build args
```

### 4. Build and Run Frontend

```bash
# Build with environment variables
docker build \
  --build-arg VITE_API_URL=http://your-backend-ip:3000 \
  --build-arg VITE_LIVEKIT_WS_URL=wss://your-livekit.livekit.cloud \
  --build-arg VITE_BETTER_AUTH_URL=http://your-backend-ip:3000 \
  -t streamit-frontend .

# Run container
docker run -d \
  --name streamit-frontend \
  --restart unless-stopped \
  -p 80:80 \
  streamit-frontend

# Check logs
docker logs -f streamit-frontend
```

### 5. Setup as System Service

```bash
sudo nano /etc/systemd/system/streamit-frontend.service
```

```ini
[Unit]
Description=StreamIt Frontend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/streamit-app/frontend
ExecStart=/usr/bin/docker start streamit-frontend
ExecStop=/usr/bin/docker stop streamit-frontend
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable streamit-frontend
sudo systemctl start streamit-frontend
sudo systemctl status streamit-frontend
```

---

## 🗄️ Database Setup (AWS RDS)

### 1. Create RDS PostgreSQL Instance

1. Go to AWS RDS Console
2. Create Database
3. Choose PostgreSQL (version 15 or 16)
4. Select instance size (db.t3.micro for testing, db.t3.medium+ for production)
5. Set master username and password
6. Configure VPC (same as your EC2 or allow connections from EC2 security group)
7. Note the endpoint URL

### 2. Configure Security Group

```bash
# Allow PostgreSQL port 5432 from Backend EC2 security group
```

### 3. Initialize Database

```bash
# From backend EC2
docker exec streamit-backend bunx prisma migrate deploy
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://your-backend-ip:3000/health

# Frontend health
curl http://your-frontend-ip/health

# Check Docker container status
docker ps
docker stats
```

### View Logs

```bash
# Backend logs
docker logs -f streamit-backend

# Frontend logs
docker logs -f streamit-frontend

# System logs
journalctl -u streamit-backend -f
journalctl -u streamit-frontend -f
```

### Updates & Redeployment

```bash
# Backend
cd ~/streamit-app/backend
git pull
docker build -t streamit-backend .
docker stop streamit-backend
docker rm streamit-backend
docker run -d --name streamit-backend --restart unless-stopped -p 3000:3000 --env-file .env streamit-backend
docker exec streamit-backend bunx prisma migrate deploy

# Frontend
cd ~/streamit-app/frontend
git pull
docker build --build-arg VITE_API_URL=http://your-backend-ip:3000 \
  --build-arg VITE_LIVEKIT_WS_URL=wss://your-livekit.livekit.cloud \
  --build-arg VITE_BETTER_AUTH_URL=http://your-backend-ip:3000 \
  -t streamit-frontend .
docker stop streamit-frontend
docker rm streamit-frontend
docker run -d --name streamit-frontend --restart unless-stopped -p 80:80 streamit-frontend
```

---

## 🔒 Security Best Practices

1. **Use HTTPS:** Setup SSL certificates with Let's Encrypt
2. **Restrict Security Groups:** Only allow necessary ports
3. **Environment Variables:** Never commit secrets to git
4. **Regular Updates:** Keep system and Docker images updated
5. **Backup Database:** Setup automated RDS backups
6. **IAM Roles:** Use IAM roles instead of access keys when possible
7. **Monitoring:** Setup CloudWatch alarms

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs streamit-backend

# Check if database is accessible
docker exec streamit-backend bunx prisma db pull

# Verify environment variables
docker exec streamit-backend env | grep DATABASE_URL
```

### Frontend shows API errors
```bash
# Check if backend is accessible from frontend
# SSH into frontend EC2
curl http://your-backend-ip:3000/health

# Check CORS settings in backend
docker logs streamit-backend | grep CORS
```

### Database connection issues
```bash
# Test connection from backend EC2
docker exec streamit-backend bunx prisma studio

# Check RDS security group allows backend EC2
# Check DATABASE_URL is correct
```

---

## 📝 Quick Reference

### Useful Docker Commands

```bash
# View running containers
docker ps

# Stop container
docker stop streamit-backend

# Start container
docker start streamit-backend

# Restart container
docker restart streamit-backend

# Remove container
docker rm streamit-backend

# View logs
docker logs -f streamit-backend

# Execute command in container
docker exec -it streamit-backend bash

# View container stats
docker stats

# Clean up unused images
docker system prune -a
```

---

## 🎉 Next Steps

1. ✅ Docker containers are ready
2. ⏭️ Setup AWS RDS PostgreSQL
3. ⏭️ Launch Backend EC2 and deploy
4. ⏭️ Launch Frontend EC2 and deploy
5. ⏭️ Configure domain and SSL (optional)
6. ⏭️ Setup monitoring and backups

Need help with any specific step? Let me know!
