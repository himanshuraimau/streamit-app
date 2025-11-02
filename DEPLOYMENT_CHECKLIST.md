# ✅ StreamIt AWS Deployment Checklist

Use this checklist to track your deployment progress.

## 🎯 Pre-Deployment Setup

### AWS Account Setup
- [ ] AWS account created and configured
- [ ] IAM user created with appropriate permissions
- [ ] AWS CLI installed and configured (optional)

### Domain & DNS (Optional)
- [ ] Domain name purchased
- [ ] DNS configured to point to EC2 instances

---

## 🗄️ Database Setup (RDS)

- [ ] Create RDS PostgreSQL instance
  - [ ] Choose version: PostgreSQL 15 or 16
  - [ ] Instance type: db.t3.medium (minimum)
  - [ ] Set master username: `streamit`
  - [ ] Set strong master password
  - [ ] Configure VPC and subnet
  - [ ] Make note of endpoint URL
  
- [ ] Configure Security Group
  - [ ] Allow PostgreSQL (5432) from Backend EC2 security group
  - [ ] No public access (for security)
  
- [ ] Test connection
  - [ ] Can connect from backend EC2
  - [ ] Database is accessible

**Endpoint URL:** `_______________________`

---

## 🗂️ Storage Setup (S3)

- [ ] Create S3 bucket
  - [ ] Bucket name: `streamit-uploads-[unique-id]`
  - [ ] Region: us-east-1 (or your preferred region)
  - [ ] Enable versioning (optional)
  
- [ ] Configure bucket policy
  - [ ] Public read for user uploads (images/videos)
  - [ ] Private for sensitive data
  
- [ ] Create IAM user for S3 access
  - [ ] Generate access key and secret
  - [ ] Attach policy: AmazonS3FullAccess (or custom limited policy)

**Bucket Name:** `_______________________`  
**Access Key ID:** `_______________________`  
**Secret Access Key:** `_______________________`

---

## 🎥 LiveKit Setup

- [ ] Sign up for LiveKit Cloud (or self-host)
- [ ] Create new project
- [ ] Generate API keys
- [ ] Note WebSocket URL

**LiveKit URL:** `wss://_______________________`  
**API Key:** `_______________________`  
**API Secret:** `_______________________`

---

## 📧 Email Setup (Resend)

- [ ] Sign up for Resend account
- [ ] Verify domain (optional but recommended)
- [ ] Generate API key

**Resend API Key:** `re________________________`

---

## 🖥️ Backend EC2 Setup

### Instance Configuration
- [ ] Launch EC2 instance
  - [ ] AMI: Ubuntu 22.04 LTS
  - [ ] Instance type: t3.medium or larger
  - [ ] Create/select key pair for SSH
  - [ ] Storage: 20GB+ GP3
  
- [ ] Configure Security Group
  - [ ] Allow SSH (22) from your IP
  - [ ] Allow HTTP (3000) from Frontend EC2 or public
  - [ ] Allow PostgreSQL (5432) from RDS security group

**Backend Public IP:** `_______________________`  
**Key Pair Name:** `_______________________`

### Installation
- [ ] Connect to EC2: `ssh -i key.pem ubuntu@backend-ip`
- [ ] Install Docker
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker ubuntu
  # Logout and login again
  ```
- [ ] Clone repository
  ```bash
  git clone https://github.com/himanshuraimau/streamit-app.git
  cd streamit-app/backend
  ```

### Configuration
- [ ] Create `.env` file with:
  - [ ] DATABASE_URL (RDS endpoint)
  - [ ] BETTER_AUTH_SECRET (32+ chars)
  - [ ] BETTER_AUTH_URL (http://backend-ip:3000)
  - [ ] AWS credentials (S3)
  - [ ] LIVEKIT credentials
  - [ ] RESEND_API_KEY
  - [ ] FRONTEND_URL (http://frontend-ip)

### Deployment
- [ ] Run deployment script: `./deploy.sh`
- [ ] Verify container is running: `docker ps`
- [ ] Check logs: `docker logs -f streamit-backend`
- [ ] Test health: `curl http://localhost:3000/health`
- [ ] Test from outside: `curl http://backend-ip:3000/health`

---

## 🌐 Frontend EC2 Setup

