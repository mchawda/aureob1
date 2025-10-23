import { ethers } from 'ethers';
import axios from 'axios';

export interface ReserveData {
  currency: string;
  totalReserves: ethers.BigNumber;
  tokenSupply: ethers.BigNumber;
  reserveRatio: number; // in basis points
  lastAttestationTime: number;
  merkleRoot: string;
  isActive: boolean;
  metadata: any;
}

export interface ReserveStatus {
  healthy: boolean;
  ratio: number;
  lastUpdate: number;
  issues: string[];
}

export interface AttestationData {
  currency: string;
  reserves: ethers.BigNumber;
  supply: ethers.BigNumber;
  merkleRoot: string;
  timestamp: number;
  metadata: any;
}

export class ReserveOracle {
  private provider: ethers.JsonRpcProvider;
  private reserveRegistry: ethers.Contract;
  private wallet: ethers.Wallet;
  
  // External data sources
  private externalOracles: string[] = [];
  private attestationInterval: number = 300000; // 5 minutes
  private lastAttestation: Map<string, number> = new Map();
  
  constructor(
    provider: ethers.JsonRpcProvider,
    wallet: ethers.Wallet,
    reserveRegistry: ethers.Contract,
    externalOracles: string[] = []
  ) {
    this.provider = provider;
    this.wallet = wallet;
    this.reserveRegistry = reserveRegistry;
    this.externalOracles = externalOracles;
    
    // Start periodic attestation
    this.startPeriodicAttestation();
  }
  
  /**
   * Get reserve status for a currency
   */
  async getReserveStatus(currency: string): Promise<ReserveStatus> {
    try {
      const reserveData = await this.reserveRegistry.getReserveData(currency);
      const isHealthy = await this.reserveRegistry.isReserveHealthy(currency);
      
      const issues: string[] = [];
      
      // Check if reserve is active
      if (!reserveData.isActive) {
        issues.push('Reserve is not active');
      }
      
      // Check if attestation is recent (within 24 hours)
      const timeSinceAttestation = Date.now() - (reserveData.lastAttestationTime * 1000);
      if (timeSinceAttestation > 86400000) { // 24 hours
        issues.push('Attestation is stale');
      }
      
      // Check reserve ratio
      const ratio = reserveData.tokenSupply.gt(0) 
        ? reserveData.totalReserves.mul(10000).div(reserveData.tokenSupply).toNumber()
        : 0;
        
      if (ratio < 10000) { // Less than 100% backing
        issues.push(`Reserve ratio below 100%: ${ratio/100}%`);
      }
      
      return {
        healthy: isHealthy && issues.length === 0,
        ratio,
        lastUpdate: reserveData.lastAttestationTime,
        issues
      };
      
    } catch (error) {
      console.error('Reserve status error:', error);
      return {
        healthy: false,
        ratio: 0,
        lastUpdate: 0,
        issues: ['Failed to fetch reserve data']
      };
    }
  }
  
