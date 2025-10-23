# 💳 Wallet Transactions → Settlement Speed Updates

## ✅ How It Works

Your settlement speed gauge **automatically updates in real-time** whenever you perform any wallet transaction:
- ✓ Mint tokens
- ✓ Burn tokens  
- ✓ Transfer tokens
- ✓ Any other blockchain transaction

---

## 🔄 The Flow

### 1. **You Make a Wallet Transaction**
```
Wallet → Mint 100 USDx
         ↓
      [Transaction sent to blockchain]
         ↓
      [Hardhat mines block #76]
```

### 2. **Block Gets Mined** 
- A new block is created with your transaction
- Block timestamp recorded by the blockchain

### 3. **Settlement Speed API Detects New Block**
- API polls blockchain every request
- Automatically detects the new block
- Recalculates median finality time

### 4. **Dashboard Updates Automatically**
- Frontend polls every **1 second** (updated from 2s)
- Receives new settlement speed data
- Gauge smoothly animates to new value
- Shows updated block number

---

## 📊 Real-Time Updates: 3-Step Process

```
┌─────────────────────────────────────────────────────┐
│ YOUR WALLET TRANSACTION                             │
│ (Mint, Transfer, Burn, etc.)                        │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ BACKEND: /api/metrics/settlement-speed              │
│ • Detects new block                                 │
│ • Recalculates median finality                      │
│ • Returns fresh metrics                             │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ FRONTEND: Dashboard Polling (Every 1 second)        │
│ • Fetches latest settlement speed                   │
│ • Updates gauge with new value                      │
│ • Shows updated block number                        │
│ • Smooth CSS transitions                            │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

### Automatic Detection
- **No manual refresh needed** - updates happen automatically
- **No special configuration** - works out of the box
- **Any transaction triggers updates** - deposits, transfers, burns all count

### Speed of Updates
- **1 second polling interval** - dashboard checks for updates frequently
- **Immediate block detection** - API detects new blocks instantly
- **Smooth animations** - value transitions elegantly (300ms CSS transition)

### Reliability
- **Fallback handling** - if API fails, uses previous value
- **Persistent state** - maintains 50-block history
- **Error recovery** - continues working even if RPC has issues

---

## 🎯 Practical Examples

### Example 1: Mint Transaction

```bash
# 1. You mint tokens via wallet/API
curl -X POST http://localhost:3000/api/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","amount":"100","currency":"USD"}'

# Returns: Block #76 mined, transaction confirmed

# 2. Settlement speed automatically updates
#    - Dashboard polls every 1 second
#    - Sees new block #76
#    - Recalculates settlement speed
#    - Gauge updates on screen

# 3. You see: "Block #76" displayed, speed metric updated
```

### Example 2: Manual Transfer

```bash
# 1. From your wallet, transfer tokens to someone

# 2. Hardhat mines the block automatically

# 3. Settlement speed updates in real-time
#    - API detects the new block
#    - Recalculates median finality
#    - Dashboard polls and shows new value
```

### Example 3: Continuous Transfers

```bash
# Generate 10 blocks quickly
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/test-mining \
    -H "Content-Type: application/json" \
    -d '{"count": 2}' &
done
wait

# Watch settlement speed in real-time:
#   Block #77 → updates
#   Block #78 → updates
#   Block #79 → updates  ← You'll see the gauge moving!
#   ...etc
```

---

## 🔧 Configuration

### Polling Frequency
Currently set to **1 second** in `app/page.tsx`:

```typescript
const interval = setInterval(() => {
  fetchData();
  fetchSettlementSpeed();
}, 1000);  // ← 1 second (was 2 seconds)
```

**To adjust**, change the interval value:
- **500ms**: Very aggressive, high server load
- **1000ms**: Default, balanced (RECOMMENDED)
- **2000ms**: Slower, less frequent updates
- **5000ms**: Very slow, minimal server load

---

## 📈 What Gets Tracked

Each wallet transaction creates a block that gets tracked:

| Metric | What It Tracks |
|--------|---|
| **Settlement Speed** | Median time between blocks created by your transactions |
| **Block Number** | Current block on the blockchain |
| **Sampled Blocks** | Number of blocks analyzed (up to 50) |
| **Block Times** | Individual time differences between blocks |
| **Transactions** | Count of transactions per block |

---

## ⚙️ Behind the Scenes

### In `/api/metrics/settlement-speed`

```typescript
// Tracks every new block you create
for (let i = lastProcessedBlock + 1; i <= currentBlockNumber; i++) {
  blockData = await provider.getBlock(i);
  blockHistory.push({
    blockNumber: i,
    timestamp: blockData.timestamp,  // When block was mined
    txCount: blockData.transactions.length  // How many txs
  });
}

