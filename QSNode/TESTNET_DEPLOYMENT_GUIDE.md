# Aureo Quantum Settlement Node - Testnet Deployment Guide

**Date**: October 23, 2025  
**Status**: Ready for Deployment  

---

## 🎯 Quick Start (5 Minutes)

### Option 1: **Local Testing** (Fastest)
```bash
cd /Users/manish/Documents/dev/projects/AureoB1/QSNode/qsettlement

# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

✅ Smart contracts deployed locally  
✅ Chain ID: 31337  
✅ RPC: http://127.0.0.1:8545  

---

## 🌐 Testnet Options

### Option 2: **Sepolia (Ethereum Testnet)**
Best for: Testing on real Ethereum infrastructure

```bash
# 1. Get Sepolia ETH from faucet
# Visit: https://sepoliafaucet.com

# 2. Set environment variables
export PRIVATE_KEY="your_private_key_here"
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"

# 3. Update hardhat.config.ts (add sepolia network)
```

**Add to hardhat.config.ts**:
```typescript
sepolia: {
  url: process.env.SEPOLIA_RPC_URL,
  chainId: 11155111,
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  gasPrice: "auto",
},
```

**Deploy**:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

---

### Option 3: **Polygon Mumbai** (Recommended for Speed/Cost)
Best for: Fast testing, low gas costs, EVM-compatible

```bash
# 1. Get Mumbai MATIC from faucet
# Visit: https://faucet.polygon.technology/

# 2. Set environment variables
export PRIVATE_KEY="your_private_key_here"
export MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com"
```

**Add to hardhat.config.ts**:
```typescript
mumbai: {
  url: process.env.MUMBAI_RPC_URL,
  chainId: 80001,
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  gasPrice: "auto",
},
```

**Deploy**:
```bash
npx hardhat run scripts/deploy.ts --network mumbai
```

---

### Option 4: **Arbitrum Goerli** (EVM-Compatible L2)
Best for: Testing Layer 2 scalability

```bash
# 1. Get Goerli ETH from faucet
# Visit: https://goerlifaucet.com

# 2. Set environment variables
export PRIVATE_KEY="your_private_key_here"
export ARBITRUM_GOERLI_RPC="https://goerli-rollup.arbitrum.io/rpc"
```

**Add to hardhat.config.ts**:
```typescript
arbitrumGoerli: {
  url: process.env.ARBITRUM_GOERLI_RPC,
  chainId: 421613,
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  gasPrice: "auto",
},
```

**Deploy**:
```bash
npx hardhat run scripts/deploy.ts --network arbitrumGoerli
```

---

### Option 5: **Your Custom QEVM Testnet A** (Future)
Best for: Post-quantum consensus testing

When QEVM is integrated with QSmart:

```bash
# 1. Start Testnet A node (PQ consensus)
qsettled --chain-id 9357 --pq-consensus dilithium2

# 2. Configure RPC endpoint
export QSMART_RPC_URL="http://localhost:26657"
export QSMART_CHAIN_ID="9357"

# 3. Deploy using existing config
npx hardhat run scripts/deploy.ts --network qsmart
```

---

## 📋 Step-by-Step: Deploy to Mumbai (Recommended)

### Step 1: Setup Wallet
```bash
# Option A: Use existing account
# If you have MetaMask, export private key:
# 1. Open MetaMask
# 2. Account Details → Export Private Key
# 3. Save securely

# Option B: Create new account
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Create .env File
```bash
cd /Users/manish/Documents/dev/projects/AureoB1/QSNode/qsettlement

cat > .env << 'EOF'
# Mumbai Testnet
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
MUMBAI_CHAIN_ID=80001
PRIVATE_KEY=your_private_key_here
VERIFY_CONTRACTS=false

# Etherscan API key (optional, for verification)
ETHERSCAN_API_KEY=your_key_here
EOF
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Deploy
```bash
npx hardhat run scripts/deploy.ts --network mumbai
```

### Step 5: Verify Deployment
```bash
# View contract on Mumbai Scanner
# Visit: https://mumbai.polygonscan.com/
# Paste contract address from step 4 output

# Test mint endpoint
curl -X POST http://localhost:3001/api/mint \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100",
    "toAddress": "0x..."
  }'
```

---

## 🔌 Connect Frontend to Testnet

### Update Next.js Dashboard
**File**: `QSNode/qsn-nextjs/app/api/health/route.ts`

```typescript
// Add testnet RPC endpoint
const TESTNET_RPC = process.env.TESTNET_RPC_URL || "https://rpc-mumbai.maticvigil.com";
const TESTNET_CHAIN_ID = process.env.TESTNET_CHAIN_ID || "80001";

// Use for balance checks, transfers, etc.
const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
```

### Update Contract Addresses
**File**: `.env.local` in `qsn-nextjs/`

```bash
NEXT_PUBLIC_FIAT_TOKEN_ADDRESS=0x...     # From deployment
NEXT_PUBLIC_COMPLIANCE_GATE_ADDRESS=0x... # From deployment
NEXT_PUBLIC_RPC_URL=https://rpc-mumbai.maticvigil.com
NEXT_PUBLIC_CHAIN_ID=80001
```

### Update iOS Wallet
**File**: `QSNode/QSNiOS/QuantumSettlementNode/QuantumSettlementNode/QSNIntegratedViewModel.swift`

```swift
// Update API endpoint
let API_URL = "http://your-deployed-api.com"  // Or ngrok tunnel
let RPC_URL = "https://rpc-mumbai.maticvigil.com"

