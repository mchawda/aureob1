# 🚀 Aureo Quantum Settlement Node - Startup Guide

Complete guide to start and manage the Aureo system.

---

## Quick Start (One Command)

```bash
cd /Users/manish/Documents/dev/projects/AureoB1
./startup.sh
```

That's it! The script will:
- ✅ Check all prerequisites (Node.js, npm, Git, Xcode)
- ✅ Clean up old processes
- ✅ Install dependencies
- ✅ Start Hardhat blockchain
- ✅ Deploy smart contracts
- ✅ Start Backend API (port 3001)
- ✅ Start Next.js Dashboard (port 3000)

---

## Prerequisites

The startup script automatically checks for:

### Required:
- **Node.js** (v18+) - [Install here](https://nodejs.org/)
- **npm** (v8+) - Comes with Node.js
- **Git** - [Install here](https://git-scm.com/)

### macOS Specific:
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```

---

## Services Started

### 1. **Hardhat Blockchain** (Port 8545)
```
Status: Running
URL: http://localhost:8545
Log: tail -f .logs/hardhat.log
```

### 2. **Smart Contracts**
```
Status: Deployed
Network: Localhost (Chain ID 31337)
Contracts:
  • USDx Token: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
  • ComplianceGate: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  • FeeRouter: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  • ReserveRegistry: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 3. **Backend API Server** (Port 3001)
```
Status: Running
URL: http://localhost:3001/api
Log: tail -f .logs/api-server.log
Endpoints:
  • GET /health
  • GET /balance/:address
  • POST /mint
  • POST /burn
  • GET /transactions
```

### 4. **Next.js Web Dashboard** (Port 3000)
```
Status: Running
URL: http://localhost:3000
Log: tail -f .logs/next-dashboard.log
Features:
  • Live metrics
  • Compliance dashboard
  • Real-time balance
  • Settlement speed visualization
```

---

## iOS Wallet Setup (Optional)

After starting the services, open the iOS wallet:

```bash
open QSNode/QSNiOS/QuantumSettlementNode/QuantumSettlementNode.xcodeproj
```

Then in Xcode:
1. Select simulator or device
2. Press **Cmd+R** to build and run

**Note:** The wallet connects to the Backend API on port 3001.

---

## Quick Access Links

After startup, visit:

| Service | URL |
|---------|-----|
| Web Dashboard | http://localhost:3000 |
| Compliance Dashboard | http://localhost:3000/compliance |
| API Health | http://localhost:3000/api/health |
| API Directly | http://localhost:3001/health |

---

## View Logs

All logs are stored in `.logs/` directory:

```bash
# Hardhat blockchain
tail -f .logs/hardhat.log

# Smart contract deployment
cat .logs/deploy.log

# Backend API
tail -f .logs/api-server.log

# Next.js Dashboard
tail -f .logs/next-dashboard.log
```

---

## Stop Services

To stop all running services:

```bash
./stop.sh
```

Or manually:
```bash
# Stop all processes on ports
lsof -i :8545 -t | xargs kill -9
lsof -i :3001 -t | xargs kill -9
lsof -i :3000 -t | xargs kill -9
```

---

## Restart Services

To restart without full setup:

```bash
# Stop everything
./stop.sh

# Wait a moment
sleep 2

# Start everything
./startup.sh
```

---

## Troubleshooting

### Error: "Port X already in use"
```bash
# Kill processes on specific port
lsof -i :PORT_NUMBER -t | xargs kill -9
```

### Error: "npm command not found"
Install Node.js from https://nodejs.org/

### Error: "Xcode Command Line Tools not installed"
```bash
xcode-select --install
```

### Services not responding
Check logs:
```bash
tail -f .logs/*.log
```

### API not connecting from iOS wallet
Make sure:
1. Backend API is running: `http://localhost:3001`
2. Check API health: `curl http://localhost:3001/health`
3. For real device, use your Mac's IP instead of localhost

---

## File Structure

```
AureoB1/
├── startup.sh              # Main startup script ✨
├── stop.sh                 # Stop services script
├── STARTUP_GUIDE.md        # This file
├── .logs/                  # Log files (auto-created)
│   ├── hardhat.log
│   ├── deploy.log
│   ├── api-server.log
│   └── next-dashboard.log
└── QSNode/
    ├── qsettlement/        # Smart contracts & backend
    ├── qsn-nextjs/         # Web dashboard
    └── QSNiOS/             # iOS wallet
```

---

## Performance Tips

- **First run:** May take 2-3 minutes for dependencies
- **Subsequent runs:** Usually start in 15-20 seconds
- **Rebuild contracts:** Just restart the script
- **Watch logs:** Keep a terminal open for logs

---

## What's Next?

1. ✅ Run `./startup.sh`
2. ✅ Open http://localhost:3000 in browser
3. ✅ Explore the dashboard
4. ✅ (Optional) Open iOS wallet in Xcode
5. ✅ Test transactions

---

## Support

For issues or questions:
- Check `.logs/` directory for errors
- Review README.md for architecture
- Check individual service logs

Enjoy! 🎉

---

**Last Updated:** October 23, 2025
**Status:** Production Ready ✅
