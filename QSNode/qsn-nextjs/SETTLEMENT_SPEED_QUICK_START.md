# ⚡ Settlement Speed - Quick Start Guide

## 🎯 What You Need to Know

Your **settlement speed gauge automatically updates** when you:
- ✅ Mint tokens
- ✅ Transfer tokens
- ✅ Burn tokens
- ✅ Make ANY wallet transaction

**No configuration needed** - it just works! 🚀

---

## 🚀 Quick Start (60 seconds)

### 1. Open Dashboard
```
http://localhost:3000
```

### 2. Look for Settlement Speed Card
Located on the main dashboard:
- Shows gauge with current speed
- Displays block number
- Updates automatically

### 3. Make a Transaction
Mint tokens (or send any transaction):
```bash
curl -X POST http://localhost:3000/api/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","amount":"100","currency":"USD"}'
```

### 4. Watch It Update
- Within **1 second**, the gauge updates
- Block number increases
- Settlement speed metric changes
- Progress circle animates smoothly

**That's it!** 🎉

---

## 📊 What's Happening Behind the Scenes

```
Your Wallet Transaction
        ↓
  Block Gets Mined (#76)
        ↓
  Settlement Speed API Detects Block
        ↓
  Dashboard Polls Every 1 Second
        ↓
  Gauge Updates on Screen
```

---

## 💡 Key Points

| Feature | Details |
|---------|---------|
| **Update Speed** | 1-2 seconds from transaction to gauge update |
| **Works With** | Mint, Transfer, Burn, all blockchain operations |
| **No Setup** | Automatic, no configuration needed |
| **Polling Rate** | Dashboard checks every 1 second |
| **Data Source** | Real blockchain block timestamps |
| **Visual Feedback** | Smooth animations, color-coded status |

---

## 🛠️ Test It Quickly

### Generate Multiple Blocks
```bash
# Create 5 test transactions
curl -X POST http://localhost:3000/api/test-mining \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

### Monitor Real-Time Updates
```bash
# Watch speed update every second
watch -n 1 'curl -s http://localhost:3000/api/metrics/settlement-speed | jq "{block: .blockNumber, speed: .settlementSpeed}"'
```

---

## ❓ FAQ

**Q: Why doesn't it update instantly?**
A: Dashboard polls every 1 second. So worst-case is 1 second delay from transaction to gauge update.

**Q: Can I make it faster?**
A: Yes! Edit `app/page.tsx` and change `1000` to `500` (500ms polling).

**Q: Does it work with real MetaMask wallet?**
A: Yes! Any transaction that creates a block will trigger updates.

**Q: What if I transfer tokens between wallets?**
A: The gauge updates automatically - works with all transaction types.

**Q: How far back does it track?**
A: Tracks the last 50 blocks for accurate median calculation.

---

## 📈 Understanding the Gauge

### Progress Circle
- **Size/Fill**: Shows settlement speed visually
- **Green**: < 1 second (excellent)
- **Yellow**: > 1 second (good)

### Center Display
- **Large Number**: Median settlement speed in seconds
- **Block #**: Current block number
- **Sample Count**: How many blocks analyzed

### Status Text
- **Green "✓ <1s"**: Fast finality
- **Yellow "✓ 1.2s"**: Moderate finality

---

## 🔗 Related Documentation

For deeper understanding, see:
- `SETTLEMENT_SPEED_GUIDE.md` - Comprehensive guide
- `WALLET_TO_SETTLEMENT_SPEED.md` - How wallet → gauge updates work
- `SETTLEMENT_SPEED_REAL.md` - Technical implementation details

---

## ✨ Summary

**Settlement Speed = Real-time monitor of your blockchain finality**

When you:
- Send a transaction
- Block gets mined
- Settlement speed updates automatically
- You see results instantly on dashboard

**Everything is automatic - just transact and watch!** ⚡

---

## 🆘 Troubleshooting

### Gauge Not Updating?
1. Open browser console (F12)
2. Check for API errors
3. Verify Hardhat node is running on port 8545
4. Check dashboard polling is working (should see API calls)

### Updates Too Slow?
- Increase polling frequency (edit `app/page.tsx`)
- Check network latency with: `curl -w "@curl-format.txt" http://localhost:3000/api/metrics/settlement-speed`

### Wrong Values?
- Settlement speed based on REAL blockchain blocks
- Check block timestamps: `curl http://localhost:3000/api/metrics/settlement-speed | jq '.blockTimes'`

---

**Start transacting and watch your settlement speed update in real-time!** 🚀
