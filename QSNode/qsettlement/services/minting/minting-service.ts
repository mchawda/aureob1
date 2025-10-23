import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

export interface MintingRequest {
  to: string;
  amount: ethers.BigNumberish;
  currency: string;
  offchainRef?: string;
  metadata?: any;
}

export interface MintingResult {
  success: boolean;
  transactionHash?: string;
  offchainRef: string;
  amount: string;
  currency: string;
  timestamp: string;
  error?: string;
}

export interface BurnRequest {
  from: string;
  amount: ethers.BigNumberish;
  currency: string;
  offchainRef?: string;
  metadata?: any;
}

export interface BurnResult {
  success: boolean;
  transactionHash?: string;
  offchainRef: string;
  amount: string;
  currency: string;
  timestamp: string;
  error?: string;
}

export class MintingService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private fiatToken: ethers.Contract;
  private complianceGate: ethers.Contract;
  private feeRouter: ethers.Contract;
  private reserveRegistry: ethers.Contract;
  
  // Offchain tracking
  private mintingRequests: Map<string, MintingRequest> = new Map();
  private burningRequests: Map<string, BurnRequest> = new Map();
  
  constructor(
    provider: ethers.JsonRpcProvider,
    wallet: ethers.Wallet,
    contracts: {
      fiatToken: ethers.Contract;
      complianceGate: ethers.Contract;
      feeRouter: ethers.Contract;
      reserveRegistry: ethers.Contract;
    }
  ) {
    this.provider = provider;
    this.wallet = wallet;
    this.fiatToken = contracts.fiatToken;
    this.complianceGate = contracts.complianceGate;
    this.feeRouter = contracts.feeRouter;
    this.reserveRegistry = contracts.reserveRegistry;
  }
  
  /**
   * Mint tokens to a specific address
   */
  async mintToken(
    to: string,
    amount: ethers.BigNumberish,
    currency: string,
    offchainRef?: string
  ): Promise<MintingResult> {
    try {
      // Generate offchain reference if not provided
      const reference = offchainRef || uuidv4();
      
      // Validate inputs
      if (!ethers.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }
      
      const amountBN = ethers.BigNumber.from(amount);
      if (amountBN.lte(0)) {
        throw new Error('Amount must be positive');
      }
      
      // Check reserve health
      const reserveHealthy = await this.reserveRegistry.isReserveHealthy(currency);
      if (!reserveHealthy) {
        throw new Error(`Reserve for ${currency} is not healthy`);
      }
      
      // Store request for tracking
      const request: MintingRequest = {
        to,
        amount: amountBN,
        currency,
        offchainRef: reference,
        metadata: {
          timestamp: new Date().toISOString(),
          blockNumber: await this.provider.getBlockNumber()
        }
      };
      
      this.mintingRequests.set(reference, request);
      
      // Execute minting transaction
      const tx = await this.fiatToken.mint(to, amountBN, ethers.utils.formatBytes32String(reference));
      await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        offchainRef: reference,
        amount: amountBN.toString(),
        currency,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Minting error:', error);
      return {
        success: false,
        offchainRef: offchainRef || uuidv4(),
        amount: amount.toString(),
        currency,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  /**
   * Burn tokens from a specific address
   */
  async burnToken(
    from: string,
    amount: ethers.BigNumberish,
    currency: string,
    offchainRef?: string
  ): Promise<BurnResult> {
    try {
      // Generate offchain reference if not provided
      const reference = offchainRef || uuidv4();
      
      // Validate inputs
      if (!ethers.isAddress(from)) {
        throw new Error('Invalid sender address');
      }
      
      const amountBN = ethers.BigNumber.from(amount);
      if (amountBN.lte(0)) {
        throw new Error('Amount must be positive');
      }
      
      // Check balance
      const balance = await this.fiatToken.balanceOf(from);
      if (balance.lt(amountBN)) {
        throw new Error('Insufficient balance');
      }
      
      // Store request for tracking
      const request: BurnRequest = {
        from,
        amount: amountBN,
        currency,
        offchainRef: reference,
        metadata: {
          timestamp: new Date().toISOString(),
          blockNumber: await this.provider.getBlockNumber()
        }
      };
      
      this.burningRequests.set(reference, request);
      
      // Execute burning transaction
      const tx = await this.fiatToken.burn(from, amountBN, ethers.utils.formatBytes32String(reference));
      await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        offchainRef: reference,
        amount: amountBN.toString(),
        currency,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Burning error:', error);
      return {
        success: false,
        offchainRef: offchainRef || uuidv4(),
        amount: amount.toString(),
        currency,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
  
  /**
   * Get minting request by offchain reference
   */
  getMintingRequest(offchainRef: string): MintingRequest | undefined {
    return this.mintingRequests.get(offchainRef);
  }
  
  /**
   * Get burning request by offchain reference
   */
  getBurningRequest(offchainRef: string): BurnRequest | undefined {
    return this.burningRequests.get(offchainRef);
  }
  
  /**
   * Get all minting requests
   */
  getAllMintingRequests(): MintingRequest[] {
    return Array.from(this.mintingRequests.values());
  }
  
  /**
   * Get all burning requests
   */
  getAllBurningRequests(): BurnRequest[] {
    return Array.from(this.burningRequests.values());
  }
  
  /**
   * Calculate minting fees
   */
  async calculateMintingFee(amount: ethers.BigNumberish): Promise<ethers.BigNumber> {
    try {
      // For minting, fees are typically zero or minimal
      // This could be configured based on business rules
      return ethers.BigNumber.from(0);
    } catch (error) {
      console.error('Fee calculation error:', error);
      return ethers.BigNumber.from(0);
    }
  }
  
  /**
   * Calculate burning fees
   */
  async calculateBurningFee(amount: ethers.BigNumberish): Promise<ethers.BigNumber> {
    try {
      // For burning, fees are typically zero or minimal
      // This could be configured based on business rules
      return ethers.BigNumber.from(0);
    } catch (error) {
      console.error('Fee calculation error:', error);
      return ethers.BigNumber.from(0);
    }
  }
  
  /**
   * Get total supply for a currency
   */
  async getTotalSupply(currency: string): Promise<ethers.BigNumber> {
    try {
      return await this.fiatToken.totalSupply();
    } catch (error) {
      console.error('Total supply error:', error);
      return ethers.BigNumber.from(0);
    }
  }
  
  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<ethers.BigNumber> {
    try {
      return await this.fiatToken.balanceOf(address);
    } catch (error) {
      console.error('Balance error:', error);
      return ethers.BigNumber.from(0);
    }
  }
  
  /**
   * Check if service is healthy
   */
  isHealthy(): boolean {
    try {
      // Check if contracts are accessible
      return !!this.fiatToken && !!this.complianceGate && !!this.feeRouter && !!this.reserveRegistry;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      totalMintingRequests: this.mintingRequests.size,
      totalBurningRequests: this.burningRequests.size,
      isHealthy: this.isHealthy(),
      timestamp: new Date().toISOString()
    };
  }
}
