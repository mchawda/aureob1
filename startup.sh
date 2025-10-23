#!/bin/bash

#######################################################################################################
#                                                                                                     #
#                    🚀 AUREO QUANTUM SETTLEMENT NODE - STARTUP SCRIPT                             #
#                                                                                                     #
#  This script sets up and starts all required services for the Aureo system:                       #
#  • Hardhat blockchain (Port 8545)                                                                 #
#  • Smart contract deployment                                                                      #
#  • Backend API server (Port 3001)                                                                 #
#  • Next.js web dashboard (Port 3000)                                                              #
#  • iOS app in Xcode (optional)                                                                    #
#                                                                                                     #
#######################################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#######################################################################################################
# PREREQUISITES CHECK
#######################################################################################################

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     🔍 CHECKING PREREQUISITES                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check Xcode (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v xcode-select &> /dev/null || ! xcode-select -p &> /dev/null; then
        echo -e "${RED}❌ Xcode Command Line Tools not installed${NC}"
        echo "   Run: xcode-select --install"
        exit 1
    fi
    echo -e "${GREEN}✅ Xcode Command Line Tools installed${NC}"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git $(git --version | cut -d' ' -f3)${NC}"

echo ""

#######################################################################################################
# CLEANUP
#######################################################################################################

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  🧹 CLEANING UP OLD PROCESSES                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cleanup_port() {
    local port=$1
    if lsof -i :$port -t &> /dev/null; then
        echo -e "${YELLOW}Killing processes on port $port...${NC}"
        lsof -i :$port -t | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

cleanup_port 8545
cleanup_port 3000
cleanup_port 3001
cleanup_port 4545

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

#######################################################################################################
# DEPENDENCIES
#######################################################################################################

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  📦 INSTALLING DEPENDENCIES                                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Install qsettlement dependencies
echo -e "${YELLOW}Installing qsettlement dependencies...${NC}"
cd "$PROJECT_ROOT/QSNode/qsettlement"
npm install --silent

# Install Next.js dependencies
echo -e "${YELLOW}Installing Next.js dependencies...${NC}"
cd "$PROJECT_ROOT/QSNode/qsn-nextjs"
npm install --silent

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

#######################################################################################################
# START SERVICES
#######################################################################################################

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   🚀 STARTING SERVICES                                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start Hardhat node
echo -e "${YELLOW}1️⃣  Starting Hardhat blockchain (port 8545)...${NC}"
cd "$PROJECT_ROOT/QSNode/qsettlement"
npm run node > "$PROJECT_ROOT/.logs/hardhat.log" 2>&1 &
HARDHAT_PID=$!
echo -e "${GREEN}   Process ID: $HARDHAT_PID${NC}"
sleep 5

# Deploy contracts
echo -e "${YELLOW}2️⃣  Deploying smart contracts...${NC}"
cd "$PROJECT_ROOT/QSNode/qsettlement"
npx hardhat run scripts/deploy.ts --network localhost > "$PROJECT_ROOT/.logs/deploy.log" 2>&1
echo -e "${GREEN}   ✅ Contracts deployed${NC}"
sleep 2

# Start Backend API
echo -e "${YELLOW}3️⃣  Starting Backend API server (port 3001)...${NC}"
cd "$PROJECT_ROOT/QSNode/qsettlement"
PORT=3001 npm run dev > "$PROJECT_ROOT/.logs/api-server.log" 2>&1 &
API_PID=$!
echo -e "${GREEN}   Process ID: $API_PID${NC}"
sleep 8

# Start Next.js Dashboard
echo -e "${YELLOW}4️⃣  Starting Next.js web dashboard (port 3000)...${NC}"
cd "$PROJECT_ROOT/QSNode/qsn-nextjs"
npm run dev > "$PROJECT_ROOT/.logs/next-dashboard.log" 2>&1 &
NEXT_PID=$!
echo -e "${GREEN}   Process ID: $NEXT_PID${NC}"
sleep 8

echo ""

#######################################################################################################
# SUMMARY
#######################################################################################################

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   ✅ AUREO SYSTEM STARTED SUCCESSFULLY                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🎯 SERVICE STATUS:${NC}"
echo ""
echo -e "  ${GREEN}✅ Hardhat Blockchain${NC}"
echo -e "     Port: 8545"
echo -e "     PID: $HARDHAT_PID"
echo -e "     Log: tail -f .logs/hardhat.log"
echo ""
echo -e "  ${GREEN}✅ Smart Contracts${NC}"
echo -e "     Status: Deployed"
echo -e "     Log: cat .logs/deploy.log"
echo ""
echo -e "  ${GREEN}✅ Backend API Server${NC}"
echo -e "     Port: 3001"
echo -e "     PID: $API_PID"
echo -e "     URL: http://localhost:3001/api"
echo -e "     Log: tail -f .logs/api-server.log"
echo ""
echo -e "  ${GREEN}✅ Next.js Web Dashboard${NC}"
echo -e "     Port: 3000"
echo -e "     PID: $NEXT_PID"
echo -e "     URL: http://localhost:3000"
echo -e "     Log: tail -f .logs/next-dashboard.log"
echo ""

echo -e "${BLUE}📱 iOS WALLET (Optional):${NC}"
echo -e "   Run in Xcode:"
echo -e "   ${YELLOW}open QSNode/QSNiOS/QuantumSettlementNode/QuantumSettlementNode.xcodeproj${NC}"
echo ""

echo -e "${BLUE}🔗 QUICK LINKS:${NC}"
echo -e "   Web Dashboard:    http://localhost:3000"
echo -e "   API Health:       http://localhost:3000/api/health"
echo -e "   Compliance:       http://localhost:3000/compliance"
echo ""

echo -e "${BLUE}📋 LOGS DIRECTORY:${NC}"
echo -e "   All logs stored in: ${YELLOW}.logs/${NC}"
echo ""

echo -e "${BLUE}🛑 TO STOP SERVICES:${NC}"
echo -e "   Run: ${YELLOW}./stop.sh${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Ready to use! Open http://localhost:3000 in your browser${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Keep script running (optional - remove if you want it to return control)
wait $HARDHAT_PID $API_PID $NEXT_PID
