import SwiftUI
import Foundation

class DashboardViewModel: ObservableObject {
    @Published var usdBalance: Double = 63773.90
    @Published var eurBalance: Double = 54231.50
    @Published var totalReserves: Double = 1500000.00
    @Published var backingRatio: Double = 102.4
    @Published var lastAttestation: String = "2 hours ago"
    @Published var transactionCount: Int = 47
    @Published var weeklyVolume: Double = 125000.00
    @Published var showBalanceDetails: Bool = false
    @Published var showMintSheet: Bool = false
    @Published var showBurnSheet: Bool = false
    @Published var showTransferSheet: Bool = false
    @Published var showComplianceSheet: Bool = false
    @Published var showAllTransactions: Bool = false
    
    // Compliance status
    @Published var kycStatus: ComplianceRow.ComplianceStatus = .verified
    @Published var sanctionsStatus: ComplianceRow.ComplianceStatus = .passed
    @Published var riskStatus: ComplianceRow.ComplianceStatus = .low
    
    // Recent transactions
    @Published var recentTransactions: [Transaction] = []
    
    // Network status
    @Published var networkStatus: NetworkStatus = .online
    @Published var reservesStatus: NetworkStatus = .healthy
    @Published var complianceStatus: NetworkStatus = .active
    
    enum NetworkStatus {
        case online, offline, healthy, unhealthy, active, inactive
    }
    
    init() {
        loadSampleData()
    }
    
    func loadData() {
        // Simulate API calls
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.loadSampleData()
        }
    }
    
    func refreshData() {
        // Simulate refresh
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.loadSampleData()
        }
    }
    
    private func loadSampleData() {
        // Load sample transactions
        recentTransactions = [
            Transaction(
                id: UUID(),
                type: .mint,
                amount: "+$1,000.00",
                timestamp: "2 minutes ago",
                status: .completed
            ),
            Transaction(
                id: UUID(),
                type: .transfer,
                amount: "-$500.00",
                timestamp: "15 minutes ago",
                status: .completed
            ),
            Transaction(
                id: UUID(),
                type: .burn,
                amount: "-$250.00",
                timestamp: "1 hour ago",
                status: .pending
            ),
            Transaction(
                id: UUID(),
                type: .mint,
                amount: "+$2,500.00",
                timestamp: "3 hours ago",
                status: .completed
            ),
            Transaction(
                id: UUID(),
                type: .transfer,
                amount: "-$1,200.00",
                timestamp: "1 day ago",
                status: .completed
            )
        ]
        
        // Simulate some variation in balances
        usdBalance += Double.random(in: -100...500)
        eurBalance += Double.random(in: -50...300)
        
        // Update compliance status (simulate real-time updates)
        updateComplianceStatus()
    }
    
    private func updateComplianceStatus() {
        // Simulate compliance checks
        let randomKYC = Int.random(in: 0...2)
        switch randomKYC {
        case 0: kycStatus = .verified
        case 1: kycStatus = .pending
        default: kycStatus = .failed
        }
        
        let randomSanctions = Int.random(in: 0...1)
        sanctionsStatus = randomSanctions == 0 ? .passed : .failed
        
        let randomRisk = Int.random(in: 0...2)
        switch randomRisk {
        case 0: riskStatus = .low
        case 1: riskStatus = .medium
        default: riskStatus = .high
        }
    }
}

struct Transaction: Identifiable {
    let id: UUID
    let type: TransactionType
    let amount: String
    let timestamp: String
    let status: TransactionStatus
    
    enum TransactionType: String {
        case mint = "Mint"
        case burn = "Burn"
        case transfer = "Transfer"
        case deposit = "Deposit"
        case withdrawal = "Withdrawal"
    }
    
    enum TransactionStatus: String {
        case completed = "Completed"
        case pending = "Pending"
        case failed = "Failed"
        case processing = "Processing"
    }
}

// MARK: - API Models

struct BalanceResponse: Codable {
    let usdBalance: Double
    let eurBalance: Double
    let totalReserves: Double
    let backingRatio: Double
    let lastAttestation: String
}

struct TransactionResponse: Codable {
    let transactions: [TransactionData]
    let totalCount: Int
    let weeklyVolume: Double
}

struct TransactionData: Codable {
    let id: String
    let type: String
    let amount: String
    let timestamp: String
    let status: String
    let hash: String?
    let from: String?
    let to: String?
}

struct ComplianceResponse: Codable {
    let kycVerified: Bool
    let kycLevel: String
    let riskScore: Int
    let sanctionsPassed: Bool
    let dailyLimit: String
    let transactionLimit: String
    let restrictions: [String]
}

struct ReserveStatusResponse: Codable {
    let currency: String
    let healthy: Bool
    let ratio: Double
    let lastUpdate: Int
    let issues: [String]
}

// MARK: - API Service

class QSNApiService: ObservableObject {
    private let baseURL = "http://localhost:3000/api/v1"
    
    func fetchBalance() async throws -> BalanceResponse {
        guard let url = URL(string: "\(baseURL)/balance") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(BalanceResponse.self, from: data)
    }
    
    func fetchTransactions() async throws -> TransactionResponse {
        guard let url = URL(string: "\(baseURL)/transactions") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(TransactionResponse.self, from: data)
    }
    
    func fetchComplianceStatus(address: String) async throws -> ComplianceResponse {
        guard let url = URL(string: "\(baseURL)/compliance/\(address)") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(ComplianceResponse.self, from: data)
    }
    
    func fetchReserveStatus(currency: String) async throws -> ReserveStatusResponse {
        guard let url = URL(string: "\(baseURL)/reserves/\(currency)") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(ReserveStatusResponse.self, from: data)
    }
    
    func mintToken(request: MintRequest) async throws -> MintResponse {
        guard let url = URL(string: "\(baseURL)/mint") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        return try JSONDecoder().decode(MintResponse.self, from: data)
    }
    
    func burnToken(request: BurnRequest) async throws -> BurnResponse {
        guard let url = URL(string: "\(baseURL)/burn") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        return try JSONDecoder().decode(BurnResponse.self, from: data)
    }
    
    func transferToken(request: TransferRequest) async throws -> TransferResponse {
        guard let url = URL(string: "\(baseURL)/transfer") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        return try JSONDecoder().decode(TransferResponse.self, from: data)
    }
}

// MARK: - Request/Response Models

struct MintRequest: Codable {
    let to: String
    let amount: String
    let currency: String
    let offchainRef: String?
}

struct MintResponse: Codable {
    let success: Bool
    let transactionHash: String?
    let offchainRef: String
    let amount: String
    let currency: String
    let timestamp: String
    let error: String?
}

struct BurnRequest: Codable {
    let from: String
    let amount: String
    let currency: String
    let offchainRef: String?
}

struct BurnResponse: Codable {
    let success: Bool
    let transactionHash: String?
    let offchainRef: String
    let amount: String
    let currency: String
    let timestamp: String
    let error: String?
}

struct TransferRequest: Codable {
    let from: String
    let to: String
    let amount: String
    let currency: String
}

struct TransferResponse: Codable {
    let success: Bool
    let transactionHash: String?
    let from: String
    let to: String
    let amount: String
    let currency: String
    let timestamp: String
    let error: String?
}

// MARK: - Error Handling

enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let message):
            return "Network error: \(message)"
        }
    }
}
