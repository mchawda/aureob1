import SwiftUI

struct ComplianceView: View {
    @StateObject private var viewModel = ComplianceViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                headerSection
                
                // Tab selector
                tabSelector
                
                // Content based on selected tab
                TabView(selection: $selectedTab) {
                    kycView
                        .tag(0)
                    sanctionsView
                        .tag(1)
                    riskAssessmentView
                        .tag(2)
                    limitsView
                        .tag(3)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [.blue.opacity(0.1), .black.opacity(0.9)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationTitle("Compliance Center")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.refreshComplianceData()
                    }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .onAppear {
            viewModel.loadComplianceData()
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Compliance Status")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Real-time Monitoring")
                        .font(.largeTitle.bold())
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                QuantumGlassCard(glowColor: viewModel.overallStatus.color) {
                    VStack {
                        Image(systemName: viewModel.overallStatus.icon)
                            .font(.title2)
                            .foregroundColor(viewModel.overallStatus.color)
                        Text(viewModel.overallStatus.text)
                            .font(.caption)
                            .foregroundColor(viewModel.overallStatus.color)
                    }
                }
            }
            
            // Quick stats
            HStack(spacing: 16) {
                ComplianceStatCard(
                    title: "Verified Users",
                    value: "\(viewModel.verifiedUsers)",
                    color: .green
                )
                ComplianceStatCard(
                    title: "Pending Reviews",
                    value: "\(viewModel.pendingReviews)",
                    color: .orange
                )
                ComplianceStatCard(
                    title: "Risk Alerts",
                    value: "\(viewModel.riskAlerts)",
                    color: .red
                )
            }
        }
    }
    
    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(0..<4) { index in
                Button(action: {
                    withAnimation(.spring()) {
                        selectedTab = index
                    }
                }) {
                    Text(tabTitles[index])
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(selectedTab == index ? .blue : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(selectedTab == index ? Color.blue.opacity(0.2) : Color.clear)
                        )
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        )
    }
    
    private var kycView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // KYC Overview
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("KYC Verification")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Overall Status")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text(viewModel.kycStatus.text)
                                    .font(.title2.bold())
                                    .foregroundColor(viewModel.kycStatus.color)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("Last Updated")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text(viewModel.lastKYCUpdate)
                                    .font(.subheadline.bold())
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        // KYC Levels
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Verification Levels")
                                .font(.subheadline.bold())
                                .foregroundColor(.secondary)
                            
                            ForEach(viewModel.kycLevels, id: \.level) { kycLevel in
                                KYCLevelRow(kycLevel: kycLevel)
                            }
                        }
                    }
                }
                
                // Recent KYC Activities
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Recent Activities")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        ForEach(viewModel.recentKYCActivities) { activity in
                            KYCActivityRow(activity: activity)
                            if activity.id != viewModel.recentKYCActivities.last?.id {
                                Divider()
                                    .background(Color.white.opacity(0.2))
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var sanctionsView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Sanctions Overview
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Sanctions Screening")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Status")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text(viewModel.sanctionsStatus.text)
                                    .font(.title2.bold())
                                    .foregroundColor(viewModel.sanctionsStatus.color)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("Last Check")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text(viewModel.lastSanctionsCheck)
                                    .font(.subheadline.bold())
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        // Sanctions Statistics
                        HStack(spacing: 20) {
                            SanctionsStatItem(
                                title: "Total Checks",
                                value: "\(viewModel.totalSanctionsChecks)",
                                color: .blue
                            )
                            SanctionsStatItem(
                                title: "Matches Found",
                                value: "\(viewModel.sanctionsMatches)",
                                color: .red
                            )
                            SanctionsStatItem(
                                title: "Success Rate",
                                value: "\(viewModel.sanctionsSuccessRate)%",
                                color: .green
                            )
                        }
                    }
                }
                
                // Sanctions Alerts
                if !viewModel.sanctionsAlerts.isEmpty {
                    GlassCard {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Active Alerts")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            
                            ForEach(viewModel.sanctionsAlerts) { alert in
                                SanctionsAlertRow(alert: alert)
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var riskAssessmentView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Risk Overview
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Risk Assessment")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Overall Risk")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text(viewModel.overallRisk.text)
                                    .font(.title2.bold())
                                    .foregroundColor(viewModel.overallRisk.color)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("Risk Score")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text("\(viewModel.riskScore)")
                                    .font(.title2.bold())
                                    .foregroundColor(viewModel.overallRisk.color)
                            }
                        }
                        
                        // Risk Factors
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Risk Factors")
                                .font(.subheadline.bold())
                                .foregroundColor(.secondary)
                            
                            ForEach(viewModel.riskFactors, id: \.factor) { riskFactor in
                                RiskFactorRow(riskFactor: riskFactor)
                            }
                        }
                    }
                }
                
                // Risk Trends
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Risk Trends")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        // Placeholder for risk trend chart
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.blue.opacity(0.1))
                            .frame(height: 200)
                            .overlay(
                                VStack {
                                    Image(systemName: "chart.line.uptrend.xyaxis")
                                        .font(.largeTitle)
                                        .foregroundColor(.blue)
                                    Text("Risk Trend Chart")
                                        .font(.headline)
                                        .foregroundColor(.blue)
                                    Text("Coming Soon")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            )
                    }
                }
            }
        }
    }
    
    private var limitsView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Limits Overview
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Transaction Limits")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Daily Limit")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text("$\(viewModel.dailyLimit, specifier: "%.0f")")
                                    .font(.title2.bold())
                                    .foregroundColor(.primary)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("Transaction Limit")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                Text("$\(viewModel.transactionLimit, specifier: "%.0f")")
                                    .font(.title2.bold())
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        // Usage Progress
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Daily Usage")
                                .font(.subheadline.bold())
                                .foregroundColor(.secondary)
                            
                            ProgressView(value: viewModel.dailyUsage, total: viewModel.dailyLimit)
                                .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                                .scaleEffect(x: 1, y: 2, anchor: .center)
                            
                            HStack {
                                Text("Used: $\(viewModel.dailyUsage, specifier: "%.0f")")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("Remaining: $\(viewModel.dailyLimit - viewModel.dailyUsage, specifier: "%.0f")")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                
                // Limit History
                GlassCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Limit History")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        ForEach(viewModel.limitHistory) { history in
                            LimitHistoryRow(history: history)
                            if history.id != viewModel.limitHistory.last?.id {
                                Divider()
                                    .background(Color.white.opacity(0.2))
                            }
                        }
                    }
                }
            }
        }
    }
    
    private let tabTitles = ["KYC", "Sanctions", "Risk", "Limits"]
}

// MARK: - Supporting Views

struct ComplianceStatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        GlassCard {
            VStack(spacing: 8) {
                Text(value)
                    .font(.title2.bold())
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct KYCLevelRow: View {
    let kycLevel: KYCLevel
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(kycLevel.name)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                Text(kycLevel.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            HStack(spacing: 8) {
                Circle()
                    .fill(kycLevel.isVerified ? Color.green : Color.orange)
                    .frame(width: 8, height: 8)
                Text(kycLevel.isVerified ? "Verified" : "Pending")
                    .font(.caption)
                    .foregroundColor(kycLevel.isVerified ? .green : .orange)
            }
        }
    }
}

struct KYCActivityRow: View {
    let activity: KYCActivity
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(activity.action)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                Text(activity.timestamp)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(activity.status)
                .font(.caption)
                .foregroundColor(activity.status == "Completed" ? .green : .orange)
        }
    }
}

struct SanctionsStatItem: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct SanctionsAlertRow: View {
    let alert: SanctionsAlert
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(alert.address)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                Text(alert.reason)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(alert.severity)
                .font(.caption)
                .foregroundColor(alert.severity == "High" ? .red : .orange)
        }
    }
}

struct RiskFactorRow: View {
    let riskFactor: RiskFactor
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(riskFactor.factor)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                Text(riskFactor.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("\(riskFactor.score)%")
                .font(.subheadline.bold())
                .foregroundColor(riskFactor.score > 70 ? .red : riskFactor.score > 40 ? .orange : .green)
        }
    }
}

struct LimitHistoryRow: View {
    let history: LimitHistory
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(history.action)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                Text(history.timestamp)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("$\(history.amount, specifier: "%.0f")")
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                Text(history.status)
                    .font(.caption)
                    .foregroundColor(history.status == "Approved" ? .green : .orange)
            }
        }
    }
}

#Preview {
    ComplianceView()
}
