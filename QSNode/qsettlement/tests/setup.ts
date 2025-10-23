import { ethers } from 'hardhat';

// Global test setup
before(async function () {
  // Set up test environment
  console.log('Setting up test environment...');
  
  // Ensure we have enough test accounts
  const accounts = await ethers.getSigners();
  if (accounts.length < 7) {
    throw new Error('Not enough test accounts available');
  }
  
  console.log(`Test environment ready with ${accounts.length} accounts`);
});

// Global test teardown
after(async function () {
  console.log('Cleaning up test environment...');
});

// Test utilities
export const testUtils = {
  // Generate random address
  randomAddress: () => ethers.Wallet.createRandom().address,
  
  // Generate random amount
  randomAmount: (min: number = 1, max: number = 1000) => 
    ethers.parseEther(Math.floor(Math.random() * (max - min + 1)) + min).toString(),
  
  // Wait for transaction confirmation
  waitForTx: async (tx: any) => {
    const receipt = await tx.wait();
    return receipt;
  },
  
  // Generate test data
  generateTestData: () => ({
    address: ethers.Wallet.createRandom().address,
    amount: ethers.parseEther('100').toString(),
    currency: 'USD',
    offchainRef: `test-${Date.now()}`
  }),
  
  // Mock external API responses
  mockApiResponse: (data: any) => ({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
};

// Export for use in tests
export { ethers };
