import SwiftUI
import Foundation

class ComplianceViewModel: ObservableObject {
    @Published var overallStatus: ComplianceStatus = .active
    @Published var verifiedUsers: Int = 1247
    @Published var pendingReviews: Int = 23
    @Published var riskAlerts: Int = 3
    
    // KYC Data
    @Published var kycStatus: ComplianceStatus = .verified
    @Published var lastKYCUpdate: String = "2 hours ago"
    @Published var kycLevels: [KYCLevel] = []
    @Published var recentKYCActivities: [KYCActivity] = []
    
    // Sanctions Data
    @Published var sanctionsStatus: ComplianceStatus = .passed
    @Published var lastSanctionsCheck: String = "5 minutes ago"
    @Published var totalSanctionsChecks: Int = 15420
    @Published var sanctionsMatches: Int = 12
    @Published var sanctionsSuccessRate: Int = 99
    @Published var sanctionsAlerts: [SanctionsAlert] = []
    
    // Risk Assessment Data
    @Published var overallRisk: ComplianceStatus = .low
    @Published var riskScore: Int = 25
    @Published var riskFactors: [RiskFactor] = []
    
    // Limits Data
    @Published var dailyLimit: Double = 10000
    @Published var transactionLimit: Double = 1000
    @Published var dailyUsage: Double = 3250
    @Published var limitHistory: [LimitHistory] = []
    
    enum ComplianceStatus {
        case active, inactive, verified, pending, failed, passed, low, medium, high
        
        var text: String {
            switch self {
            case .active: return "Active"
            case .inactive: return "Inactive"
            case .verified: return "Verified"
            case .pending: return "Pending"
            case .failed: return "Failed"
            case .passed: return "Passed"
            case .low: return "Low"
            case .medium: return "Medium"
            case .high: return "High"
            }
        }
        
        var color: Color {
            switch self {
            case .active, .verified, .passed, .low: return .green
            case .pending, .medium: return .orange
            case .inactive, .failed, .high: return .red
            }
        }
        
        var icon: String {
            switch self {
            case .active, .verified, .passed, .low: return "checkmark.shield"
            case .pending, .medium: return "clock"
            case .inactive, .failed, .high: return "exclamationmark.triangle"
            }
        }
    }
    
    init() {
        loadSampleData()
    }
    
    func loadComplianceData() {
        // Simulate API calls
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.loadSampleData()
        }
    }
    
    func refreshComplianceData() {
        // Simulate refresh
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.loadSampleData()
        }
    }
    
    private func loadSampleData() {
        // Load KYC levels
        kycLevels = [
            KYCLevel(
                level: 1,
                name: "Basic Verification",
                description: "Identity verification with government ID",
                isVerified: true
            ),
            KYCLevel(
                level: 2,
                name: "Enhanced Verification",
                description: "Additional document verification",
                isVerified: true
            ),
            KYCLevel(
                level: 3,
                name: "Institutional Verification",
                description: "Corporate entity verification",
                isVerified: false
            )
        ]
        
        // Load recent KYC activities
        recentKYCActivities = [
            KYCActivity(
                id: UUID(),
                action: "Document Upload",
                timestamp: "2 hours ago",
                status: "Completed"
            ),
            KYCActivity(
                id: UUID(),
                action: "Identity Verification",
                timestamp: "1 day ago",
                status: "Completed"
            ),
            KYCActivity(
                id: UUID(),
                action: "Address Verification",
                timestamp: "3 days ago",
                status: "Pending"
            ),
            KYCActivity(
                id: UUID(),
                action: "Enhanced Verification",
                timestamp: "1 week ago",
                status: "Completed"
            )
        ]
        
        // Load sanctions alerts
        sanctionsAlerts = [
            SanctionsAlert(
                id: UUID(),
                address: "0x1234...5678",
                reason: "Potential match in OFAC list",
                severity: "High",
                timestamp: "1 hour ago"
            ),
            SanctionsAlert(
                id: UUID(),
                address: "0xabcd...efgh",
                reason: "Suspicious transaction pattern",
                severity: "Medium",
                timestamp: "3 hours ago"
            )
        ]
        
        // Load risk factors
        riskFactors = [
            RiskFactor(
                factor: "Transaction Volume",
                description: "High volume transactions detected",
                score: 75
            ),
            RiskFactor(
                factor: "Geographic Risk",
                description: "Transactions from high-risk jurisdictions",
                score: 45
            ),
            RiskFactor(
                factor: "Pattern Analysis",
                description: "Unusual transaction patterns",
                score: 30
            ),
            RiskFactor(
                factor: "Counterparty Risk",
                description: "Transactions with flagged addresses",
                score: 60
            )
        ]
        
        // Load limit history
        limitHistory = [
            LimitHistory(
                id: UUID(),
                action: "Daily Limit Increase",
                amount: 10000,
                timestamp: "2 days ago",
                status: "Approved"
            ),
            LimitHistory(
                id: UUID(),
                action: "Transaction Limit Update",
                amount: 1000,
                timestamp: "1 week ago",
                status: "Approved"
            ),
            LimitHistory(
                id: UUID(),
                action: "Limit Review Request",
                amount: 15000,
                timestamp: "2 weeks ago",
                status: "Pending"
            )
        ]
        
        // Simulate some variation
        verifiedUsers += Int.random(in: -5...10)
        pendingReviews += Int.random(in: -3...5)
        riskAlerts += Int.random(in: -1...2)
        
        // Update overall status based on data
        updateOverallStatus()
    }
    
    private func updateOverallStatus() {
        if riskAlerts > 5 || sanctionsMatches > 10 {
            overallStatus = .high
        } else if riskAlerts > 2 || sanctionsMatches > 5 {
            overallStatus = .medium
        } else {
            overallStatus = .low
        }
    }
}

