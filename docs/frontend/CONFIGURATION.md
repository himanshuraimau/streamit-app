# Configuration & Deployment

Complete guide for configuring and deploying StreamIt frontend.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Vite Configuration](#vite-configuration)
3. [Build Process](#build-process)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Environment Variables](#environment-variables)
7. [Performance Optimization](#performance-optimization)

---

## Environment Setup

### Prerequisites

```bash
# Required
- Bun v1.0+ or Node.js 18+
- Git

# Optional
- Docker (for containerized deployment)
- Nginx (for production serving)
```

### Local Development

```bash
# Clone repository
git clone <repo-url>
cd streamit/frontend

# Install dependencies
bun install

# Create environment file
cp .env.example .env

# Start development server
bun run dev
```

Development server runs at `http://localhost:5173`

---

## Environment Variables

### Development (`.env`)

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# Optional: WebSocket URL (defaults to API_URL if not set)
VITE_WS_URL=ws://localhost:3000

# Optional: LiveKit WebSocket URL
VITE_LIVEKIT_WS_URL=wss://livekit.example.com
```

### Production (`.env.production`)

```bash
# Production API
VITE_API_URL=https://api.streamit.com

# WebSocket URL
VITE_WS_URL=wss://api.streamit.com

# LiveKit WebSocket
VITE_LIVEKIT_WS_URL=wss://livekit.streamit.com
```

### Environment Variable Access

All environment variables must be prefixed with `VITE_`:

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;

// Type-safe access (optional)
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_LIVEKIT_WS_URL?: string;
}
```

---

## Vite Configuration

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(), // React Fast Refresh
    tailwindcss(), // TailwindCSS v4
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Development server
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy API requests in development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  
  // Build options
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging
    minify: 'esbuild',
    target: 'es2020',
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          query: ['@tanstack/react-query'],
          livekit: ['@livekit/components-react'],
        },
      },
    },
  },
  
  // Preview server (for production build preview)
  preview: {
    port: 4173,
    host: true,
  },
});
```

### Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage**:
```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@/components/ui/button';
```

---

## Build Process

### Development Build

```bash
# Start dev server with hot reload
bun run dev

# Access at http://localhost:5173
```

**Features**:
- Hot Module Replacement (HMR)
- Fast Refresh for React
- Source maps enabled
- TypeScript type checking
- Instant updates

### Production Build

```bash
# Build for production
bun run build

# Output directory: dist/
```

**Build Output**:
```
dist/
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── vendor-[hash].js     # Vendor chunk
│   ├── ui-[hash].js         # UI components chunk
│   ├── index-[hash].css     # Styles
│   └── ...
├── index.html
└── favicon.ico
```

### Preview Production Build

```bash
# Build first
bun run build

# Preview production build locally
bun run preview

# Access at http://localhost:4173
```

### Build Optimization

**1. Code Splitting**

Vite automatically splits code:
- Vendor libraries (React, etc.)
- UI components (Radix UI)
- Route-based splitting (React.lazy)

**2. Tree Shaking**

Unused code is automatically removed:
```typescript
// Only imports used functions
import { useState } from 'react'; // ✅ Small bundle

// Don't do this
import * as React from 'react'; // ❌ Larger bundle
```

**3. Asset Optimization**

```typescript
// Images
import logo from '@/assets/logo.png'; // Optimized automatically

// SVG as component
import { ReactComponent as Icon } from '@/assets/icon.svg';

// Lazy load images
<img src={thumbnailUrl} loading="lazy" alt="Thumbnail" />
```

---

## Docker Deployment

### Dockerfile

**File**: `Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json .npmrc ./
RUN npm install

# Copy source
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_LIVEKIT_WS_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_LIVEKIT_WS_URL=${VITE_LIVEKIT_WS_URL}

# Build
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Build Docker Image

