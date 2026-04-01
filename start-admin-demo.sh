#!/bin/bash

# StreamIt Admin Dashboard - Quick Start Script
# This script starts both backend and frontend for admin dashboard demo

echo "🚀 Starting StreamIt Admin Dashboard..."
echo ""

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "admin-fe" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Start backend in background
echo "📦 Starting backend server..."
cd backend
bun run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend might still be starting..."
fi

# Start frontend
echo "🎨 Starting admin frontend..."
cd admin-fe
bun run dev

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

wait