### Instance Configuration
- [ ] Launch EC2 instance
  - [ ] AMI: Ubuntu 22.04 LTS
  - [ ] Instance type: t3.small or larger
  - [ ] Use same/different key pair
  - [ ] Storage: 10GB+ GP3
  
- [ ] Configure Security Group
  - [ ] Allow SSH (22) from your IP
  - [ ] Allow HTTP (80) from anywhere
  - [ ] Allow HTTPS (443) from anywhere (if using SSL)

**Frontend Public IP:** `_______________________`  
**Key Pair Name:** `_______________________`

### Installation
- [ ] Connect to EC2: `ssh -i key.pem ubuntu@frontend-ip`
- [ ] Install Docker
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker ubuntu
  # Logout and login again
  ```
- [ ] Clone repository
  ```bash
  git clone https://github.com/himanshuraimau/streamit-app.git
  cd streamit-app/frontend
  ```

### Configuration & Deployment
- [ ] Set environment variables:
  ```bash
  export VITE_API_URL=http://backend-ip:3000
  export VITE_LIVEKIT_WS_URL=wss://your-livekit.livekit.cloud
  export VITE_BETTER_AUTH_URL=http://backend-ip:3000
  ```
- [ ] Run deployment script: `./deploy.sh`
- [ ] Verify container is running: `docker ps`
- [ ] Check logs: `docker logs -f streamit-frontend`
- [ ] Test health: `curl http://localhost/health`
- [ ] Test from browser: Open `http://frontend-ip`

---

## 🧪 Testing

### Backend Tests
- [ ] Health check: `curl http://backend-ip:3000/health`
- [ ] Database connection working
- [ ] Can create user account
- [ ] Can login/logout
- [ ] File upload to S3 works

### Frontend Tests
- [ ] Application loads in browser
- [ ] Can navigate between pages
- [ ] Can create account
- [ ] Can login
- [ ] Can view streams
- [ ] Live streaming works

### Integration Tests
- [ ] Frontend can reach backend API
- [ ] Authentication flow works end-to-end
- [ ] LiveKit video streaming works
- [ ] File uploads work
- [ ] Real-time features work

---

## 🔒 Security Hardening (Recommended)

- [ ] Change default SSH port
- [ ] Setup fail2ban for SSH
- [ ] Enable automatic security updates
- [ ] Setup CloudWatch monitoring
- [ ] Enable RDS automated backups
- [ ] Setup CloudWatch alarms
- [ ] Configure log retention
- [ ] Setup SSL/HTTPS with Let's Encrypt

---

## 📊 Monitoring Setup

- [ ] Setup CloudWatch dashboards
- [ ] Configure log groups
- [ ] Create alarms for:
  - [ ] High CPU usage
  - [ ] High memory usage
  - [ ] Disk space running low
  - [ ] Application errors
  - [ ] Database connections

---

## 🔄 Maintenance Plan

- [ ] Document backup procedures
- [ ] Document update/deployment procedures
- [ ] Setup monitoring alerts
- [ ] Plan for scaling (if needed)
- [ ] Document troubleshooting steps

---

## 📝 Important URLs & Credentials

**Save these securely (use password manager):**

| Service | Value |
|---------|-------|
| Frontend URL | http://_______________________ |
| Backend URL | http://_______________________:3000 |
| RDS Endpoint | _______________________ |
| S3 Bucket | _______________________ |
| Backend EC2 IP | _______________________ |
| Frontend EC2 IP | _______________________ |
| Database Password | _______________________ |
| BETTER_AUTH_SECRET | _______________________ |

---

## ✅ Final Checklist

- [ ] All services are running
- [ ] Health checks are passing
- [ ] Can create and login to accounts
- [ ] Can upload content
- [ ] Live streaming works
- [ ] No errors in logs
- [ ] Monitoring is setup
- [ ] Backups are configured
- [ ] Documentation is complete

---

## 🎉 Deployment Complete!

Once all items are checked, your StreamIt application is live on AWS! 

**Next Steps:**
1. Test thoroughly with real users
2. Monitor performance and logs
3. Setup alerts for issues
4. Plan for scaling if needed
5. Keep Docker images and system packages updated

**Need Help?** Refer to:
- `DOCKER_DEPLOYMENT.md` - Full deployment guide
- `DEPLOYMENT_QUICK_REF.md` - Quick reference
- Backend logs: `docker logs -f streamit-backend`
- Frontend logs: `docker logs -f streamit-frontend`