// Calculates median finality
blockTimes.sort((a, b) => a - b);
median = blockTimes[Math.floor(blockTimes.length / 2)];
settlementSpeed = median;  // Returns to dashboard
```

---

## 🎬 Live Demo

1. **Open dashboard**: http://localhost:3000
2. **Watch settlement speed**: Observe the gauge
3. **Mint tokens**:
   ```bash
   curl -X POST http://localhost:3000/api/mint \
     -H "Content-Type: application/json" \
     -d '{"to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","amount":"50","currency":"USD"}'
   ```
4. **Watch gauge update**: Within 1 second, you'll see:
   - Block number increases
   - Settlement speed metric updates
   - Progress circle animates smoothly

---

## 🛠️ Troubleshooting

### Settlement Speed Not Updating?

**Check 1**: Is the transaction actually being mined?
```bash
# Check if new block was created
curl http://localhost:3000/api/metrics/settlement-speed | jq '.blockNumber'

# Run again after 1 second
# Number should increase if transaction succeeded
```

**Check 2**: Is the dashboard polling working?
```bash
# Open browser console (F12)
# You should see API calls every 1 second
# Look for: /api/health and /api/metrics/settlement-speed
```

**Check 3**: Is the Hardhat node running?
```bash
# Verify port 8545 is responding
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x4d"} (or similar)
```

### Updates Too Slow?

If you're seeing delays > 2 seconds:

**Solution 1**: Increase polling frequency
- Change interval in `app/page.tsx` from 1000 to 500ms
- Re-run `npm run dev`

**Solution 2**: Check network latency
- Test API response time: `time curl http://localhost:3000/api/metrics/settlement-speed`
- Should be < 100ms

---

## 💡 Advanced Features

### Monitor in Real-Time
```bash
watch -n 1 'curl -s http://localhost:3000/api/metrics/settlement-speed | jq "{block: .blockNumber, speed: .settlementSpeed, samples: .sampledBlocks}"'
```

### Get Notifications on Block Mine
```bash
# Terminal script that alerts on new blocks
while true; do
  BLOCK=$(curl -s http://localhost:3000/api/metrics/settlement-speed | jq '.blockNumber')
  echo "Current block: $BLOCK"
  sleep 1
done
```

### Track Settlement Speed Over Time
```bash
# Log settlement speed to file for analysis
for i in {1..60}; do
  curl -s http://localhost:3000/api/metrics/settlement-speed | jq '.settlementSpeed' >> speeds.log
  sleep 1
done
```

---

## 🎉 Summary

Your settlement speed gauge is a **live, real-time monitor** of wallet transaction finality:

✅ **Automatic** - Updates without manual action  
✅ **Real-time** - Responds within 1-2 seconds of any transaction  
✅ **Reliable** - Works with all wallet transaction types  
✅ **Beautiful** - Smooth animations and visual feedback  

**Just make wallet transactions and watch the gauge update automatically!** 🚀

---

## 📝 Implementation Files

- `app/page.tsx` - Dashboard polling (1 second interval)
- `app/api/metrics/settlement-speed/route.ts` - Block tracking & speed calculation
- `app/api/mint/route.ts` - Wallet minting (triggers block)
- `app/api/burn/route.ts` - Wallet burning (triggers block)
- `app/api/test-mining/route.ts` - Test transactions (for demo)

All working together to give you instant feedback on settlement speed! ⚡
