# 🚀 StreamIt AWS Deployment - Quick Reference

## 📦 What's Been Created

✅ **Backend Dockerfile** - Bun-based multi-stage build
✅ **Frontend Dockerfile** - Bun build + Nginx serve  
✅ **Docker Compose** - Full local stack (Postgres + Backend + Frontend)
✅ **Deployment Scripts** - Automated deploy.sh for both services
✅ **Nginx Config** - Production-ready with caching & security headers

---

## 🎯 Deployment Options

### Option 1: Docker Compose (All-in-One - Testing)
```bash
# Copy and configure environment
cp .env.docker .env
nano .env

# Build and start all services
docker-compose build
docker-compose up -d

# Initialize database
docker-compose exec backend bunx prisma migrate deploy

# Access
# Frontend: http://localhost
# Backend: http://localhost:3000
```

### Option 2: Separate EC2 Instances (Production)

#### Backend EC2
```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# 2. Clone and setup
git clone https://github.com/himanshuraimau/streamit-app.git
cd streamit-app/backend
nano .env  # Add your production values

# 3. Deploy
./deploy.sh

# Done! Backend running on port 3000
```

#### Frontend EC2
```bash
# 1. Install Docker  
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# 2. Clone repo
git clone https://github.com/himanshuraimau/streamit-app.git
cd streamit-app/frontend

# 3. Set environment and deploy
export VITE_API_URL=http://your-backend-ip:3000
export VITE_LIVEKIT_WS_URL=wss://your-livekit.livekit.cloud
./deploy.sh

# Done! Frontend running on port 80
```

---

## 🔑 Required Environment Variables

### Backend (.env file)
```env
# Database (RDS)
DATABASE_URL=postgresql://user:pass@rds-endpoint.amazonaws.com:5432/db

# Auth
BETTER_AUTH_SECRET=your-32-char-secret-key
BETTER_AUTH_URL=http://backend-ip:3000

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# LiveKit
LIVEKIT_URL=wss://your-server.livekit.cloud
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret

# Email
RESEND_API_KEY=your-resend-key

# CORS
FRONTEND_URL=http://frontend-ip
```

### Frontend (export before deploy)
```bash
export VITE_API_URL=http://backend-ip:3000
export VITE_LIVEKIT_WS_URL=wss://your-server.livekit.cloud
export VITE_BETTER_AUTH_URL=http://backend-ip:3000
```

---

## 📋 AWS Resources Needed

| Resource | Purpose | Configuration |
|----------|---------|---------------|
| **EC2 (Backend)** | Run Node.js API | t3.medium, Ubuntu 22.04, Port 3000 |
| **EC2 (Frontend)** | Serve static files | t3.small, Ubuntu 22.04, Ports 80/443 |
| **RDS PostgreSQL** | Database | db.t3.medium, v15/16 |
| **S3 Bucket** | File storage | Standard, Public read for assets |
| **Security Groups** | Firewall rules | Allow 22, 80, 443, 3000, 5432 |

---

## 🛠️ Common Commands

### Backend
```bash
# Deploy/Update
cd backend && ./deploy.sh

# View logs
docker logs -f streamit-backend

# Database migration
docker exec streamit-backend bunx prisma migrate deploy

# Prisma Studio (DB GUI)
docker exec -it streamit-backend bunx prisma studio

# Restart
docker restart streamit-backend
```

### Frontend
```bash
# Deploy/Update
cd frontend
export VITE_API_URL=http://backend-ip:3000
export VITE_LIVEKIT_WS_URL=wss://...
./deploy.sh

# View logs
docker logs -f streamit-frontend

# Restart
docker restart streamit-frontend
```

### Health Checks
```bash
# Backend
curl http://backend-ip:3000/health

# Frontend
curl http://frontend-ip/health
```

---

## 🔄 Update/Redeploy

### Backend Update
```bash
cd ~/streamit-app/backend
git pull
./deploy.sh
```

### Frontend Update
```bash
cd ~/streamit-app/frontend
git pull
export VITE_API_URL=http://backend-ip:3000
export VITE_LIVEKIT_WS_URL=wss://...
./deploy.sh
```

---

## 🐛 Troubleshooting

### Backend won't connect to database
```bash
# Test connection
docker exec streamit-backend bunx prisma db pull

# Check env vars
docker exec streamit-backend env | grep DATABASE_URL

# Check RDS security group allows EC2
```

### Frontend can't reach backend
```bash
# From frontend EC2, test backend
curl http://backend-ip:3000/health

# Check CORS in backend logs
docker logs streamit-backend | grep CORS

# Verify VITE_API_URL was set during build
docker inspect streamit-frontend | grep VITE_API_URL
```

### Container keeps restarting
```bash
# Check logs for errors
docker logs streamit-backend  # or streamit-frontend

# Check container status
docker ps -a

# Run health check manually
docker exec streamit-backend curl http://localhost:3000/health
```

---

## 📊 Monitoring

```bash
# Container stats
docker stats

# System resources
htop  # or top

# Disk usage
df -h
docker system df

# Clean up old images
docker system prune -a
```

---

## 🔒 Security Checklist

- [ ] Change default passwords in .env
- [ ] Use strong BETTER_AUTH_SECRET (32+ chars)
- [ ] Configure RDS security group (only allow backend EC2)
- [ ] Setup SSL/HTTPS with Let's Encrypt
- [ ] Enable AWS CloudWatch monitoring
- [ ] Setup RDS automated backups
- [ ] Use IAM roles instead of access keys where possible
- [ ] Keep Docker and system packages updated

---

## 📝 File Structure

```
streamit-app/
├── backend/
│   ├── Dockerfile              ✅ Bun-based backend
│   ├── .dockerignore          ✅ Optimize build
│   ├── deploy.sh              ✅ Auto deployment script
│   └── .env                   ⚠️ Create this
├── frontend/
│   ├── Dockerfile             ✅ Bun build + Nginx
│   ├── nginx.conf             ✅ Production config
│   ├── .dockerignore          ✅ Optimize build
│   ├── deploy.sh              ✅ Auto deployment script
│   └── .env                   ⚠️ Not needed (use exports)
├── docker-compose.yml         ✅ Local dev stack
├── .env.docker                ✅ Template for compose
├── DOCKER_DEPLOYMENT.md       ✅ Full guide
└── DEPLOYMENT_QUICK_REF.md    ✅ This file
```

---

## 🎉 Next Steps

1. ✅ Docker setup complete
2. ⏭️ Create RDS PostgreSQL database
3. ⏭️ Launch Backend EC2 and run `deploy.sh`
4. ⏭️ Launch Frontend EC2 and run `deploy.sh`
5. ⏭️ Test end-to-end functionality
6. ⏭️ Setup domain and SSL (optional)

**Need more details?** See `DOCKER_DEPLOYMENT.md` for the complete guide!
