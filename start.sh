#!/bin/bash
# Quick Start Script for LinkLazarus

echo "🚀 Starting LinkLazarus..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "📦 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "✅ LinkLazarus is running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo "💾 PostgreSQL: localhost:5432"
echo "⚡ Redis: localhost:6379"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"