```bash
# Build with environment variables
docker build \
  --build-arg VITE_API_URL=https://api.streamit.com \
  --build-arg VITE_LIVEKIT_WS_URL=wss://livekit.streamit.com \
  -t streamit-frontend:latest \
  .

# Run container
docker run -d \
  -p 80:80 \
  --name streamit-frontend \
  streamit-frontend:latest

# Check logs
docker logs -f streamit-frontend

# Stop container
docker stop streamit-frontend
```

### Docker Compose

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_LIVEKIT_WS_URL: ${VITE_LIVEKIT_WS_URL}
    ports:
      - "80:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

```bash
# Start with docker-compose
docker-compose up -d

# Stop
docker-compose down
```

---

## Nginx Configuration

**File**: `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets (1 year)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Don't log favicon
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }
}
```

### Custom Nginx Configuration

For HTTPS with Let's Encrypt:

```nginx
server {
    listen 80;
    server_name streamit.com www.streamit.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name streamit.com www.streamit.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/streamit.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/streamit.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /usr/share/nginx/html;
    index index.html;

    # ... (rest of config same as above)
}
```

---

## Production Deployment

### Manual Deployment

```bash
# 1. Build locally
bun run build

# 2. Upload dist/ to server
scp -r dist/* user@server:/var/www/streamit/

# 3. Configure nginx on server
sudo cp nginx.conf /etc/nginx/sites-available/streamit
sudo ln -s /etc/nginx/sites-available/streamit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Automated Deployment (CI/CD)

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: frontend
        run: npm install
      
      - name: Build
        working-directory: frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_LIVEKIT_WS_URL: ${{ secrets.VITE_LIVEKIT_WS_URL }}
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/streamit"
```

### Cloud Deployment

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Production deploy
vercel --prod
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend
netlify deploy

# Production deploy
netlify deploy --prod
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load pages
const CreatorDashboard = lazy(() => import('@/pages/creator-dashboard'));
const WatchStream = lazy(() => import('@/pages/watch'));

<Suspense fallback={<LoadingSpinner />}>
  <CreatorDashboard />
</Suspense>
```

### 2. Bundle Analysis

```bash
# Install bundle analyzer
bun add -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... other plugins
    visualizer({ open: true }),
  ],
});

# Build and analyze
bun run build
```

### 3. Asset Optimization

```typescript
// Optimize images
<img 
  src={imageUrl}
  loading="lazy"
  decoding="async"
  width={300}
  height={200}
/>

// Use WebP format
<picture>
  <source srcSet={imageWebp} type="image/webp" />
  <img src={imageJpg} alt="Fallback" />
</picture>
```

### 4. Caching Strategy

```typescript
// React Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 5. Compression

Nginx gzip enabled in `nginx.conf`:
- JavaScript files
- CSS files
- HTML files
- JSON responses

### 6. HTTP/2

Enable in Nginx:
```nginx
listen 443 ssl http2;
```

Benefits:
- Multiplexing
- Header compression
- Server push

---

## Monitoring & Logging

### Production Monitoring

**Add Sentry** (error tracking):

```bash
bun add @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

**Add Web Vitals**:

```bash
bun add web-vitals
```

```typescript
// src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf node_modules dist
bun install
bun run build

# Type check
tsc --noEmit
```

### Docker Issues

```bash
# Check logs
docker logs streamit-frontend

# Enter container
docker exec -it streamit-frontend sh

# Rebuild without cache
docker build --no-cache -t streamit-frontend .
```

### Nginx Issues

```bash
# Test configuration
nginx -t

# Check logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Reload config
nginx -s reload
```

---

## Security Checklist

- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ CORS properly configured
- ✅ Environment variables not exposed in client
- ✅ Dependencies up to date
- ✅ CSP (Content Security Policy) configured
- ✅ Regular security audits

---

## Next Steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [README.md](./README.md) - Project overview
- [Backend Configuration](../backend/CONFIGURATION.md) - Backend setup

---

**Configuration complete!** Ready for production deployment. 🚀
