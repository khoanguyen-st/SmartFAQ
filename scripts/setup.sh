#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up SmartFAQ project...${NC}\n"

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ Yarn is not installed!${NC}\n"
    echo -e "${YELLOW}Please install Yarn first:${NC}"
    echo -e "  Option 1 (via npm):  npm install -g yarn"
    echo -e "  Option 2 (via corepack): corepack enable\n"
    exit 1
fi

echo -e "${GREEN}✓ Yarn is installed${NC}"

# Get Yarn version
YARN_VERSION=$(yarn --version)
echo -e "${GREEN}  Version: ${YARN_VERSION}${NC}\n"

# Remove node_modules and lock files from npm/pnpm if they exist
if [ -f "package-lock.json" ]; then
    echo -e "${YELLOW}⚠️  Found package-lock.json, removing...${NC}"
    rm -f package-lock.json
fi

if [ -f "pnpm-lock.yaml" ]; then
    echo -e "${YELLOW}⚠️  Found pnpm-lock.yaml, removing...${NC}"
    rm -f pnpm-lock.yaml
fi

# Install dependencies with Yarn
echo -e "${GREEN}📦 Installing dependencies with Yarn...${NC}\n"
yarn install

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Setup complete!${NC}\n"
    echo -e "${GREEN}You can now run:${NC}"
    echo -e "  ${YELLOW}yarn dev:admin${NC}   - Start admin dashboard"
    echo -e "  ${YELLOW}yarn dev:student${NC} - Start student chat"
    echo -e "  ${YELLOW}yarn build${NC}       - Build all projects\n"
else
    echo -e "\n${RED}❌ Installation failed!${NC}"
    exit 1
fi