  /**
   * Attest reserves for a currency
   */
  async attestReserves(
    currency: string,
    reserves: ethers.BigNumberish,
    supply: ethers.BigNumberish,
    merkleRoot: string,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      const reservesBN = ethers.BigNumber.from(reserves);
      const supplyBN = ethers.BigNumber.from(supply);
      
      // Validate inputs
      if (reservesBN.lte(0)) {
        throw new Error('Reserves must be positive');
      }
      
      if (supplyBN.lte(0)) {
        throw new Error('Supply must be positive');
      }
      
      // Check if attestation is needed
      const lastAttestationTime = this.lastAttestation.get(currency) || 0;
      const timeSinceLastAttestation = Date.now() - lastAttestationTime;
      
      if (timeSinceLastAttestation < this.attestationInterval) {
        console.log(`Attestation for ${currency} too recent, skipping`);
        return true;
      }
      
      // Execute attestation transaction
      const tx = await this.reserveRegistry.attestReserves(
        currency,
        reservesBN,
        supplyBN,
        merkleRoot,
        JSON.stringify(metadata)
      );
      
      await tx.wait();
      
      // Update last attestation time
      this.lastAttestation.set(currency, Date.now());
      
      console.log(`Reserves attested for ${currency}: ${reservesBN.toString()} reserves, ${supplyBN.toString()} supply`);
      
      return true;
      
    } catch (error) {
      console.error('Attestation error:', error);
      return false;
    }
  }
  
  /**
   * Update reserves for a currency
   */
  async updateReserves(
    currency: string,
    reserves: ethers.BigNumberish,
    supply: ethers.BigNumberish,
    merkleRoot: string,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      const reservesBN = ethers.BigNumber.from(reserves);
      const supplyBN = ethers.BigNumber.from(supply);
      
      // Execute update transaction
      const tx = await this.reserveRegistry.updateReserves(
        currency,
        reservesBN,
        supplyBN,
        merkleRoot,
        JSON.stringify(metadata)
      );
      
      await tx.wait();
      
      // Update last attestation time
      this.lastAttestation.set(currency, Date.now());
      
      console.log(`Reserves updated for ${currency}: ${reservesBN.toString()} reserves, ${supplyBN.toString()} supply`);
      
      return true;
      
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }
  
  /**
   * Fetch reserve data from external sources
   */
  async fetchExternalReserveData(currency: string): Promise<AttestationData | null> {
    try {
      const results = await Promise.allSettled(
        this.externalOracles.map(async (oracleUrl) => {
          const response = await axios.get(`${oracleUrl}/reserves/${currency}`, {
            timeout: 10000
          });
          return response.data;
        })
      );
      
      // Find successful responses
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);
      
      if (successfulResults.length === 0) {
        throw new Error('No external oracle data available');
      }
      
      // Use the first successful result (could implement consensus logic here)
      const data = successfulResults[0];
      
      return {
        currency,
        reserves: ethers.BigNumber.from(data.reserves || 0),
        supply: ethers.BigNumber.from(data.supply || 0),
        merkleRoot: data.merkleRoot || ethers.utils.formatBytes32String('0'),
        timestamp: data.timestamp || Math.floor(Date.now() / 1000),
        metadata: data.metadata || {}
      };
      
    } catch (error) {
      console.error('External data fetch error:', error);
      return null;
    }
  }
  
  /**
   * Generate merkle root for reserve proof
   */
  generateMerkleRoot(reserveData: any[]): string {
    try {
      // Simple implementation - in production, use proper merkle tree
      const dataString = JSON.stringify(reserveData);
      return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
    } catch (error) {
      console.error('Merkle root generation error:', error);
      return ethers.utils.formatBytes32String('0');
    }
  }
  
  /**
   * Start periodic attestation
   */
  private startPeriodicAttestation(): void {
    setInterval(async () => {
      try {
        // Get all active currencies (this would be implemented based on your needs)
        const currencies = ['USD', 'EUR', 'GBP']; // Example currencies
        
        for (const currency of currencies) {
          const externalData = await this.fetchExternalReserveData(currency);
          if (externalData) {
            const merkleRoot = this.generateMerkleRoot([externalData]);
            await this.attestReserves(
              currency,
              externalData.reserves,
              externalData.supply,
              merkleRoot,
              externalData.metadata
            );
          }
        }
      } catch (error) {
        console.error('Periodic attestation error:', error);
      }
    }, this.attestationInterval);
  }
  
  /**
   * Add external oracle
   */
  addExternalOracle(oracleUrl: string): void {
    if (!this.externalOracles.includes(oracleUrl)) {
      this.externalOracles.push(oracleUrl);
    }
  }
  
  /**
   * Remove external oracle
   */
  removeExternalOracle(oracleUrl: string): void {
    this.externalOracles = this.externalOracles.filter(url => url !== oracleUrl);
  }
  
  /**
   * Get all external oracles
   */
  getExternalOracles(): string[] {
    return [...this.externalOracles];
  }
  
  /**
   * Check if service is healthy
   */
  isHealthy(): boolean {
    try {
      return !!this.reserveRegistry && !!this.provider && !!this.wallet;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      externalOracles: this.externalOracles.length,
      lastAttestations: Object.fromEntries(this.lastAttestation),
      attestationInterval: this.attestationInterval,
      isHealthy: this.isHealthy(),
      timestamp: new Date().toISOString()
    };
  }
}
