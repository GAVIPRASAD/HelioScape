#!/bin/bash

# ==========================================
#  HelioScape Environment Setup & Launcher
#  Usage: ./setup.sh
# ==========================================

PROJECT_NAME="helioscape"
ENV_FILE=".env"

# Colors for pretty printing
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   🚀 Setting up ${PROJECT_NAME} Environment${NC}"
echo -e "${BLUE}==========================================${NC}"

# --- 1. Pre-flight Checks ---
echo -e "\n${BLUE}[1/4] Checking Prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed or not in PATH.${NC}"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker Desktop is not running.${NC}"
    echo "   Please start Docker and try again."
    exit 1
fi
echo -e "${GREEN}✅ Docker is running.${NC}"

# --- 2. Secret Generation ---
echo -e "\n${BLUE}[2/4] Configuring Secrets...${NC}"

if [ -f "$ENV_FILE" ]; then
    echo -e "ℹ️  ${ENV_FILE} already exists. Keeping existing secrets."
else
    echo "🔑 Generating secure keys for .env..."
    
    # Generate random hex strings
    if command -v openssl &> /dev/null; then
        MONGO_PASS=$(openssl rand -hex 16)
        JWT_SECRET=$(openssl rand -hex 32)
    else
        # Fallback if openssl not found
        MONGO_PASS="pass_$(date +%s)_$RANDOM"
        JWT_SECRET="jwt_$(date +%s)_$RANDOM"
    fi

    # Create the file
    cat <<EOT >> $ENV_FILE
# Docker Project Config
PROJECT_NAME=${PROJECT_NAME}

# Ports
SERVER_PORT=5000
CLIENT_PORT=5173
VITE_API_URL=http://localhost:5000

# Database Secrets (Auto-Generated)
MONGO_USER=admin
MONGO_PASS=${MONGO_PASS}

# Security Secrets (Auto-Generated)
JWT_SECRET=${JWT_SECRET}

# API Keys (You must fill these manually later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DROPBOX_CLIENT_ID=
EOT
    echo -e "${GREEN}✅ .env file created with secure passwords.${NC}"
fi

# --- 3. Clean Setup (Optional) ---
echo -e "\n${BLUE}[3/4] Cleaning old containers...${NC}"
docker-compose down --remove-orphans > /dev/null 2>&1
echo -e "${GREEN}✅ Environment clean.${NC}"

# --- 4. Launch ---
echo -e "\n${BLUE}[4/4] Building and Starting Application...${NC}"
echo "   - This might take a minute on the first run..."

# 1. Build and start in background first to ensure containers exist
echo -e "   🔨 Building containers..."
docker-compose --env-file $ENV_FILE up -d --build

if [ $? -eq 0 ]; then
    echo -e "\n${BLUE}==========================================${NC}"
    echo -e "${GREEN}✅ Setup Complete! Systems Online.${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo -e "   💻 Client:   ${GREEN}http://localhost:5173${NC}"
    echo -e "   ⚙️  Server:   ${GREEN}http://localhost:5000${NC}"
    echo -e "   🗄️  MongoDB:  ${GREEN}localhost:27017${NC}"
    echo -e "\n   📝 To view logs:  ${BLUE}docker-compose logs -f${NC}"
    echo -e "   🛑 To stop:       ${BLUE}docker-compose down${NC}"
    echo -e "\n${BLUE}👀 Entering Watch Mode...${NC}"
    echo -e "   (Press Ctrl+C to stop watching, containers will keep running)"
    
    # 2. Start Watch Mode
    docker-compose watch
else
    echo -e "\n${RED}❌ Error: Docker Compose failed to start.${NC}"
fi