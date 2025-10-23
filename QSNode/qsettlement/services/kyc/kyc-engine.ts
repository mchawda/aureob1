import { ethers } from 'ethers';

export interface KYCData {
  address: string;
  verified: boolean;
  level: KYCLevel;
  documents: Document[];
  riskScore: number;
  sanctionsCheck: boolean;
  lastUpdated: number;
  metadata: any;
}

export interface Document {
  type: string;
  hash: string;
  verified: boolean;
  uploadedAt: number;
  metadata: any;
}

export enum KYCLevel {
  NONE = 0,
  BASIC = 1,
  ENHANCED = 2,
  INSTITUTIONAL = 3
}

export interface ComplianceStatus {
  kycVerified: boolean;
  kycLevel: KYCLevel;
  riskScore: number;
  sanctionsPassed: boolean;
  dailyLimit: ethers.BigNumber;
  transactionLimit: ethers.BigNumber;
  restrictions: string[];
  lastCheck: number;
}

export interface SanctionsCheck {
  passed: boolean;
  matches: string[];
  checkedAt: number;
}

export class KYCEngine {
  private complianceGate: ethers.Contract;
  private wallet: ethers.Wallet;
  
  // In-memory storage (in production, use database)
  private kycData: Map<string, KYCData> = new Map();
  private sanctionsList: Set<string> = new Set();
  
  // Risk scoring parameters
  private riskThresholds = {
    low: 30,
    medium: 60,
    high: 90
  };
  
  constructor(complianceGate: ethers.Contract, wallet: ethers.Wallet) {
    this.complianceGate = complianceGate;
    this.wallet = wallet;
    
    // Initialize with some test data
    this.initializeTestData();
  }
  
  /**
   * Verify user for KYC compliance
   */
  async verifyUser(address: string): Promise<{ verified: boolean; level: KYCLevel; riskScore: number }> {
    try {
      const kycData = this.kycData.get(address.toLowerCase());
      
      if (!kycData) {
        return {
          verified: false,
          level: KYCLevel.NONE,
          riskScore: 100
        };
      }
      
      // Check if KYC is still valid (not expired)
      const timeSinceUpdate = Date.now() - kycData.lastUpdated;
      const kycValidityPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year
      
      if (timeSinceUpdate > kycValidityPeriod) {
        return {
          verified: false,
          level: KYCLevel.NONE,
          riskScore: 100
        };
      }
      
      // Check sanctions
      const sanctionsCheck = await this.checkSanctions(address);
      if (!sanctionsCheck.passed) {
        return {
          verified: false,
          level: KYCLevel.NONE,
          riskScore: 100
        };
      }
      
      return {
        verified: kycData.verified,
        level: kycData.level,
        riskScore: kycData.riskScore
      };
      
    } catch (error) {
      console.error('KYC verification error:', error);
      return {
        verified: false,
        level: KYCLevel.NONE,
        riskScore: 100
      };
    }
  }
  
  /**
   * Submit KYC documents
   */
  async submitKYCDocuments(
    address: string,
    documents: Document[],
    level: KYCLevel
  ): Promise<boolean> {
    try {
      const addressLower = address.toLowerCase();
      
      // Validate documents
      for (const doc of documents) {
        if (!doc.type || !doc.hash) {
          throw new Error('Invalid document data');
        }
      }
      
      // Calculate risk score based on documents and level
      const riskScore = this.calculateRiskScore(documents, level);
      
      // Check sanctions
      const sanctionsCheck = await this.checkSanctions(address);
      if (!sanctionsCheck.passed) {
        throw new Error('Sanctions check failed');
      }
      
      // Store KYC data
      const kycData: KYCData = {
        address: addressLower,
        verified: true,
        level,
        documents,
        riskScore,
        sanctionsCheck: sanctionsCheck.passed,
        lastUpdated: Date.now(),
        metadata: {
          submittedAt: Date.now(),
          level: level
        }
      };
      
      this.kycData.set(addressLower, kycData);
      
      // Update compliance gate with new limits based on KYC level
      await this.updateComplianceLimits(address, level, riskScore);
      
      console.log(`KYC documents submitted for ${address}, level: ${level}, risk score: ${riskScore}`);
      
      return true;
      
    } catch (error) {
      console.error('KYC submission error:', error);
      return false;
    }
  }
  
