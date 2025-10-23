#!/bin/bash

#######################################################################################################
#                                                                                                     #
#                    🛑 AUREO QUANTUM SETTLEMENT NODE - STOP SCRIPT                                #
#                                                                                                     #
#  This script stops all running Aureo services                                                     #
#                                                                                                     #
#######################################################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🛑 STOPPING AUREO SERVICES                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

stop_port() {
    local port=$1
    local name=$2
    if lsof -i :$port -t &> /dev/null; then
        echo -e "${YELLOW}Stopping $name (port $port)...${NC}"
        lsof -i :$port -t | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  $name not running on port $port${NC}"
    fi
}

echo "Stopping services..."
echo ""

stop_port 8545 "Hardhat Blockchain"
stop_port 3001 "Backend API"
stop_port 3000 "Next.js Dashboard"
stop_port 4545 "Alternative Dashboard"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All services stopped${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
