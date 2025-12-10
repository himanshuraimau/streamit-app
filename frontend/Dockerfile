# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and .npmrc
COPY package.json .npmrc ./

# Install all dependencies (dev dependencies needed for build)
RUN npm install

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_LIVEKIT_WS_URL

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_LIVEKIT_WS_URL=${VITE_LIVEKIT_WS_URL}

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