  /**
   * Get compliance status for an address
   */
  async getComplianceStatus(address: string): Promise<ComplianceStatus> {
    try {
      const addressLower = address.toLowerCase();
      const kycData = this.kycData.get(addressLower);
      
      if (!kycData) {
        return {
          kycVerified: false,
          kycLevel: KYCLevel.NONE,
          riskScore: 100,
          sanctionsPassed: false,
          dailyLimit: ethers.BigNumber.from(0),
          transactionLimit: ethers.BigNumber.from(0),
          restrictions: ['No KYC data'],
          lastCheck: Date.now()
        };
      }
      
      // Get limits from compliance gate
      const dailyLimit = await this.complianceGate.dailyLimits(address);
      const transactionLimit = await this.complianceGate.transactionLimits(address);
      
      // Check if whitelisted or blacklisted
      const isWhitelisted = await this.complianceGate.whitelistedAddresses(address);
      const isBlacklisted = await this.complianceGate.blacklistedAddresses(address);
      
      const restrictions: string[] = [];
      if (isBlacklisted) {
        restrictions.push('Address is blacklisted');
      }
      if (kycData.riskScore > this.riskThresholds.high) {
        restrictions.push('High risk score');
      }
      if (!kycData.sanctionsCheck) {
        restrictions.push('Sanctions check failed');
      }
      
      return {
        kycVerified: kycData.verified,
        kycLevel: kycData.level,
        riskScore: kycData.riskScore,
        sanctionsPassed: kycData.sanctionsCheck,
        dailyLimit,
        transactionLimit,
        restrictions,
        lastCheck: Date.now()
      };
      
    } catch (error) {
      console.error('Compliance status error:', error);
      return {
        kycVerified: false,
        kycLevel: KYCLevel.NONE,
        riskScore: 100,
        sanctionsPassed: false,
        dailyLimit: ethers.BigNumber.from(0),
        transactionLimit: ethers.BigNumber.from(0),
        restrictions: ['Error fetching compliance data'],
        lastCheck: Date.now()
      };
    }
  }
  
  /**
   * Check sanctions list
   */
  async checkSanctions(address: string): Promise<SanctionsCheck> {
    try {
      const addressLower = address.toLowerCase();
      
      // Check against sanctions list
      const matches: string[] = [];
      if (this.sanctionsList.has(addressLower)) {
        matches.push('Address found in sanctions list');
      }
      
      // In production, this would check against external sanctions databases
      // For now, we'll simulate some checks
      const simulatedMatches = await this.simulateSanctionsCheck(address);
      matches.push(...simulatedMatches);
      
      return {
        passed: matches.length === 0,
        matches,
        checkedAt: Date.now()
      };
      
    } catch (error) {
      console.error('Sanctions check error:', error);
      return {
        passed: false,
        matches: ['Sanctions check failed'],
        checkedAt: Date.now()
      };
    }
  }
  