// Update contract addresses
let FIAT_TOKEN = "0x..."      // From deployment
let COMPLIANCE_GATE = "0x..."  // From deployment
```

---

## 🚀 Full Deployment Stack

### Architecture for Testnet Deployment

```
┌─────────────────────────────────────────────────────┐
│         Frontend (iOS App + Web Dashboard)          │
│  ├─ QSNiOS (localhost or TestFlight)               │
│  └─ qsn-nextjs (npm run dev on port 4545)          │
└──────────────┬──────────────────────────────────────┘
               │ API Calls
┌──────────────▼──────────────────────────────────────┐
│      Backend Services (Node.js/TypeScript)         │
│  ├─ Mint/Burn API                                  │
│  ├─ Balance API                                    │
│  ├─ Compliance Check API                           │
│  ├─ Reserve Oracle                                 │
│  └─ KYC/AML Engine                                 │
└──────────────┬──────────────────────────────────────┘
               │ JSON-RPC
┌──────────────▼──────────────────────────────────────┐
│      Smart Contracts (Mumbai/Sepolia/Local)        │
│  ├─ FiatToken.sol (USDx, EURx, GBPx)              │
│  ├─ ComplianceGate.sol                             │
│  ├─ FeeRouter.sol                                  │
│  └─ ReserveRegistry.sol                            │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Testnet Comparison

| Testnet | Network | Chain ID | Gas Cost | Speed | Use Case |
|---------|---------|----------|----------|-------|----------|
| **Local** | Hardhat | 31337 | Free | Instant | Development |
| **Mumbai** | Polygon | 80001 | Very Low | Fast | Testing, Demo |
| **Sepolia** | Ethereum | 11155111 | Moderate | Moderate | Production-like |
| **Arbitrum Goerli** | Layer 2 | 421613 | Low | Very Fast | Scaling |
| **Testnet A** (Future) | QEVM | 9357 | N/A | Depends | PQ Consensus |

---

## 🔐 Security for Testnet

### Do's ✅
- ✅ Use testnet-only accounts
- ✅ Never expose mainnet private keys
- ✅ Use throwaway wallets for testing
- ✅ Store private keys in `.env` (add to `.gitignore`)
- ✅ Rotate private keys regularly

### Don'ts ❌
- ❌ Don't use mainnet private keys
- ❌ Don't commit `.env` to git
- ❌ Don't share private keys
- ❌ Don't test with real funds
- ❌ Don't use production database on testnet

---

## 📝 Deployment Commands Reference

```bash
# Local testing
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

# Mumbai
npx hardhat run scripts/deploy.ts --network mumbai

# Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Arbitrum Goerli
npx hardhat run scripts/deploy.ts --network arbitrumGoerli

# With contract verification
VERIFY_CONTRACTS=true npx hardhat run scripts/deploy.ts --network mumbai

# Check balance
npx hardhat --network mumbai run -c "console.log(await ethers.provider.getBalance('0x...'))"

# Send test transaction
npx hardhat --network mumbai run scripts/test-transaction.ts
```

---

## 🛠️ Troubleshooting

### Issue: "Invalid RPC URL"
**Solution**: Verify your RPC endpoint is correct and network is reachable
```bash
curl -X POST https://rpc-mumbai.maticvigil.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Issue: "Insufficient Funds"
**Solution**: Get testnet tokens from faucet
- **Mumbai**: https://faucet.polygon.technology/
- **Sepolia**: https://sepoliafaucet.com
- **Arbitrum Goerli**: https://goerlifaucet.com

### Issue: "Contract Already Deployed"
**Solution**: Either:
1. Deploy with different deployer address
2. Redeploy to new testnet
3. Use existing contract address in code

### Issue: "Network Request Failed"
**Solution**: Check internet connection and RPC endpoint status

---

## 📈 Next: Monitoring & Testing

After deployment:

1. **Monitor Contract**:
   ```bash
   npx hardhat run scripts/monitor.ts --network mumbai
   ```

2. **Run Integration Tests**:
   ```bash
   npm run test
   ```

3. **Check Contract Events**:
   ```bash
   npx hardhat run scripts/check-events.ts --network mumbai
   ```

4. **Verify Reserve System**:
   - Check ReserveRegistry data
   - Monitor ComplianceGate approvals
   - Track FeeRouter distributions

---

## 🎯 Recommended Path

### For Quick Testing:
1. **Start Local**: Deploy to local Hardhat node
2. **Move to Mumbai**: Test on Polygon Mumbai testnet
3. **Try Sepolia**: Test on Ethereum Sepolia
4. **Scale to L2**: Test on Arbitrum Goerli

### For Production-Like Testing:
1. Deploy full stack to Mumbai
2. Test all APIs
3. Run load tests
4. Monitor gas usage
5. Verify compliance checks

---

## 📞 Support

For issues or questions:
1. Check Hardhat docs: https://hardhat.org/docs
2. Check network documentation
3. Review contract ABIs in `artifacts/contracts/`
4. Check RPC endpoint status

---

**Status**: Ready to deploy! Choose your testnet and get started. 🚀
