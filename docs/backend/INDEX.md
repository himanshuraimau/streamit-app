# StreamIt Backend Documentation Index

Welcome to the comprehensive documentation for the StreamIt backend. This directory contains detailed technical documentation covering all aspects of the backend system.

## 📚 Documentation Structure

### 1. [README.md](./README.md) - Overview & Getting Started
**Start here if you're new to the project**

- System overview and tech stack
- Core features summary
- Quick start guide
- Installation instructions
- Development setup
- Environment configuration basics

**Best for**: New developers, project overview, initial setup

---

### 2. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Complete API Reference
**Comprehensive endpoint documentation**

- All API endpoints with request/response examples
- Authentication endpoints (sign up, sign in, OTP flows)
- Creator endpoints (applications, file uploads)
- Stream endpoints (WebRTC streaming lifecycle)
- Viewer endpoints (watching streams, profiles)
- Social endpoints (follow, block, discovery)
- Content endpoints (posts, comments, likes)
- Payment endpoints (coins, gifts, purchases)
- Discount code endpoints
- Search and webhook endpoints
- Error response formats

**Best for**: Frontend developers, API integration, testing

---

### 3. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data Models & Relationships
**Complete database schema documentation**

- Entity relationship diagrams
- All Prisma models with field descriptions
- Database relationships and constraints
- Enums and their values
- Indexes for performance
- Common query patterns
- Migration management
- Seeding instructions

**Best for**: Database design, data modeling, backend developers

---

### 4. [CONFIGURATION.md](./CONFIGURATION.md) - Setup & Deployment Guide
**Environment setup and deployment instructions**

- Environment variable reference
- PostgreSQL database setup
- Better Auth configuration
- AWS S3 setup and configuration
- LiveKit streaming setup (cloud & self-hosted)
- Dodo Payments integration
- Resend email service setup
- Local development guide
- Production deployment (PM2, systemd, Nginx)
- Docker deployment
- Security checklist
- Troubleshooting guide
- Backup & recovery procedures

**Best for**: DevOps, deployment, environment setup

---

### 5. [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Deep Dive
**In-depth architecture and implementation details**

- System architecture overview
- Service layer design patterns
- Middleware architecture
- Authentication flow diagrams
- Payment processing flow
- Streaming architecture (WebRTC with LiveKit)
- File upload system
- Error handling patterns
- Security best practices
- Code examples and patterns
- Performance optimization tips

**Best for**: Senior developers, architecture decisions, best practices

---

## 🚀 Quick Navigation by Role

### **New Developer**
1. Start with [README.md](./README.md) - Understand the system
2. Follow setup in [CONFIGURATION.md](./CONFIGURATION.md) - Get running locally
3. Review [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Understand API structure
4. Read [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Learn data models

### **Frontend Developer**
1. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - All endpoints you need to call
2. [README.md](./README.md) - Authentication & CORS setup
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Authentication flow section

### **Backend Developer**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Design patterns and services
2. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data modeling
3. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API contracts
4. [README.md](./README.md) - Project structure

### **DevOps/Infrastructure**
1. [CONFIGURATION.md](./CONFIGURATION.md) - Complete deployment guide
2. [README.md](./README.md) - Environment variables
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

### **Product Manager**
1. [README.md](./README.md) - Feature overview
2. [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Available functionality
3. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data capabilities

---

## 🔍 Quick Reference by Topic

### Authentication & Authorization
- [README.md](./README.md) - Auth overview
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Auth endpoints
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Auth flow & implementation
- [CONFIGURATION.md](./CONFIGURATION.md) - Better Auth setup

### Live Streaming
- [README.md](./README.md) - Streaming features
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Stream endpoints
- [ARCHITECTURE.md](./ARCHITECTURE.md) - WebRTC architecture
- [CONFIGURATION.md](./CONFIGURATION.md) - LiveKit setup

### Payments & Monetization
- [README.md](./README.md) - Payment features
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Payment endpoints
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Payment models
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Payment processing flow
- [CONFIGURATION.md](./CONFIGURATION.md) - Dodo Payments setup

### Social Features
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Social endpoints
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Social models
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Content service

### File Uploads
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Upload endpoints
- [ARCHITECTURE.md](./ARCHITECTURE.md) - File upload system
- [CONFIGURATION.md](./CONFIGURATION.md) - S3 setup

### Database
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema
- [CONFIGURATION.md](./CONFIGURATION.md) - Database setup
- [README.md](./README.md) - Database commands

### Deployment
- [CONFIGURATION.md](./CONFIGURATION.md) - Complete deployment guide
- [README.md](./README.md) - Quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System requirements

---

## 📊 Documentation Stats

- **Total Files**: 5 main documentation files
- **Total Lines**: ~2,500+ lines of documentation
- **Topics Covered**: 50+ major topics
- **Code Examples**: 100+ code snippets
- **API Endpoints**: 60+ documented endpoints
- **Database Models**: 20+ models documented

---

## 🔗 External Resources

### Official Documentation
- [Bun Runtime](https://bun.sh/docs)
- [Express.js](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/docs)
- [Better Auth](https://www.better-auth.com/docs)
- [LiveKit](https://docs.livekit.io/)
- [Dodo Payments](https://docs.dodopayments.com/)
- [AWS S3](https://docs.aws.amazon.com/s3/)
- [Resend](https://resend.com/docs)

### Related Documentation
- Frontend Documentation: `../frontend/` (if exists)
- Deployment Scripts: `../../backend/deploy.sh`
- Database Schema: `../../backend/prisma/schema.prisma`
- Environment Template: `../../backend/.env.example`

---

## 🤝 Contributing to Documentation

When updating documentation:

1. **Keep it current** - Update docs when code changes
2. **Be comprehensive** - Include examples and explanations
3. **Use consistent formatting** - Follow existing patterns
4. **Add code examples** - Show, don't just tell
5. **Update this index** - When adding new sections

### Documentation Standards

- Use clear, concise language
- Include code examples for complex topics
- Add diagrams where helpful
- Keep navigation links updated
- Test all code examples
- Include error handling examples
- Document environment variables
- Add troubleshooting sections

---

## ❓ Getting Help

### For Technical Issues
1. Check [CONFIGURATION.md](./CONFIGURATION.md) - Troubleshooting section
2. Review relevant architecture in [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Verify environment setup in [README.md](./README.md)

### For API Questions
1. Check [API_ENDPOINTS.md](./API_ENDPOINTS.md) for endpoint details
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for implementation patterns

### For Database Questions
1. Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for model details
2. Review Prisma documentation
3. Check migration files in `prisma/migrations/`

---

## 📝 Documentation TODOs

Items to add in future updates:

- [ ] Rate limiting implementation and configuration
- [ ] Redis caching setup and patterns
- [ ] Testing guide (unit, integration, e2e)
- [ ] Monitoring and observability setup
- [ ] Performance benchmarks
- [ ] API versioning strategy
- [ ] WebSocket real-time features
- [ ] Admin dashboard endpoints
- [ ] Payout system documentation
- [ ] Content moderation workflows

---

## 📅 Last Updated

**Date**: January 8, 2026

**Version**: 1.0.0

**Contributors**: Development Team

---

## 📄 License

[Add your license information]

---

**Need something specific?** Use the navigation sections above to jump to the right document, or start with [README.md](./README.md) for a complete overview.

**Questions or feedback?** Contact the development team or open an issue in the repository.
