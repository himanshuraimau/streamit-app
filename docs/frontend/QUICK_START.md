# Quick Start Guide

Get your StreamIt frontend up and running in minutes.

## Prerequisites

- [Bun](https://bun.sh/) v1.0+ or Node.js 18+
- Backend API running (see backend docs)
- Git

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd frontend
bun install
```

### 2. Environment Setup (1 min)

```bash
# Copy environment template
cp .env.example .env

# Edit .env
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server (30 sec)

```bash
bun run dev
```

Frontend running at `http://localhost:5173`! 🎉

### 4. Test It (1 min)

Open browser to `http://localhost:5173`

You should see:
- Homepage with navigation
- Auth flows working
- API connection to backend

## What Works Out of the Box

✅ **Authentication**
- Sign up / Sign in pages
- OTP verification
- Password reset
- Session management

✅ **Navigation**
- All routes accessible
- Responsive sidebar
- Mobile navigation

✅ **UI Components**
- TailwindCSS styling
- Radix UI components
- Dark theme

✅ **API Integration**
- Better Auth connected
- React Query configured
- API client ready

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── components/           # React components
│   │   ├── auth/            # Auth components
│   │   ├── stream/          # Streaming components
│   │   ├── payment/         # Payment components
│   │   ├── ui/              # UI primitives (Radix)
│   │   └── common/          # Shared components
│   ├── pages/               # Route pages
│   │   ├── auth/           # Auth pages
│   │   ├── creator-dashboard/  # Creator dashboard
│   │   ├── content/        # Content pages
│   │   └── watch/          # Stream viewer
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── lib/                # Utilities & config
│   │   ├── api/           # API client
│   │   ├── auth-client.ts # Better Auth setup
│   │   └── utils.ts       # Helper functions
│   └── types/             # TypeScript types
├── public/                # Static assets
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

## Available Scripts

```bash
# Development
bun run dev              # Start dev server (port 5173)
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Run ESLint

# Type checking
tsc --noEmit            # Check TypeScript errors
```

## Environment Variables

Required in `.env`:

```bash
# Backend API
VITE_API_URL=http://localhost:3000

# Optional: Override defaults
VITE_WS_URL=ws://localhost:3000
```

## Common Issues

### Port Already in Use

```bash
# Find process on port 5173
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 bun run dev
```

### API Connection Issues

```bash
# 1. Verify backend is running
curl http://localhost:3000/health

# 2. Check VITE_API_URL in .env
cat .env

# 3. Check CORS in backend
# Backend should allow http://localhost:5173
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules dist
bun install
bun run build
```

### TypeScript Errors

```bash
# Check for type errors
tsc --noEmit

# Common fix: restart IDE
# VSCode: Cmd/Ctrl + Shift + P → "Reload Window"
```

## Development Workflow

### 1. Create New Page

```bash
# 1. Create page component
touch src/pages/my-page/index.tsx

# 2. Add route in App.tsx
<Route path="/my-page" element={<MyPage />} />

# 3. Add navigation link
<Link to="/my-page">My Page</Link>
```

### 2. Create New Component

```bash
# 1. Create component file
mkdir -p src/components/my-component
touch src/components/my-component/index.tsx

# 2. Export component
export function MyComponent() {
  return <div>My Component</div>;
}

# 3. Use in pages
import { MyComponent } from '@/components/my-component';
```

### 3. Add API Endpoint

```typescript
// src/lib/api/my-api.ts
import { apiClient } from '../api-client';

export const myApi = {
  getData: () => apiClient.get('/my-endpoint'),
  postData: (data: any) => apiClient.post('/my-endpoint', data),
};
```

### 4. Create Custom Hook

```typescript
// src/hooks/useMyFeature.ts
import { useState, useCallback } from 'react';
import { myApi } from '@/lib/api/my-api';

export function useMyFeature() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await myApi.getData();
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchData };
}
```

## Hot Reload

Vite provides instant hot module replacement (HMR):

```typescript
// Changes are reflected immediately
// No need to refresh browser
// React state is preserved
```

## Path Aliases

Use `@/` prefix for imports:

```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@/components/ui/button';

// Configured in vite.config.ts and tsconfig.json
```

## Styling with TailwindCSS

```tsx
// Utility classes
<div className="flex items-center justify-between p-4 bg-gray-900">

// Responsive
<div className="text-sm md:text-base lg:text-lg">

// Dark mode (always enabled)
<div className="bg-gray-900 text-white">

// Custom styles in index.css
```

## Radix UI Components

```tsx
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>Content here</DialogContent>
</Dialog>
```

## Testing in Browser

```bash
# 1. Start backend
cd backend && bun run dev

# 2. Start frontend
cd frontend && bun run dev

# 3. Open browser
http://localhost:5173

# 4. Test flows
- Sign up
- Sign in
- Browse live streams
- Test payment flow
```

## Next Steps

1. **Explore Pages**: [ROUTING_PAGES.md](./ROUTING_PAGES.md)
2. **Learn Components**: [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
3. **Understand State**: [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)
4. **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Useful Resources

- [React 19 Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)

---

**Ready to build!** 🚀

Start developing and refer to detailed docs as needed.
