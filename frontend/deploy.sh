#!/bin/bash

# StreamIt Frontend Deployment Script for AWS EC2
# This script automates the deployment of the frontend container

set -e  # Exit on any error

echo "🚀 StreamIt Frontend Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="streamit-frontend"
IMAGE_NAME="streamit-frontend"
PORT=5173

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check for required environment variables
if [ -z "$VITE_API_URL" ]; then
    print_error "VITE_API_URL environment variable is required"
    echo ""
    echo "For production, use:"
    echo "  export VITE_API_URL=https://voltstreambackend.space"
    echo ""
    echo "For development, use:"
    echo "  export VITE_API_URL=http://your-backend-ip:3000"
    exit 1
fi

if [ -z "$VITE_LIVEKIT_WS_URL" ]; then
    print_error "VITE_LIVEKIT_WS_URL environment variable is required"
    echo "Example: export VITE_LIVEKIT_WS_URL=wss://your-livekit.livekit.cloud"
    exit 1
fi

print_success "Environment variables validated"
print_info "VITE_API_URL: $VITE_API_URL"
print_info "VITE_LIVEKIT_WS_URL: $VITE_LIVEKIT_WS_URL"

# Stop and remove existing container if it exists
print_info "Checking for existing container..."
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    print_info "Stopping existing container..."
    docker stop $CONTAINER_NAME || true
    print_info "Removing existing container..."
    docker rm $CONTAINER_NAME || true
    print_success "Existing container removed"
fi

# Build the Docker image
print_info "Building Docker image with build args..."
docker build \
    --build-arg VITE_API_URL=$VITE_API_URL \
    --build-arg VITE_LIVEKIT_WS_URL=$VITE_LIVEKIT_WS_URL \
    -t $IMAGE_NAME . || {
    print_error "Docker build failed"
    exit 1
}
print_success "Docker image built successfully"

# Run the container
print_info "Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:80 \
    $IMAGE_NAME || {
    print_error "Failed to start container"
    exit 1
}
print_success "Container started successfully"

# Wait for container to be healthy
print_info "Waiting for container to be ready..."
sleep 5

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    print_success "Container is running"
    
    # Check health endpoint
    print_info "Checking health endpoint..."
    sleep 3
    HEALTH_CHECK=$(curl -s http://localhost:$PORT/health || echo "failed")
    if [[ $HEALTH_CHECK == *"healthy"* ]]; then
        print_success "Health check passed!"
    else
        print_error "Health check failed"
        print_info "Check logs with: docker logs $CONTAINER_NAME"
    fi
    
    echo ""
    echo "======================================"
    print_success "Deployment completed successfully!"
    echo "======================================"
    echo ""
    echo "Container name: $CONTAINER_NAME"
    echo "Container status: $(docker ps -f name=$CONTAINER_NAME --format '{{.Status}}')"
    echo "Port: $PORT"
    echo "API URL: $VITE_API_URL"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker logs -f $CONTAINER_NAME"
    echo "  - Stop: docker stop $CONTAINER_NAME"
    echo "  - Start: docker start $CONTAINER_NAME"
    echo "  - Restart: docker restart $CONTAINER_NAME"
    echo "  - Remove: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
    echo ""
else
    print_error "Container failed to start"
    print_info "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi
