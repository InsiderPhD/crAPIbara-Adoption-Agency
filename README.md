# crAPIbara Adoption Agency AKA Gentle Giants

A full-stack application for pet adoption, featuring a React frontend, Node.js RESTful API backend, and a local S3-compatible storage bucket for images. It would be a shame if someone hacked their lovely API.

## Project Structure

```
vibe-capy/
├── client/          # React frontend
├── server/          # Node.js backend (uses SQLite)
├── local-s3/        # Local S3-compatible storage bucket (Express server)
├── docker-compose.yml  # Docker orchestration
├── dev.sh            # Development script
└── README.md
```

## Quick Start with Docker (Recommended)

### Prerequisites

- Docker
- Docker Compose

### 1. Start All Services

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd vibe-capy

# Start all services with Docker
./dev.sh start

# Or use docker-compose directly
docker-compose up --build
```

### 2. Access Your Applications

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Local S3**: http://localhost:4000
- **Health Check**: http://localhost:3001/health

### 3. Development Commands

```bash
# View logs
./dev.sh logs

# Stop services
./dev.sh stop

# Restart services
./dev.sh restart

# Open backend shell
./dev.sh shell

# Open Prisma Studio
./dev.sh db

# Clean everything (removes database)
./dev.sh clean
```
