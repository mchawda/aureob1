# 🚀 QSN iOS App - Xcode Build Instructions

## Quick Start (3 Steps):

### **Step 1: Create New Xcode Project**

1. Open **Xcode**
2. Click **"Create New Project"**
3. Choose **iOS** → **App**
4. Configure:
   - **Product Name**: `QuantumSettlementNode`
   - **Team**: Your Apple Developer Account (or "None" for simulator)
   - **Organization Identifier**: `com.aureo.qsn`
   - **Interface**: **SwiftUI**
   - **Language**: **Swift**
   - **Storage**: None needed
5. Save to: `/Users/manish/Documents/dev/projects/AureoB1/QSNode/QSNiOS/`

---

### **Step 2: Add Swift Files**

Delete the default `ContentView.swift` and add these 4 files:

#### **Files to Add** (Already created in `/QSNiOS/`):
1. ✅ `QSNApp.swift` - App entry point
2. ✅ `Dashboard.swift` - Main glassmorphic UI
3. ✅ `DashboardViewModel.swift` - Data & API integration
4. ✅ `GlassCard.swift` - Glassmorphic component

**How to Add**:
- In Xcode, right-click project → **Add Files to "QuantumSettlementNode"**
- Select all 4 `.swift` files from `/QSNiOS/` folder
- ✅ Check **"Copy items if needed"**
- ✅ Check **"Add to targets: QuantumSettlementNode"**

---

### **Step 3: Build & Run**

1. Select **Simulator**: iPhone 16 Pro (or any iPhone)
2. Click **▶️ Run** (or press `Cmd + R`)
3. Watch the beautiful glassmorphic banking app launch! 🎉

---

## 🎨 What You'll See:

### **Glassmorphic Dashboard Features**:
- ✅ **Blue → Purple → Black gradient background**
- ✅ **Ultra-thin material glass cards** (per spec)
- ✅ **Total Balance card** with action buttons
- ✅ **Weekly Activity chart** (placeholder)
- ✅ **Payment History** with icons
- ✅ **Savings Goals** with progress bars
- ✅ **Apple-esque design** (Calescence-inspired)

---

## 🔗 Connect to Live API (Optional - After Basic Build):

### **Update API Endpoint**:

In `DashboardViewModel.swift`, uncomment the API integration:

```swift
// Change from mock data to real API
let apiURL = "http://localhost:3000/api"

func fetchDashboardData() {
    // Real API call
    URLSession.shared.dataTask(with: URL(string: "\(apiURL)/health")!) { data, response, error in
        // Parse real blockchain data
    }.resume()
}
```

---

## 📱 Alternative: Quick Test (If You Want to See It NOW):

If you want to see the UI immediately without creating a project:

1. Open Xcode
2. **File** → **New** → **Playground**
3. Paste this code:

```swift
import SwiftUI
import PlaygroundSupport

// Paste GlassCard.swift content here
// Paste Dashboard.swift content here
// Paste DashboardViewModel.swift content here

PlaygroundPage.current.setLiveView(Dashboard())
```

This will show a live preview instantly!

---

## 🎯 Expected Build Time:

- **Project Creation**: 30 seconds
- **Adding Files**: 30 seconds
- **First Build**: 1-2 minutes (Swift compilation)
- **Subsequent Builds**: 5-10 seconds

---

## ✅ Success Indicators:

When the app launches, you should see:

1. ✅ **Gradient background** (blue → purple → black)
2. ✅ **"Welcome, Manish"** at the top
3. ✅ **Glass card** with balance: "$123,456.78"
4. ✅ **4 action buttons**: Top Up, Transfer, Request, History
5. ✅ **Payment history** with colorful icons
6. ✅ **Savings goals** with green progress bars

---

## 🚨 Troubleshooting:

### **Issue**: "Cannot find 'Dashboard' in scope"
**Fix**: Make sure `QSNApp.swift` is using the correct view name

### **Issue**: Build errors about missing imports
**Fix**: Ensure all 4 files are added to the target

### **Issue**: Simulator won't launch
**Fix**: Xcode → Preferences → Locations → Command Line Tools (select Xcode version)

---

## 🎉 Next Steps After Build:

1. ✅ **Test the UI** - Scroll, interact, admire the glassmorphism
2. ✅ **Connect to API** - Integrate with http://localhost:3000
3. ✅ **Add real data** - Replace mock data with blockchain queries
4. ✅ **Test transactions** - Mint tokens from the app
5. ✅ **Demo to investors** - Show the complete quantum banking system!

---

## 📊 Full Demo Flow:

Once the iOS app is running:

1. **Show iOS Dashboard** - Beautiful glassmorphic UI ✅
2. **Open Browser** - http://localhost:3000 (Next.js dashboard) ✅
3. **Run Benchmark** - `./benchmark.sh` (prove <1s finality) ✅
4. **Show Contracts** - Real blockchain transactions ✅
5. **Demonstrate RDG** - Quantum-resistant crypto ✅

---

**Ready to build! Just follow the 3 steps above!** 🚀

**Estimated Time to Running App: 3-5 minutes**
