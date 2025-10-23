#!/bin/bash

# Quantum Settlement Node Deployment Script
# This script deploys the complete QSN infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
NETWORK=${2:-localhost}
VERIFY_CONTRACTS=${3:-false}

echo -e "${BLUE}🚀 Quantum Settlement Node Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Network: ${YELLOW}$NETWORK${NC}"
echo -e "Verify Contracts: ${YELLOW}$VERIFY_CONTRACTS${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed - containerized deployment will not be available"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed - containerized deployment will not be available"
    fi
    
    print_status "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm install
    print_status "Dependencies installed"
}

# Compile contracts
compile_contracts() {
    print_info "Compiling smart contracts..."
    
    npx hardhat compile
    print_status "Smart contracts compiled"
}

# Deploy contracts
deploy_contracts() {
    print_info "Deploying smart contracts to $NETWORK..."
    
    export VERIFY_CONTRACTS=$VERIFY_CONTRACTS
    
    if [ "$NETWORK" = "localhost" ]; then
        # Start local Hardhat node in background
        print_info "Starting local Hardhat node..."
        npx hardhat node &
        HARDHAT_PID=$!
        
        # Wait for node to start
        sleep 5
        
        # Deploy contracts
        npx hardhat run scripts/deploy.ts --network localhost
        
        # Stop Hardhat node
        kill $HARDHAT_PID
    else
        npx hardhat run scripts/deploy.ts --network $NETWORK
    fi
    
    print_status "Smart contracts deployed"
}

# Build application
build_application() {
    print_info "Building application..."
    
    npm run build
    print_status "Application built"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env 2>/dev/null || {
            print_warning "No .env.example found, creating basic .env file..."
            cat > .env << EOF
# Quantum Settlement Node Environment Configuration
NODE_ENV=$ENVIRONMENT
PORT=3000

# Blockchain Configuration
RPC_URL=http://localhost:8545
CHAIN_ID=31337
PRIVATE_KEY=your_private_key_here

# Contract Addresses (will be updated after deployment)
FIAT_TOKEN_ADDRESS=
COMPLIANCE_GATE_ADDRESS=
FEE_ROUTER_ADDRESS=
RESERVE_REGISTRY_ADDRESS=

# Database Configuration
DATABASE_URL=postgresql://qsn:password@localhost:5432/qsn
REDIS_URL=redis://localhost:6379

# External Services
KYC_PROVIDER_API_KEY=
SANCTIONS_API_KEY=
EXTERNAL_ORACLES=

# Monitoring
GRAFANA_PASSWORD=admin
POSTGRES_PASSWORD=qsn_password
EOF
        }
        print_warning "Please update .env file with your configuration"
    fi
    
    print_status "Environment configuration ready"
}

# Start services
start_services() {
    print_info "Starting services..."
    
    if [ "$ENVIRONMENT" = "production" ] && command -v docker-compose &> /dev/null; then
        print_info "Starting production services with Docker Compose..."
        docker-compose up -d
        print_status "Production services started"
    else
        print_info "Starting development services..."
        npm run dev &
        print_status "Development services started"
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    # Test smart contracts
    npx hardhat test
    
    # Test API (if available)
    if [ -f "tests/api.test.ts" ]; then
        npm test
    fi
    
    print_status "Tests completed"
}

# Health check
health_check() {
    print_info "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check API health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "API service is healthy"
    else
        print_warning "API service health check failed"
    fi
    
    # Check blockchain node (if running)
    if curl -f http://localhost:26657/status > /dev/null 2>&1; then
        print_status "Blockchain node is healthy"
    else
        print_warning "Blockchain node health check failed"
    fi
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting Quantum Settlement Node deployment...${NC}"
    
    check_prerequisites
    install_dependencies
    setup_environment
    compile_contracts
    deploy_contracts
    build_application
    
    if [ "$ENVIRONMENT" = "development" ]; then
        run_tests
    fi
    
    start_services
    health_check
    
    echo ""
    echo -e "${GREEN}🎉 Quantum Settlement Node deployment completed!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Update .env file with contract addresses and API keys"
    echo -e "2. Initialize reserve attestations"
    echo -e "3. Configure external oracles"
    echo -e "4. Set up monitoring dashboards"
    echo -e "5. Test the API endpoints"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "• View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "• Stop services: ${YELLOW}docker-compose down${NC}"
    echo -e "• Restart services: ${YELLOW}docker-compose restart${NC}"
    echo -e "• Access API: ${YELLOW}http://localhost:3000${NC}"
    echo -e "• Access Grafana: ${YELLOW}http://localhost:3001${NC}"
    echo -e "• Access Kibana: ${YELLOW}http://localhost:5601${NC}"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
