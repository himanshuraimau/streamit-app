# StreamIt Admin Dashboard - Quick Setup Guide

This guide will help you get the admin dashboard running with test credentials for client demonstration.

## Prerequisites

- Backend is set up with database connection
- Node.js/Bun installed
- PostgreSQL database running

## Step 1: Seed Admin Credentials

Run the admin seed script to create admin users:

```bash
cd backend
bun run db:seed-admin
```

This will create 5 admin accounts with different roles:

### Admin Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Super Admin** | admin@streamit.com | Admin@123 | Full access to all features |
| **Moderator** | moderator@streamit.com | Mod@123 | Content moderation, reports, streams |
| **Finance Admin** | finance@streamit.com | Finance@123 | Monetization, withdrawals, ads |
| **Support Admin** | support@streamit.com | Support@123 | User management, support |
| **Compliance Officer** | compliance@streamit.com | Comply@123 | Legal, compliance, audit logs |

## Step 2: Start the Backend

```bash
cd backend
bun run dev
```

The backend will start on http://localhost:3000

## Step 3: Start the Admin Frontend

Open a new terminal:

```bash
cd admin-fe
bun install  # If not already installed
bun run dev
```

The admin dashboard will start on http://localhost:5174

## Step 4: Login to Admin Dashboard

1. Open your browser and go to: **http://localhost:5174**
2. You'll see the admin login page
3. Use any of the credentials above to login

### Recommended for Demo:

**Use Super Admin for full access:**
- Email: `admin@streamit.com`
- Password: `Admin@123`

## What You'll See

After logging in, you'll have access to:

- **Dashboard** - Overview metrics and statistics
- **Users** - User management (freeze, ban, reset password)
- **Streamers** - Creator applications and live stream monitoring
- **Moderation** - Content moderation queue
- **Reports** - User reports and complaints
- **Monetization** - Coin ledger, withdrawals, gifts
- **Ads** - Advertisement campaigns
- **Analytics** - Platform analytics and metrics
- **Compliance** - Audit logs, geo-blocking, data exports
- **Settings** - Platform settings and admin role management

## Troubleshooting

### Issue: "User not found" or login fails

**Solution**: Make sure you ran the seed script:
```bash
cd backend
bun run db:seed-admin
```

### Issue: CORS errors in browser console

**Solution**: Verify backend .env has:
```env
ADMIN_FRONTEND_URL=http://localhost:5174
```

### Issue: "Cannot connect to database"

**Solution**: Check your DATABASE_URL in backend/.env and ensure PostgreSQL is running

### Issue: Admin frontend shows blank page

**Solution**: 
1. Check browser console for errors
2. Verify backend is running on port 3000
3. Check admin-fe/.env has: `VITE_API_URL=http://localhost:3000`

## Additional Test Data

The seed script also creates:
- 3 test users (regular users and creators)
- Coin wallets with random balances
- Sample posts (including flagged content)
- Test reports for moderation

This gives you realistic data to demonstrate the admin dashboard features.

## Resetting Admin Data

If you need to reset and recreate admin users:

```bash
# Delete existing admin users from database
cd backend
bunx prisma studio  # Open Prisma Studio and delete users manually

# Or use SQL
psql -d streamit -c "DELETE FROM \"user\" WHERE role IN ('SUPER_ADMIN', 'MODERATOR', 'FINANCE_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER');"

# Then re-run seed
bun run db:seed-admin
```

## Production Note

⚠️ **Important**: These are test credentials for development/demo only. For production:
1. Use strong, unique passwords
2. Enable 2FA if available
3. Restrict admin panel access by IP or VPN
4. Change all default passwords immediately
5. Follow security best practices in DEPLOYMENT.md

## Support

For more information:
- Backend README: `backend/README.md`
- Admin Frontend README: `admin-fe/README.md`
- Deployment Guide: `admin-fe/DEPLOYMENT.md`
- Spec Documentation: `.kiro/specs/admin-panel/`

---

**Quick Start Commands:**

```bash
# Terminal 1 - Backend
cd backend && bun run db:seed-admin && bun run dev

# Terminal 2 - Admin Frontend  
cd admin-fe && bun run dev

# Then visit: http://localhost:5174
# Login: admin@streamit.com / Admin@123
```
