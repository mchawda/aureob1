# Aureo Quantum Settlement Node

A post-quantum secure financial settlement system featuring:

- **iOS Wallet** (`QSNiOS/`) - SwiftUI native app with glassmorphic design
- **Web Dashboard** (`qsn-nextjs/`) - Next.js real-time monitoring interface
- **Smart Contracts** (`qsettlement/contracts/`) - Solidity FiatToken & ComplianceGate
- **QEVM Adapter** - Quantum-resistant EVM with Dilithium2 & Kyber768
- **PQ Consensus** - Post-quantum cryptography in blockchain validator layer

## Quick Start

### iOS Wallet
```bash
cd QSNode/QSNiOS/QuantumSettlementNode
open QuantumSettlementNode.xcodeproj
```

### Web Dashboard
```bash
cd QSNode/qsn-nextjs
npm install
npm run dev  # http://localhost:4545
```

### Smart Contracts
```bash
cd QSNode/qsettlement
npm install
npx hardhat run scripts/deploy.ts --network localhost
```

## Architecture

```
┌─────────────────────────────────┐
│  Mobile (SwiftUI) & Web (Next)  │
└────────────┬────────────────────┘
             │ JSON-RPC / REST
┌────────────▼────────────────────┐
│   Backend APIs & Services       │
│   (Node.js / Hardhat)           │
└────────────┬────────────────────┘
             │ EVM Compatible
┌────────────▼────────────────────┐
│   Smart Contracts (Solidity)    │
│   Compliance, Vault, Minting    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│  QEVM Quantum Consensus Layer   │
│  (Dilithium2 + Kyber768)        │
└─────────────────────────────────┘
```

## Key Features

✅ Sub-1s Settlement Finality  
✅ 24/7 Programmable Compliance  
✅ Proof-of-Reserves  
✅ Post-Quantum Signatures  
✅ Real-time Monitoring  

## Documentation

- [`TESTNET_DEPLOYMENT_GUIDE.md`](QSNode/TESTNET_DEPLOYMENT_GUIDE.md) - Deploy to testnets
- [`Quantum_Settlement_Node_Developer_Spec_v3.md`](QSNode/Quantum_Settlement_Node_Developer_Spec_v3.md) - Full specification
- [`QEVM Adapter — Technical Blueprint.md`](QSNode/QEVM%20Adapter%20—%20Technical%20Blueprint.md) - PQ implementation details

## Tech Stack

- **Mobile**: SwiftUI (iOS 15+)
- **Web**: Next.js 15 + React 19  
- **Blockchain**: Solidity + Hardhat  
- **Crypto**: Dilithium2, Kyber768 (NIST PQC)  
- **Deployment**: Local, Polygon Mumbai, Sepolia, Arbitrum Goerli

## Status

🟢 **Phase 1 Complete**: PQ Consensus Layer  
🟢 **Phase 2 Complete**: EIP-2718 Type 0x79 Transactions  
🟢 **Phase 3 In Progress**: Precompiles & AA  

---

**For testnet deployment, see [`TESTNET_DEPLOYMENT_GUIDE.md`](QSNode/TESTNET_DEPLOYMENT_GUIDE.md)**
