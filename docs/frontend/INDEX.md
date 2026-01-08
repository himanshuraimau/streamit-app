# Frontend Documentation Index

Quick reference guide for StreamIt frontend documentation.

## 📚 Documentation Files

| Document | Description | When to Use |
|----------|-------------|-------------|
| [START HERE](./00_START_HERE.md) | Entry point, navigation | First time here |
| [QUICK_START.md](./QUICK_START.md) | 5-minute setup | Getting started |
| [README.md](./README.md) | Complete overview | Understanding the project |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | All components | Building UI |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | State patterns | Managing state |
| [ROUTING_PAGES.md](./ROUTING_PAGES.md) | All routes & pages | Adding pages |
| [CONFIGURATION.md](./CONFIGURATION.md) | Setup & deployment | Deployment |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical deep dive | Understanding system |
| [INDEX.md](./INDEX.md) | This file | Quick lookup |

---

## 🚀 Quick Links

### Getting Started
- [Installation Guide](./QUICK_START.md#prerequisites)
- [Environment Setup](./QUICK_START.md#environment-setup)
- [Start Development](./QUICK_START.md#5-minute-setup)
- [Project Structure](./QUICK_START.md#project-structure)

### Development
- [Create New Page](./ROUTING_PAGES.md)
- [Add Component](./COMPONENT_LIBRARY.md)
- [Use Custom Hook](./STATE_MANAGEMENT.md#custom-hooks)
- [API Integration](./STATE_MANAGEMENT.md#react-query-usage)

### Components
- [UI Primitives](./COMPONENT_LIBRARY.md#ui-primitives)
- [Stream Components](./COMPONENT_LIBRARY.md#stream-components)
- [Payment Components](./COMPONENT_LIBRARY.md#payment-components)
- [Forms](./COMPONENT_LIBRARY.md#form)

### State
- [Zustand Stores](./STATE_MANAGEMENT.md#zustand-stores)
- [Custom Hooks](./STATE_MANAGEMENT.md#custom-hooks)
- [React Query](./STATE_MANAGEMENT.md#react-query-usage)
- [Best Practices](./STATE_MANAGEMENT.md#best-practices)

### Routing
- [All Routes](./ROUTING_PAGES.md#route-structure)
- [Protected Routes](./ROUTING_PAGES.md#route-protection)
- [Creator Routes](./ROUTING_PAGES.md#creator-routes)
- [Auth Routes](./ROUTING_PAGES.md#authentication-routes)

### Deployment
- [Docker Build](./CONFIGURATION.md#docker-deployment)
- [Production Build](./CONFIGURATION.md#production-build)
- [Nginx Config](./CONFIGURATION.md#nginx-configuration)
- [CI/CD](./CONFIGURATION.md#production-deployment)

---

## 📖 By Topic

### Authentication
- [Auth Architecture](./ARCHITECTURE.md#authentication-architecture)
- [Auth Routes](./ROUTING_PAGES.md#authentication-routes)
- [useAuthSession Hook](./STATE_MANAGEMENT.md#useauthsession)
- [Protected Routes](./ROUTING_PAGES.md#route-protection)

### Live Streaming
- [StreamPlayer Component](./COMPONENT_LIBRARY.md#stream-player)
- [useStream Hook](./STATE_MANAGEMENT.md#usestream)
- [Watch Page](./ROUTING_PAGES.md#watch-stream-usernamelive)
- [Go Live Flow](./ROUTING_PAGES.md#streams-creator-dashboardstreams)

### Payments & Coins
- [Payment Store](./STATE_MANAGEMENT.md#payment-store)
- [Payment Components](./COMPONENT_LIBRARY.md#payment-components)
- [Coin Shop Page](./ROUTING_PAGES.md#coin-shop-coinsshop)
- [Gift System](./ROUTING_PAGES.md#gifts)

### Creator Features
- [Creator Dashboard](./ROUTING_PAGES.md#creator-dashboard)
- [Creator Application](./ROUTING_PAGES.md#creator-application-creator-application)
- [Content Upload](./ROUTING_PAGES.md#content-upload-creator-dashboardcontent-upload)
- [Stream Management](./ROUTING_PAGES.md#streams-creator-dashboardstreams)

### UI Components
- [Button](./COMPONENT_LIBRARY.md#button)
- [Dialog](./COMPONENT_LIBRARY.md#dialog)
- [Form](./COMPONENT_LIBRARY.md#form)
- [Card](./COMPONENT_LIBRARY.md#card)
- [All UI Components](./COMPONENT_LIBRARY.md#ui-primitives)

---

## 👤 By Role

### New Developer
1. [START HERE](./00_START_HERE.md)
2. [QUICK_START.md](./QUICK_START.md)
3. [README.md](./README.md)
4. [Project Structure](./README.md#directory-structure)
5. [Common Tasks](./README.md#common-tasks)

### Frontend Developer
1. [Component Library](./COMPONENT_LIBRARY.md)
2. [State Management](./STATE_MANAGEMENT.md)
3. [Routing & Pages](./ROUTING_PAGES.md)
4. [API Integration](./STATE_MANAGEMENT.md#react-query-usage)

### Full-Stack Developer
1. [Architecture](./ARCHITECTURE.md)
2. [API Integration](./ARCHITECTURE.md#api-integration)
3. [Authentication](./ARCHITECTURE.md#authentication-architecture)
4. [Backend API Docs](../backend/API_ENDPOINTS.md)

### DevOps Engineer
1. [Configuration](./CONFIGURATION.md)
2. [Docker Build](./CONFIGURATION.md#docker-deployment)
3. [Nginx Setup](./CONFIGURATION.md#nginx-configuration)
4. [Production Deploy](./CONFIGURATION.md#production-deployment)

---

## 🔍 By Task

### Adding Features

#### Add New Page
1. [Create page component](./ROUTING_PAGES.md)
2. [Add route in App.tsx](./ROUTING_PAGES.md#route-configuration)
3. [Add navigation link](./COMPONENT_LIBRARY.md#ui-primitives)

#### Add New Component
1. [Review component patterns](./COMPONENT_LIBRARY.md)
2. [Create component file](./QUICK_START.md#create-new-component)
3. [Add Tailwind styles](./COMPONENT_LIBRARY.md#styling-guidelines)

#### Add API Endpoint
1. [Create API module](./ARCHITECTURE.md#api-module-pattern)
2. [Add React Query hook](./STATE_MANAGEMENT.md#react-query-usage)
3. [Use in component](./STATE_MANAGEMENT.md#custom-hooks)

#### Add Form
1. [Setup React Hook Form](./COMPONENT_LIBRARY.md#form)
2. [Add Zod validation](./COMPONENT_LIBRARY.md#form)
3. [Handle submission](./STATE_MANAGEMENT.md#react-query-usage)

### Debugging

#### Build Issues
- [Build Errors](./CONFIGURATION.md#troubleshooting)
- [TypeScript Errors](./QUICK_START.md#typescript-errors)
- [Docker Issues](./CONFIGURATION.md#docker-issues)

#### Runtime Issues
- [API Connection](./QUICK_START.md#api-connection-issues)
- [Auth Issues](./ARCHITECTURE.md#authentication-architecture)
- [State Issues](./STATE_MANAGEMENT.md#debugging-tools)

#### Performance Issues
- [Performance Patterns](./ARCHITECTURE.md#performance-patterns)
- [Optimization Guide](./CONFIGURATION.md#performance-optimization)
- [Memoization](./ARCHITECTURE.md#1-memoization)

### Testing

#### Unit Tests
- [Component Testing](./ARCHITECTURE.md#unit-tests)
- [Hook Testing](./ARCHITECTURE.md#integration-tests)

#### Integration Tests
- [API Testing](./ARCHITECTURE.md#integration-tests)
- [E2E Testing](./ARCHITECTURE.md#testing-strategy)

---

## 📦 Component Reference

### UI Components (20+)
| Component | File | Documentation |
|-----------|------|---------------|
| Button | `ui/button.tsx` | [Docs](./COMPONENT_LIBRARY.md#button) |
| Input | `ui/input.tsx` | [Docs](./COMPONENT_LIBRARY.md#input) |
| Dialog | `ui/dialog.tsx` | [Docs](./COMPONENT_LIBRARY.md#dialog) |
| Card | `ui/card.tsx` | [Docs](./COMPONENT_LIBRARY.md#card) |
| Form | `ui/form.tsx` | [Docs](./COMPONENT_LIBRARY.md#form) |
| Dropdown | `ui/dropdown-menu.tsx` | [Docs](./COMPONENT_LIBRARY.md#dropdown-menu) |
| Tabs | `ui/tabs.tsx` | [Docs](./COMPONENT_LIBRARY.md#tabs) |
| Sheet | `ui/sheet.tsx` | [Docs](./COMPONENT_LIBRARY.md#sheet) |
| Alert | `ui/alert.tsx` | [Docs](./COMPONENT_LIBRARY.md#alert) |
| Badge | `ui/badge.tsx` | [Docs](./COMPONENT_LIBRARY.md#badge) |

### Stream Components
| Component | File | Documentation |
|-----------|------|---------------|
| StreamPlayer | `stream/stream-player.tsx` | [Docs](./COMPONENT_LIBRARY.md#stream-player) |
| VideoPlayer | `stream/video-player.tsx` | [Docs](./COMPONENT_LIBRARY.md#video-player) |
| Chat | `stream/chat.tsx` | [Docs](./COMPONENT_LIBRARY.md#chat) |
| StreamerInfoCard | `stream/streamer-info-card.tsx` | [Docs](./COMPONENT_LIBRARY.md#streamer-info-card) |

### Payment Components
| Component | File | Documentation |
|-----------|------|---------------|
| CoinPackageCard | `payment/CoinPackageCard.tsx` | [Docs](./COMPONENT_LIBRARY.md#coin-package-card) |
| CoinBalance | `payment/CoinBalance.tsx` | [Docs](./COMPONENT_LIBRARY.md#coin-balance) |
| DiscountCodeInput | `payment/DiscountCodeInput.tsx` | [Docs](./COMPONENT_LIBRARY.md#discount-code-input) |
| GiftPicker | `payment/GiftPicker.tsx` | [Docs](./COMPONENT_LIBRARY.md#gift-picker) |
| GiftButton | `payment/GiftButton.tsx` | [Docs](./COMPONENT_LIBRARY.md#gift-button) |

---

## 🎣 Hook Reference

### Auth Hooks
| Hook | File | Documentation |
|------|------|---------------|
| useAuthSession | `hooks/useAuthSession.ts` | [Docs](./STATE_MANAGEMENT.md#useauthsession) |
| useCurrentUser | `hooks/useCurrentUser.ts` | [Docs](./STATE_MANAGEMENT.md#usecurrentuser) |

### Feature Hooks
| Hook | File | Documentation |
|------|------|---------------|
| useStream | `hooks/useStream.ts` | [Docs](./STATE_MANAGEMENT.md#usestream) |
| useContent | `hooks/useContent.ts` | [Docs](./STATE_MANAGEMENT.md#usecontent) |
| useSocial | `hooks/useSocial.ts` | [Docs](./STATE_MANAGEMENT.md#usesocial) |
| useCreatorApplication | `hooks/useCreatorApplication.ts` | [Docs](./STATE_MANAGEMENT.md#usecreatorapplication) |

### Utility Hooks
| Hook | File | Documentation |
|------|------|---------------|
| use-mobile | `hooks/use-mobile.ts` | Detect mobile devices |

---

## 🏪 Store Reference

| Store | File | Documentation |
|-------|------|---------------|
| Payment Store | `stores/payment.store.ts` | [Docs](./STATE_MANAGEMENT.md#payment-store) |
| Creator Application Store | `stores/creator-application.ts` | [Docs](./STATE_MANAGEMENT.md#creator-application-store) |

---

## 🗺️ Route Reference

### Public Routes
```
/                           # Homepage
/live                       # Live streams
/search                     # Search
/creators                   # Creator directory
/:username                  # Creator profile
/:username/live             # Watch stream
```

### Auth Routes
```
/auth/login-options         # Login method selection
/auth/signup                # Register
/auth/signin                # Login
/auth/signin-otp            # OTP login
/auth/verify-email          # Email verification
/auth/forgot-password       # Password reset
/auth/reset-password        # Set new password
```

### Protected Routes
```
/creator-application        # Apply to be creator
/following                  # Following feed
/coins/shop                 # Buy coins
/coins/history              # Purchase history
/gifts/sent                 # Sent gifts
/gifts/received             # Received gifts
```

### Creator Routes
```
/creator-dashboard          # Dashboard
/creator-dashboard/overview # Analytics
/creator-dashboard/streams  # Stream management
/creator-dashboard/chat     # Chat moderation
/creator-dashboard/community # Community
/creator-dashboard/content-upload # Upload content
/creator-dashboard/posts    # Posts
```

[Full Route Documentation](./ROUTING_PAGES.md)

---

## 🔧 Configuration Reference

### Environment Variables
```bash
VITE_API_URL               # Backend API URL
VITE_WS_URL                # WebSocket URL
VITE_LIVEKIT_WS_URL        # LiveKit WebSocket
```
[Full Config Docs](./CONFIGURATION.md#environment-variables)

### Build Commands
```bash
bun run dev                # Development server
bun run build              # Production build
bun run preview            # Preview production build
bun run lint               # Run ESLint
tsc --noEmit              # Type check
```
[Full Build Docs](./CONFIGURATION.md#build-process)

### Docker Commands
```bash
docker build -t streamit-frontend .
docker run -p 80:80 streamit-frontend
docker-compose up -d
```
[Full Docker Docs](./CONFIGURATION.md#docker-deployment)

---

## 🐛 Troubleshooting Index

| Issue | Solution | Documentation |
|-------|----------|---------------|
| API errors | Check `VITE_API_URL` | [Quick Start](./QUICK_START.md#api-connection-issues) |
| Build fails | Clear cache, reinstall | [Configuration](./CONFIGURATION.md#troubleshooting) |
| Type errors | Run `tsc --noEmit` | [Quick Start](./QUICK_START.md#typescript-errors) |
| Hot reload not working | Restart dev server | [Quick Start](./QUICK_START.md#common-issues) |
| Port in use | Change port | [Quick Start](./QUICK_START.md#port-already-in-use) |
| Docker issues | Check logs | [Configuration](./CONFIGURATION.md#docker-issues) |
| Auth not working | Check token storage | [Architecture](./ARCHITECTURE.md#authentication-architecture) |

---

## 📚 External Resources

### Official Documentation
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Better Auth](https://better-auth.com/)
- [LiveKit](https://livekit.io/)

### Learning Resources
- [React Patterns](https://patterns.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Web.dev](https://web.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 📝 Document Statistics

| Document | Lines | Size | Content |
|----------|-------|------|---------|
| 00_START_HERE.md | ~180 | 5.2 KB | Navigation & overview |
| QUICK_START.md | ~325 | 9.8 KB | Setup guide |
| README.md | ~585 | 18 KB | Project overview |
| COMPONENT_LIBRARY.md | ~1,110 | 34 KB | All components |
| STATE_MANAGEMENT.md | ~840 | 26 KB | State patterns |
| ROUTING_PAGES.md | ~870 | 27 KB | Routes & pages |
| CONFIGURATION.md | ~780 | 24 KB | Setup & deployment |
| ARCHITECTURE.md | ~950 | 29 KB | Technical design |
| INDEX.md | ~420 | 13 KB | This file |
| **Total** | **~6,060** | **~186 KB** | **Complete docs** |

---

## 🎯 Quick Commands

```bash
# Development
bun run dev                 # Start dev server
bun run build               # Production build
bun run preview             # Preview build

# Docker
docker build -t streamit-frontend .
docker run -p 80:80 streamit-frontend

# Git
git add .
git commit -m "feat: add feature"
git push

# Type check
tsc --noEmit

# Lint
bun run lint
```

---

## 📞 Support

- Documentation: This directory
- Backend API: [Backend Docs](../backend/)
- Issues: Create GitHub issue
- Questions: Check existing docs first

---

**Complete index!** Use this as quick reference guide. 🎯

---

## Navigation

- **[← Back to Start](./00_START_HERE.md)**
- **[View README →](./README.md)**
- **[Backend Docs →](../backend/)**