// MARK: - Data Models

struct KYCLevel {
    let level: Int
    let name: String
    let description: String
    let isVerified: Bool
}

struct KYCActivity: Identifiable {
    let id: UUID
    let action: String
    let timestamp: String
    let status: String
}

struct SanctionsAlert: Identifiable {
    let id: UUID
    let address: String
    let reason: String
    let severity: String
    let timestamp: String
}

struct RiskFactor {
    let factor: String
    let description: String
    let score: Int
}

struct LimitHistory: Identifiable {
    let id: UUID
    let action: String
    let amount: Double
    let timestamp: String
    let status: String
}

// MARK: - API Models

struct ComplianceOverviewResponse: Codable {
    let overallStatus: String
    let verifiedUsers: Int
    let pendingReviews: Int
    let riskAlerts: Int
    let lastUpdate: String
}

struct KYCResponse: Codable {
    let status: String
    let level: Int
    let lastUpdate: String
    let activities: [KYCActivityData]
}

struct KYCActivityData: Codable {
    let action: String
    let timestamp: String
    let status: String
}

struct SanctionsResponse: Codable {
    let status: String
    let lastCheck: String
    let totalChecks: Int
    let matches: Int
    let successRate: Int
    let alerts: [SanctionsAlertData]
}

struct SanctionsAlertData: Codable {
    let address: String
    let reason: String
    let severity: String
    let timestamp: String
}

struct RiskAssessmentResponse: Codable {
    let overallRisk: String
    let riskScore: Int
    let factors: [RiskFactorData]
}

struct RiskFactorData: Codable {
    let factor: String
    let description: String
    let score: Int
}

struct LimitsResponse: Codable {
    let dailyLimit: Double
    let transactionLimit: Double
    let dailyUsage: Double
    let history: [LimitHistoryData]
}

struct LimitHistoryData: Codable {
    let action: String
    let amount: Double
    let timestamp: String
    let status: String
}

// MARK: - API Service Extension

extension QSNApiService {
    func fetchComplianceOverview() async throws -> ComplianceOverviewResponse {
        guard let url = URL(string: "\(baseURL)/compliance/overview") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(ComplianceOverviewResponse.self, from: data)
    }
    
    func fetchKYCStatus() async throws -> KYCResponse {
        guard let url = URL(string: "\(baseURL)/compliance/kyc") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(KYCResponse.self, from: data)
    }
    
    func fetchSanctionsStatus() async throws -> SanctionsResponse {
        guard let url = URL(string: "\(baseURL)/compliance/sanctions") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(SanctionsResponse.self, from: data)
    }
    
    func fetchRiskAssessment() async throws -> RiskAssessmentResponse {
        guard let url = URL(string: "\(baseURL)/compliance/risk") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(RiskAssessmentResponse.self, from: data)
    }
    
    func fetchLimits() async throws -> LimitsResponse {
        guard let url = URL(string: "\(baseURL)/compliance/limits") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(LimitsResponse.self, from: data)
    }
    
    func updateLimits(request: UpdateLimitsRequest) async throws -> UpdateLimitsResponse {
        guard let url = URL(string: "\(baseURL)/compliance/limits/update") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        return try JSONDecoder().decode(UpdateLimitsResponse.self, from: data)
    }
}

struct UpdateLimitsRequest: Codable {
    let dailyLimit: Double
    let transactionLimit: Double
    let reason: String
}

struct UpdateLimitsResponse: Codable {
    let success: Bool
    let newDailyLimit: Double
    let newTransactionLimit: Double
    let timestamp: String
    let error: String?
}
