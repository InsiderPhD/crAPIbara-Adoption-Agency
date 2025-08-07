#!/bin/bash

# Vibe Capy Development Script

set -e

echo "🐾 Vibe Capy Development Environment"
echo "====================================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services (default)"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show logs from all services"
    echo "  build     - Build all services"
    echo "  clean     - Stop and remove all containers and volumes"
    echo "  shell     - Open shell in backend container"
    echo "  db        - Open Prisma Studio"
    echo "  help      - Show this help message"
}

# Function to start services
start_services() {
    echo "🚀 Starting Vibe Capy development environment..."
    docker compose up --build -d
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "📱 Access your applications:"
    echo "   Frontend:  http://localhost:5174"
    echo "   Backend:   http://localhost:3001"
    echo "   S3:        http://localhost:4000"
    echo "   Health:    http://localhost:3001/health"
    echo ""
    echo "📋 View logs: $0 logs"
    echo "🛑 Stop services: $0 stop"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping Vibe Capy development environment..."
    docker compose down
    echo "✅ Services stopped successfully!"
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting Vibe Capy development environment..."
    docker compose down
    docker compose up --build -d
    echo "✅ Services restarted successfully!"
}

# Function to show logs
show_logs() {
    echo "📋 Showing logs (Ctrl+C to exit)..."
    docker compose logs -f
}

# Function to build services
build_services() {
    echo "🔨 Building all services..."
    docker compose build --no-cache
    echo "✅ Services built successfully!"
}

# Function to clean everything
clean_services() {
    echo "🧹 Cleaning up all containers and volumes..."
    docker compose down -v
    echo "✅ Cleanup completed!"
}

# Function to open shell in backend
open_shell() {
    echo "🐚 Opening shell in backend container..."
    docker compose exec backend sh
}

# Function to open Prisma Studio
open_prisma_studio() {
    echo "🗄️  Opening Prisma Studio..."
    docker compose exec backend npx prisma studio
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    build)
        build_services
        ;;
    clean)
        clean_services
        ;;
    shell)
        open_shell
        ;;
    db)
        open_prisma_studio
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac 