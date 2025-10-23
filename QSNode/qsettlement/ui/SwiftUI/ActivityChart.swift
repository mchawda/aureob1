import SwiftUI
import Charts

struct ActivityChart: View {
    let data: [ActivityDataPoint]
    let timeRange: TimeRange
    
    enum TimeRange {
        case day, week, month, year
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Activity Overview")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Picker("Time Range", selection: .constant(timeRange)) {
                    Text("Day").tag(TimeRange.day)
                    Text("Week").tag(TimeRange.week)
                    Text("Month").tag(TimeRange.month)
                    Text("Year").tag(TimeRange.year)
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 200)
            }
            
            QuantumGlassCard(glowColor: .blue) {
                VStack {
                    Chart(data) { dataPoint in
                        LineMark(
                            x: .value("Time", dataPoint.timestamp),
                            y: .value("Value", dataPoint.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        
                        AreaMark(
                            x: .value("Time", dataPoint.timestamp),
                            y: .value("Value", dataPoint.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue.opacity(0.3), .purple.opacity(0.1)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                    }
                    .frame(height: 200)
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .hour, count: 6)) { value in
                            AxisGridLine()
                                .foregroundStyle(.white.opacity(0.2))
                            AxisTick()
                                .foregroundStyle(.white.opacity(0.6))
                            AxisValueLabel()
                                .foregroundStyle(.secondary)
                        }
                    }
                    .chartYAxis {
                        AxisMarks { value in
                            AxisGridLine()
                                .foregroundStyle(.white.opacity(0.2))
                            AxisTick()
                                .foregroundStyle(.white.opacity(0.6))
                            AxisValueLabel()
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    // Summary stats
                    HStack(spacing: 20) {
                        StatCard(title: "Total Volume", value: "$\(totalVolume, specifier: "%.0f")", color: .blue)
                        StatCard(title: "Transactions", value: "\(data.count)", color: .green)
                        StatCard(title: "Avg. Value", value: "$\(averageValue, specifier: "%.0f")", color: .purple)
                    }
                    .padding(.top)
                }
            }
        }
    }
    
    private var totalVolume: Double {
        data.reduce(0) { $0 + $1.value }
    }
    
    private var averageValue: Double {
        data.isEmpty ? 0 : totalVolume / Double(data.count)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ActivityDataPoint: Identifiable {
    let id = UUID()
    let timestamp: Date
    let value: Double
    let type: ActivityType
    
    enum ActivityType {
        case mint, burn, transfer, deposit, withdrawal
    }
}

struct QuantumActivityChart: View {
    @State private var selectedDataPoint: ActivityDataPoint?
    @State private var animationOffset: CGFloat = 0
    
    let data: [ActivityDataPoint]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quantum Activity")
                .font(.headline)
                .foregroundColor(.secondary)
            
            QuantumGlassCard(glowColor: .cyan) {
                VStack {
                    Chart(data) { dataPoint in
                        LineMark(
                            x: .value("Time", dataPoint.timestamp),
                            y: .value("Value", dataPoint.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.cyan, .blue, .purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .lineStyle(StrokeStyle(lineWidth: 3))
                        .symbol(Circle())
                        .symbolSize(50)
                        
                        if let selected = selectedDataPoint, selected.id == dataPoint.id {
                            PointMark(
                                x: .value("Time", dataPoint.timestamp),
                                y: .value("Value", dataPoint.value)
                            )
                            .foregroundStyle(.white)
                            .symbolSize(100)
                        }
                    }
                    .frame(height: 250)
                    .chartAngleSelection(value: .constant(nil))
                    .chartBackground { chartProxy in
                        GeometryReader { geometry in
                            Rectangle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            .cyan.opacity(0.1),
                                            .blue.opacity(0.05),
                                            .purple.opacity(0.1)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        }
                    }
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .hour, count: 4)) { value in
                            AxisGridLine()
                                .foregroundStyle(.white.opacity(0.1))
                            AxisTick()
                                .foregroundStyle(.white.opacity(0.4))
                            AxisValueLabel()
                                .foregroundStyle(.secondary)
                        }
                    }
                    .chartYAxis {
                        AxisMarks { value in
                            AxisGridLine()
                                .foregroundStyle(.white.opacity(0.1))
                            AxisTick()
                                .foregroundStyle(.white.opacity(0.4))
                            AxisValueLabel()
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    // Activity type legend
                    HStack(spacing: 16) {
                        ActivityLegendItem(type: .mint, color: .green)
                        ActivityLegendItem(type: .burn, color: .red)
                        ActivityLegendItem(type: .transfer, color: .blue)
                        ActivityLegendItem(type: .deposit, color: .purple)
                        ActivityLegendItem(type: .withdrawal, color: .orange)
                    }
                    .padding(.top)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                animationOffset = 1.0
            }
        }
    }
}

struct ActivityLegendItem: View {
    let type: ActivityDataPoint.ActivityType
    let color: Color
    
    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(type.rawValue.capitalized)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct ComplianceChart: View {
    let complianceData: [ComplianceDataPoint]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Compliance Overview")
                .font(.headline)
                .foregroundColor(.secondary)
            
            GlassCard {
                VStack {
                    Chart(complianceData) { dataPoint in
                        BarMark(
                            x: .value("Category", dataPoint.category),
                            y: .value("Score", dataPoint.score)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: dataPoint.score > 80 ? [.green, .green.opacity(0.7)] :
                                        dataPoint.score > 60 ? [.orange, .orange.opacity(0.7)] :
                                        [.red, .red.opacity(0.7)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .cornerRadius(8)
                    }
                    .frame(height: 200)
                    .chartYAxis {
                        AxisMarks { value in
                            AxisGridLine()
                                .foregroundStyle(.white.opacity(0.2))
                            AxisTick()
                                .foregroundStyle(.white.opacity(0.6))
                            AxisValueLabel()
                                .foregroundStyle(.secondary)
                        }
                    }
                    .chartXAxis {
                        AxisMarks { value in
                            AxisValueLabel()
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    // Compliance summary
                    HStack {
                        ComplianceSummaryItem(
                            title: "Overall Score",
                            value: "\(overallScore)",
                            color: overallScore > 80 ? .green : overallScore > 60 ? .orange : .red
                        )
                        
                        Spacer()
                        
                        ComplianceSummaryItem(
                            title: "Last Check",
                            value: "2 min ago",
                            color: .blue
                        )
                    }
                    .padding(.top)
                }
            }
        }
    }
    
    private var overallScore: Int {
        Int(complianceData.reduce(0) { $0 + $1.score } / Double(complianceData.count))
    }
}

struct ComplianceDataPoint: Identifiable {
    let id = UUID()
    let category: String
    let score: Double
}

struct ComplianceSummaryItem: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        ActivityChart(
            data: [
                ActivityDataPoint(timestamp: Date().addingTimeInterval(-3600), value: 1000, type: .mint),
                ActivityDataPoint(timestamp: Date().addingTimeInterval(-1800), value: 500, type: .transfer),
                ActivityDataPoint(timestamp: Date().addingTimeInterval(-900), value: 750, type: .burn),
                ActivityDataPoint(timestamp: Date(), value: 1200, type: .mint)
            ],
            timeRange: .day
        )
        
        QuantumActivityChart(
            data: [
                ActivityDataPoint(timestamp: Date().addingTimeInterval(-3600), value: 1000, type: .mint),
                ActivityDataPoint(timestamp: Date().addingTimeInterval(-1800), value: 500, type: .transfer),
                ActivityDataPoint(timestamp: Date().addingTimeInterval(-900), value: 750, type: .burn),
                ActivityDataPoint(timestamp: Date(), value: 1200, type: .mint)
            ]
        )
        
        ComplianceChart(
            complianceData: [
                ComplianceDataPoint(category: "KYC", score: 95),
                ComplianceDataPoint(category: "Sanctions", score: 100),
                ComplianceDataPoint(category: "Risk", score: 75),
                ComplianceDataPoint(category: "AML", score: 90)
            ]
        )
    }
    .padding()
    .background(
        LinearGradient(
            colors: [.blue.opacity(0.1), .black.opacity(0.9)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    )
}
