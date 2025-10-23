# Quantum Settlement Node (QSN)

> **Quantum Settlement Node** is the programmable, quantum-secure banking core that connects fiat, stablecoins, and tokenized assets through the QSmart blockchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19+-orange)](https://hardhat.org/)

## 🚀 Overview

The Quantum Settlement Node integrates three core components:

- **QStable** — Fiat-backed stablecoin issuance layer
- **RDG (Reality Distortion Generator)** — World's first quantum-secure crypto wallet
- **QBC (Quantum Blockchain Core)** — Quantum-secure validator infrastructure using PQC (Post-Quantum Cryptography)
- **Glassmorphic Dashboard (SwiftUI)** — Native operational UI inspired by Apple design language

## 🏗️ Architecture

### Core Layers

| Layer | Function | Description |
|-------|-----------|--------------|
| **Quantum Settlement Layer (QSN)** | 24/7 programmable banking core | Mint/redeem, compliance, real-time settlement |
| **QStable Layer** | Tokenized fiat-backed assets | On-chain USDx, EURx, GBPx |
| **RDG Layer** | Proof-of-Reserves + Liquidity Registry | Live balance + Merkle root attestations |
| **QBC Layer** | Quantum-safe blockchain | Validators using Dilithium + Kyber PQC |
| **RegTech API Layer** | Compliance, KYC/AML, jurisdiction routing | Embeds rule enforcement in transaction paths |
| **UI Layer (SwiftUI)** | Operational Glass UI | Regulator & treasury dashboards |

## 📁 Repository Structure

```
qsettlement/
├── contracts/                 # Smart contracts
│   ├── FiatToken.sol         # Main fiat token contract
│   ├── ComplianceGate.sol    # Compliance and KYC enforcement
│   ├── FeeRouter.sol         # Fee calculation and routing
│   └── ReserveRegistry.sol   # Reserve attestation and proof
├── chain/                    # Blockchain configuration
│   ├── config/validators.yaml # Validator configuration
│   └── pqcrypto/            # Post-Quantum Cryptography bindings
├── services/                 # Backend services
│   ├── api/                 # REST API server
│   ├── minting/             # Token minting service
│   ├── oracle/              # Reserve oracle service
│   └── kyc/                 # KYC and compliance engine
├── ui/SwiftUI/              # Native iOS dashboard
│   ├── Dashboard.swift      # Main dashboard view
│   ├── GlassCard.swift      # Glassmorphic UI components
│   ├── ActivityChart.swift  # Data visualization
│   └── ComplianceView.swift # Compliance monitoring
├── tests/                   # Comprehensive test suite
│   ├── contracts/          # Smart contract tests
│   ├── api/                # API endpoint tests
│   └── integration/        # End-to-end integration tests
├── scripts/                 # Deployment and utility scripts
└── docs/                    # Documentation
```

## 🛠️ Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker (optional, for containerized deployment)
- Hardhat (for smart contract development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/aureo-systems/quantum-settlement-node.git
   cd quantum-settlement-node
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Deploy contracts**
   ```bash
   npm run deploy:contracts
   ```

5. **Start the API server**
   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## 🚀 Deployment

### Development Deployment

```bash
# Start local development environment
npm run dev

# Deploy to local Hardhat network
npm run deploy:contracts
```

### Production Deployment

```bash
# Deploy with Docker Compose
npm run docker:compose

# Or use the deployment script
./scripts/deploy.sh production mainnet
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Blockchain Configuration
RPC_URL=https://your-rpc-endpoint.com
CHAIN_ID=1000
PRIVATE_KEY=your_private_key_here

# Contract Addresses
FIAT_TOKEN_ADDRESS=0x...
COMPLIANCE_GATE_ADDRESS=0x...
FEE_ROUTER_ADDRESS=0x...
RESERVE_REGISTRY_ADDRESS=0x...

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/qsn
REDIS_URL=redis://localhost:6379

# External Services
KYC_PROVIDER_API_KEY=your_kyc_api_key
SANCTIONS_API_KEY=your_sanctions_api_key
EXTERNAL_ORACLES=https://oracle1.com,https://oracle2.com

# Monitoring
GRAFANA_PASSWORD=secure_password
POSTGRES_PASSWORD=secure_password
```

## 📊 API Documentation

### Core Endpoints

#### Health Check
```http
GET /health
```

#### Minting
```http
POST /api/v1/mint
Content-Type: application/json

{
  "to": "0x1234567890123456789012345678901234567890",
  "amount": "1000000000000000000000",
  "currency": "USD",
  "offchainRef": "optional-reference"
}
```

#### Burning
```http
POST /api/v1/burn
Content-Type: application/json

{
  "from": "0x1234567890123456789012345678901234567890",
  "amount": "500000000000000000000",
  "currency": "USD",
  "offchainRef": "optional-reference"
}
```

#### Transfer
```http
POST /api/v1/transfer
Content-Type: application/json

{
  "from": "0x1234567890123456789012345678901234567890",
  "to": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  "amount": "100000000000000000000",
  "currency": "USD"
}
```

#### Reserve Status
```http
GET /api/v1/reserves/USD
```

#### Compliance Status
```http
GET /api/v1/compliance/0x1234567890123456789012345678901234567890
```

#### Fee Calculation
```http
POST /api/v1/fees/calculate
Content-Type: application/json

{
  "user": "0x1234567890123456789012345678901234567890",
  "amount": "100000000000000000000",
  "currency": "USD"
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:contracts    # Smart contract tests
npm run test:api         # API tests
npm run test:integration # Integration tests

# Run with coverage
npm run test:coverage
```

### Test Structure

- **Contract Tests**: Unit tests for smart contracts using Hardhat
- **API Tests**: Endpoint testing with Supertest
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load and stress testing

## 🔒 Security Features

### Post-Quantum Cryptography (PQC)

- **Dilithium2**: Digital signatures resistant to quantum attacks
- **Kyber768**: Key encapsulation mechanism for secure communication
- **SPHINCS+**: Hash-based signatures as backup

### Compliance & KYC

- **Real-time KYC verification**
- **Sanctions screening**
- **Risk assessment and scoring**
- **Transaction monitoring**
- **Regulatory reporting**

### Reserve Management

- **Proof-of-Reserves with Merkle trees**
- **Real-time attestation**
- **Multi-oracle verification**
- **Transparent reserve reporting**

## 📱 SwiftUI Dashboard

The native iOS dashboard provides:

- **Glassmorphic design** with Apple-inspired aesthetics
- **Real-time monitoring** of all QSN operations
- **Compliance dashboards** for regulators
- **Treasury management** interfaces
- **Activity visualization** with interactive charts

### Dashboard Features

- Balance overview with multi-currency support
- Transaction history and analytics
- Compliance status monitoring
- Risk assessment visualization
- Reserve health indicators
- Fee calculation tools

## 🔧 Development

### Smart Contract Development

```bash
# Compile contracts
npm run compile:contracts

# Run tests
npm run test:contracts

# Deploy to testnet
npm run deploy:testnet

# Verify contracts
npm run verify:contracts
```

### API Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run API tests
npm run test:api
```

### SwiftUI Development

Open the SwiftUI project in Xcode:

```bash
open ui/SwiftUI/Dashboard.xcodeproj
```

## 📈 Monitoring & Observability

### Metrics

- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Custom dashboards** for QSN-specific metrics

### Logging

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Structured logging** with Winston
- **Real-time log analysis**

### Health Checks

- **API health endpoints**
- **Blockchain node monitoring**
- **Database connectivity checks**
- **External service monitoring**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/aureo-systems/quantum-settlement-node/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aureo-systems/quantum-settlement-node/discussions)

## 🗺️ Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Smart contract deployment
- [x] API service implementation
- [x] Basic compliance features
- [x] SwiftUI dashboard

### Phase 2: Advanced Features 🚧
- [ ] Multi-chain support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Enterprise integrations

### Phase 3: Ecosystem Expansion 📋
- [ ] Third-party integrations
- [ ] Developer SDK
- [ ] Community governance
- [ ] Cross-chain bridges

## 🙏 Acknowledgments

- **QSmart Team** for the quantum-resistant blockchain infrastructure
- **QStable Community** for the stablecoin framework
- **Apple** for the SwiftUI design inspiration
- **Open Source Community** for the foundational tools and libraries

---

**Built with ❤️ by the Aureo Systems team**

*Quantum Settlement Node unifies trust, transparency, and quantum-grade security into a programmable financial core — built for the next generation of banks.*
