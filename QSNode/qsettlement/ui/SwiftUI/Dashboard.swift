import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Section
                    headerSection
                    
                    // Balance Overview
                    balanceSection
                    
                    // Quick Actions
                    quickActionsSection
                    
                    // Activity Chart
                    activitySection
                    
                    // Recent Transactions
                    transactionsSection
                    
                    // Compliance Status
                    complianceSection
                }
                .padding()
            }
            .background(
                LinearGradient(
                    colors: [.blue.opacity(0.1), .black.opacity(0.9)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationTitle("Quantum Settlement")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.refreshData()
                    }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .onAppear {
            viewModel.loadData()
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Welcome back")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Quantum Settlement Node")
                        .font(.largeTitle.bold())
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                QuantumGlassCard(glowColor: .green) {
                    VStack {
                        Image(systemName: "checkmark.shield")
                            .font(.title2)
                            .foregroundColor(.green)
                        Text("Secure")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
            
            // Status indicators
            HStack(spacing: 16) {
                StatusIndicator(title: "Network", status: .online, color: .green)
                StatusIndicator(title: "Reserves", status: .healthy, color: .blue)
                StatusIndicator(title: "Compliance", status: .active, color: .purple)
            }
        }
    }
    
    private var balanceSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Current Balance")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Spacer()
                Button(action: {
                    viewModel.showBalanceDetails.toggle()
                }) {
                    Image(systemName: "info.circle")
                        .foregroundColor(.blue)
                }
            }
            
            HStack {
                GlassCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("USDx")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("$\(viewModel.usdBalance, specifier: "%.2f")")
                            .font(.largeTitle.bold())
                            .foregroundColor(.primary)
                        Text("+2.4% from last week")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
                
                GlassCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("EURx")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("€\(viewModel.eurBalance, specifier: "%.2f")")
                            .font(.largeTitle.bold())
                            .foregroundColor(.primary)
                        Text("+1.8% from last week")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
            
            if viewModel.showBalanceDetails {
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Balance Details")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Text("Total Reserves:")
                            Spacer()
                            Text("$\(viewModel.totalReserves, specifier: "%.2f")")
                                .fontWeight(.semibold)
                        }
                        
                        HStack {
                            Text("Backing Ratio:")
                            Spacer()
                            Text("\(viewModel.backingRatio, specifier: "%.1f")%")
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                        }
                        
                        HStack {
                            Text("Last Attestation:")
                            Spacer()
                            Text(viewModel.lastAttestation)
                                .fontWeight(.semibold)
                        }
                    }
                }
            }
        }
    }
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.secondary)
            
            HStack(spacing: 16) {
                QuickActionButton(
                    title: "Mint",
                    icon: "plus.circle",
                    color: .green,
                    action: { viewModel.showMintSheet = true }
                )
                
                QuickActionButton(
                    title: "Burn",
                    icon: "minus.circle",
                    color: .red,
                    action: { viewModel.showBurnSheet = true }
                )
                
                QuickActionButton(
                    title: "Transfer",
                    icon: "arrow.right.circle",
                    color: .blue,
                    action: { viewModel.showTransferSheet = true }
                )
                
                QuickActionButton(
                    title: "Compliance",
                    icon: "shield.checkered",
                    color: .purple,
                    action: { viewModel.showComplianceSheet = true }
                )
            }
        }
    }
    
    private var activitySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Weekly Activity")
                .font(.headline)
                .foregroundColor(.secondary)
            
            QuantumGlassCard(glowColor: .blue) {
                VStack {
                    // Placeholder for chart
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.blue.opacity(0.1))
                        .frame(height: 200)
                        .overlay(
                            VStack {
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .font(.largeTitle)
                                    .foregroundColor(.blue)
                                Text("Activity Chart")
                                    .font(.headline)
                                    .foregroundColor(.blue)
                                Text("Coming Soon")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        )
                    
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Transactions")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("\(viewModel.transactionCount)")
                                .font(.title2.bold())
                                .foregroundColor(.primary)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing) {
                            Text("Volume")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("$\(viewModel.weeklyVolume, specifier: "%.0f")")
                                .font(.title2.bold())
                                .foregroundColor(.primary)
                        }
                    }
                    .padding(.top)
                }
            }
        }
    }
    
    private var transactionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Transactions")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Spacer()
                Button("View All") {
                    viewModel.showAllTransactions = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
            
            GlassCard {
                VStack(spacing: 12) {
                    ForEach(viewModel.recentTransactions) { transaction in
                        TransactionRow(transaction: transaction)
                        if transaction.id != viewModel.recentTransactions.last?.id {
                            Divider()
                                .background(Color.white.opacity(0.2))
                        }
                    }
                }
            }
        }
    }
    
    private var complianceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Compliance Status")
                .font(.headline)
                .foregroundColor(.secondary)
            
            GlassCard {
                VStack(spacing: 12) {
                    ComplianceRow(
                        title: "KYC Verification",
                        status: viewModel.kycStatus,
                        color: viewModel.kycStatus == .verified ? .green : .orange
                    )
                    
                    Divider()
                        .background(Color.white.opacity(0.2))
                    
                    ComplianceRow(
                        title: "Sanctions Check",
                        status: viewModel.sanctionsStatus,
                        color: viewModel.sanctionsStatus == .passed ? .green : .red
                    )
                    
                    Divider()
                        .background(Color.white.opacity(0.2))
                    
                    ComplianceRow(
                        title: "Risk Assessment",
                        status: viewModel.riskStatus,
                        color: viewModel.riskStatus == .low ? .green : viewModel.riskStatus == .medium ? .orange : .red
                    )
                }
            }
        }
    }
}

struct StatusIndicator: View {
    let title: String
    let status: StatusType
    let color: Color
    
    enum StatusType {
        case online, offline, healthy, unhealthy, active, inactive
    }
    
    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(color.opacity(0.3), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct TransactionRow: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.type.rawValue)
                    .font(.headline)
                    .foregroundColor(.primary)
                Text(transaction.timestamp)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(transaction.amount)
                    .font(.headline)
                    .foregroundColor(transaction.type == .mint ? .green : transaction.type == .burn ? .red : .blue)
                Text(transaction.status.rawValue)
                    .font(.caption)
                    .foregroundColor(transaction.status == .completed ? .green : .orange)
            }
        }
    }
}

struct ComplianceRow: View {
    let title: String
    let status: ComplianceStatus
    let color: Color
    
    enum ComplianceStatus {
        case verified, pending, failed, passed, low, medium, high
    }
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Spacer()
            
            HStack(spacing: 8) {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)
                Text(status.rawValue.capitalized)
                    .font(.subheadline)
                    .foregroundColor(color)
            }
        }
    }
}

#Preview {
    DashboardView()
}