  /**
   * Calculate risk score based on documents and KYC level
   */
  private calculateRiskScore(documents: Document[], level: KYCLevel): number {
    let score = 100; // Start with maximum risk
    
    // Reduce risk based on KYC level
    switch (level) {
      case KYCLevel.BASIC:
        score -= 20;
        break;
      case KYCLevel.ENHANCED:
        score -= 40;
        break;
      case KYCLevel.INSTITUTIONAL:
        score -= 60;
        break;
    }
    
    // Reduce risk based on number of verified documents
    const verifiedDocs = documents.filter(doc => doc.verified).length;
    score -= verifiedDocs * 5;
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Update compliance limits based on KYC level and risk score
   */
  private async updateComplianceLimits(address: string, level: KYCLevel, riskScore: number): Promise<void> {
    try {
      // Calculate limits based on KYC level and risk score
      let dailyLimit: ethers.BigNumber;
      let transactionLimit: ethers.BigNumber;
      
      switch (level) {
        case KYCLevel.BASIC:
          dailyLimit = ethers.BigNumber.from('1000000000000000000000'); // 1000 tokens
          transactionLimit = ethers.BigNumber.from('100000000000000000000'); // 100 tokens
          break;
        case KYCLevel.ENHANCED:
          dailyLimit = ethers.BigNumber.from('10000000000000000000000'); // 10000 tokens
          transactionLimit = ethers.BigNumber.from('1000000000000000000000'); // 1000 tokens
          break;
        case KYCLevel.INSTITUTIONAL:
          dailyLimit = ethers.BigNumber.from('100000000000000000000000'); // 100000 tokens
          transactionLimit = ethers.BigNumber.from('10000000000000000000000'); // 10000 tokens
          break;
        default:
          dailyLimit = ethers.BigNumber.from('100000000000000000000'); // 100 tokens
          transactionLimit = ethers.BigNumber.from('10000000000000000000'); // 10 tokens
      }
      
      // Adjust limits based on risk score
      if (riskScore > this.riskThresholds.high) {
        dailyLimit = dailyLimit.div(10);
        transactionLimit = transactionLimit.div(10);
      } else if (riskScore > this.riskThresholds.medium) {
        dailyLimit = dailyLimit.div(2);
        transactionLimit = transactionLimit.div(2);
      }
      
      // Update compliance gate
      await this.complianceGate.setDailyLimit(address, dailyLimit);
      await this.complianceGate.setTransactionLimit(address, transactionLimit);
      
    } catch (error) {
      console.error('Compliance limits update error:', error);
    }
  }
  
  /**
   * Simulate sanctions check (in production, use real sanctions databases)
   */
  private async simulateSanctionsCheck(address: string): Promise<string[]> {
    // Simulate some checks
    const matches: string[] = [];
    
    // Check for known test addresses
    if (address.toLowerCase().includes('test') || address.toLowerCase().includes('fake')) {
      matches.push('Test address detected');
    }
    
    // Simulate random checks
    if (Math.random() < 0.01) { // 1% chance
      matches.push('Random sanctions match');
    }
    
    return matches;
  }
  
  /**
   * Initialize test data
   */
  private initializeTestData(): void {
    // Add some test KYC data
    const testAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    ];
    
    testAddresses.forEach(address => {
      const kycData: KYCData = {
        address: address.toLowerCase(),
        verified: true,
        level: KYCLevel.ENHANCED,
        documents: [
          {
            type: 'passport',
            hash: '0x' + Math.random().toString(16).substr(2, 64),
            verified: true,
            uploadedAt: Date.now(),
            metadata: {}
          }
        ],
        riskScore: 30,
        sanctionsCheck: true,
        lastUpdated: Date.now(),
        metadata: {}
      };
      
      this.kycData.set(address.toLowerCase(), kycData);
    });
    
    // Add some test sanctions
    this.sanctionsList.add('0x0000000000000000000000000000000000000001');
    this.sanctionsList.add('0x0000000000000000000000000000000000000002');
  }
  
  /**
   * Add address to sanctions list
   */
  addToSanctionsList(address: string): void {
    this.sanctionsList.add(address.toLowerCase());
  }
  
  /**
   * Remove address from sanctions list
   */
  removeFromSanctionsList(address: string): void {
    this.sanctionsList.delete(address.toLowerCase());
  }
  
  /**
   * Get KYC data for an address
   */
  getKYCData(address: string): KYCData | undefined {
    return this.kycData.get(address.toLowerCase());
  }
  
  /**
   * Get all KYC data
   */
  getAllKYCData(): KYCData[] {
    return Array.from(this.kycData.values());
  }
  
  /**
   * Check if service is healthy
   */
  isHealthy(): boolean {
    try {
      return !!this.complianceGate && !!this.wallet;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      totalKYCRecords: this.kycData.size,
      sanctionsListSize: this.sanctionsList.size,
      riskThresholds: this.riskThresholds,
      isHealthy: this.isHealthy(),
      timestamp: new Date().toISOString()
    };
  }
}
