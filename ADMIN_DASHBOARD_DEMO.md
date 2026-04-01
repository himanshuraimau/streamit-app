# 🎯 Admin Dashboard Demo - Quick Start

Get the StreamIt Admin Dashboard running in 5 minutes for client demonstration.

## 🚀 Quick Start (Copy & Paste)

### Option 1: Automated Setup (Recommended)

```bash
# Run this single command to set everything up
cd backend && \
bun install && \
bun run db:seed-admin && \
bun run dev &
cd ../admin-fe && \
bun install && \
bun run dev
```

### Option 2: Step-by-Step Setup

#### 1. Install Dependencies & Seed Admin Users

```bash
# Backend
cd backend
bun install
bun run db:seed-admin
```

#### 2. Start Backend Server

```bash
# In backend directory
bun run dev
```

Keep this terminal running. Backend will be on **http://localhost:3000**

#### 3. Start Admin Frontend (New Terminal)

```bash
# Open new terminal
cd admin-fe
bun install
bun run dev
```

Admin dashboard will be on **http://localhost:5174**

## 🔐 Login Credentials

### For Full Demo (Recommended)

```
Email:    admin@streamit.com
Password: Admin@123
Role:     Super Admin (Full Access)
```

### Other Admin Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| moderator@streamit.com | Mod@123 | Moderator | Content & Reports |
| finance@streamit.com | Finance@123 | Finance Admin | Money & Ads |
| support@streamit.com | Support@123 | Support Admin | User Management |
| compliance@streamit.com | Comply@123 | Compliance | Legal & Audit |

## 📱 What to Show the Client

After logging in with `admin@streamit.com`, demonstrate these features:

### 1. Dashboard (Home)
- Overview metrics (DAU, MAU, Revenue)
- Real-time statistics
- Quick access to all modules

### 2. User Management
- View all users
- Search and filter users
- User actions: Freeze, Ban, Reset Password
- View user details and wallet

### 3. Streamer Management
- Creator applications review
- Live stream monitoring
- Stream control actions (Kill, Mute, Warn)

### 4. Content Moderation
- Moderation queue with flagged content
- Content preview
- Moderation actions (Dismiss, Warn, Remove, Strike, Ban)

### 5. Reports & Complaints
- User-submitted reports
- Report details with context
- Resolution actions

### 6. Monetization
- Coin purchase ledger
- Withdrawal requests (Approve/Reject)
- Gift transactions history

### 7. Advertisement Management
- Create ad campaigns
- Ad performance metrics
- Target audience configuration

### 8. Analytics
- Platform metrics and trends
- Top streamers by revenue
- Top content by engagement
- Conversion funnel

### 9. Compliance
- Audit log of all admin actions
- Geo-blocking management
- User data export (GDPR)
- Legal takedowns

### 10. Settings
- Platform configuration
- Admin role management
- System settings

## 🎨 UI Features to Highlight

- **Modern Design**: Clean, professional interface with shadcn/ui components
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data refresh for streams and metrics
- **Role-Based Access**: Different admins see different features
- **Accessibility**: Keyboard navigation, screen reader support

## 📊 Test Data Available

The seed script creates:
- ✅ 5 Admin users (different roles)
- ✅ 3 Test users (regular + creator)
- ✅ Coin wallets with balances
- ✅ Sample posts (including flagged content)
- ✅ Test reports for moderation
- ✅ Realistic data for demonstration

## 🔧 Troubleshooting

### "Cannot connect to backend"
```bash
# Check backend is running
curl http://localhost:3000/api/health

# If not, restart backend
cd backend && bun run dev
```

### "Login failed" or "User not found"
```bash
# Re-run seed script
cd backend
bun run db:seed-admin
```

### CORS errors in browser
```bash
# Check backend/.env has:
ADMIN_FRONTEND_URL=http://localhost:5174
```

### Port already in use
```bash
# Backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (port 5174)
lsof -ti:5174 | xargs kill -9
```

## 📝 Demo Script for Client

### Introduction (2 min)
"This is the StreamIt Admin Dashboard - a comprehensive platform management system with role-based access control."

### Login & Dashboard (3 min)
1. Login with super admin credentials
2. Show dashboard overview with metrics
3. Explain the sidebar navigation

### User Management (5 min)
1. Navigate to Users
2. Show search and filters
3. Click on a user to show details
4. Demonstrate freeze/ban actions
5. Show wallet information

### Content Moderation (5 min)
1. Navigate to Moderation Queue
2. Show flagged content
3. Click on content to review
4. Demonstrate moderation actions
5. Show how content is hidden after removal

### Monetization (5 min)
1. Navigate to Monetization
2. Show coin purchase ledger
3. Show withdrawal requests
4. Demonstrate approval/rejection workflow
5. Show gift transactions

### Analytics (3 min)
1. Navigate to Analytics
2. Show platform metrics
3. Demonstrate date range selection
4. Show top streamers and content charts

### Compliance & Audit (3 min)
1. Navigate to Compliance
2. Show audit log of all actions
3. Demonstrate data export feature
4. Show geo-blocking interface

### Settings (2 min)
1. Navigate to Settings
2. Show platform configuration
3. Show admin role management
4. Demonstrate role-based permissions

### Wrap-up (2 min)
"The dashboard is fully functional, production-ready, and can be deployed to any platform (Vercel, AWS, etc.)"

## 🎥 Recording the Demo

If recording for the client:

```bash
# Start both servers
cd backend && bun run dev &
cd admin-fe && bun run dev

# Open browser to http://localhost:5174
# Use screen recording software (OBS, Loom, etc.)
# Follow the demo script above
```

## 📦 Production Deployment

When ready to deploy for client:

1. **Backend**: Deploy to your server/cloud
2. **Frontend**: Deploy to Vercel/Netlify (see `admin-fe/DEPLOYMENT.md`)
3. **Update credentials**: Change all default passwords
4. **Configure domain**: Set up admin.streamit.com
5. **Enable SSL**: Automatic on most platforms

See `admin-fe/DEPLOYMENT.md` for detailed deployment instructions.

## 🆘 Need Help?

- **Setup Issues**: Check `ADMIN_SETUP_GUIDE.md`
- **Deployment**: Check `admin-fe/DEPLOYMENT.md`
- **API Documentation**: Check `backend/README.md`
- **Spec Details**: Check `.kiro/specs/admin-panel/`

---

## ✅ Pre-Demo Checklist

Before showing to client:

- [ ] Backend is running on port 3000
- [ ] Admin frontend is running on port 5174
- [ ] Can login with admin@streamit.com / Admin@123
- [ ] Dashboard loads with metrics
- [ ] All navigation items are accessible
- [ ] Test data is visible (users, posts, reports)
- [ ] No console errors in browser
- [ ] Dark mode toggle works
- [ ] Responsive design works on different screen sizes

---

**Ready to impress the client! 🚀**
