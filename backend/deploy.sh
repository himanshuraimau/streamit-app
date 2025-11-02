#!/bin/bash

# StreamIt Backend Deployment Script for AWS EC2
# This script automates the deployment of the backend container

set -e  # Exit on any error

echo "🚀 StreamIt Backend Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="streamit-backend"
IMAGE_NAME="streamit-backend"
PORT=3000

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

# Check if .env.prod file exists (prefer prod, fallback to .env)
if [ -f .env.prod ]; then
    ENV_FILE=".env.prod"
    print_success ".env.prod file found (using production config)"
elif [ -f .env ]; then
    ENV_FILE=".env"
    print_success ".env file found"
else
    print_error "No .env or .env.prod file found!"
    print_info "Please create .env.prod file with required environment variables"
    exit 1
fi

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
print_info "Building Docker image..."
docker build -t $IMAGE_NAME . || {
    print_error "Docker build failed"
    exit 1
}
print_success "Docker image built successfully"

# Run the container
print_info "Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:$PORT \
    --env-file $ENV_FILE \
    $IMAGE_NAME || {
    print_error "Failed to start container"
    exit 1
}
print_success "Container started successfully (using $ENV_FILE)"

# Wait for container to be healthy
print_info "Waiting for container to be ready..."
sleep 10

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    print_success "Container is running"
    
    # Run database migrations
    print_info "Running database migrations..."
    docker exec $CONTAINER_NAME bunx prisma migrate deploy || {
        print_error "Database migration failed"
        print_info "Check logs with: docker logs $CONTAINER_NAME"
        exit 1
    }
    print_success "Database migrations completed"
    
    # Generate Prisma Client (in case schema changed)
    print_info "Generating Prisma Client..."
    docker exec $CONTAINER_NAME bunx prisma generate || {
        print_error "Prisma generate failed"
    }
    print_success "Prisma Client generated"
    
    # Check health endpoint
    print_info "Checking health endpoint..."
    sleep 5
    HEALTH_CHECK=$(curl -s http://localhost:$PORT/health || echo "failed")
    if [[ $HEALTH_CHECK == *"ok"* ]]; then
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
