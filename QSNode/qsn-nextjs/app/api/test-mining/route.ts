import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

// Use the second Hardhat test account to send transfers
const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const FIAT_TOKEN_ADDRESS = process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const FiatTokenABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = body?.count || 5;
    
    const fiatToken = new ethers.Contract(FIAT_TOKEN_ADDRESS, FiatTokenABI, signer);
    
    // Check balance
    let balance = await fiatToken.balanceOf(signer.address);
    console.log(`Sender balance: ${ethers.formatEther(balance)} USDx`);
    
    // If no balance, mint first (this will create a block)
    if (balance === 0n) {
      console.log('No balance, minting from deployer...');
      const DEPLOYER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);
      const deployerToken = new ethers.Contract(FIAT_TOKEN_ADDRESS, [...FiatTokenABI, 'function mint(address to, uint256 amount, bytes32 offchainRef) external'], deployer);
      
      const offchainRef = ethers.id(`mint-${Date.now()}`);
      const mintTx = await deployerToken.mint(signer.address, ethers.parseEther('50'), offchainRef);
      await mintTx.wait();
      balance = await fiatToken.balanceOf(signer.address);
      console.log(`After mint: ${ethers.formatEther(balance)} USDx`);
    }

    const transactionHashes = [];
    const transferAmount = ethers.parseEther('0.5');

    // Generate transfer transactions to trigger block mining
    for (let i = 0; i < count; i++) {
      try {
        const randomWallet = ethers.Wallet.createRandom();
        
        console.log(`Transfer ${i + 1}/${count} of 0.5 USDx to ${randomWallet.address.substring(0, 10)}`);
        
        const tx = await fiatToken.transfer(randomWallet.address, transferAmount);
        const receipt = await tx.wait();
        
        transactionHashes.push({
          index: i + 1,
          hash: tx.hash,
          blockNumber: receipt?.blockNumber,
          to: randomWallet.address.substring(0, 10) + '...',
          status: 'mined'
        });
      } catch (err: any) {
        console.error(`Transfer ${i + 1} failed:`, err.message);
        transactionHashes.push({
          index: i + 1,
          error: err.message,
          status: 'failed'
        });
      }
    }

    const finalBalance = await fiatToken.balanceOf(signer.address);

    return NextResponse.json({
      success: true,
      message: `Generated ${count} test transactions to trigger block mining`,
      transactionsTriggered: transactionHashes.filter(t => t.status === 'mined').length,
      transactions: transactionHashes,
      finalBalance: ethers.formatEther(finalBalance),
      timestamp: new Date().toISOString(),
      note: 'Each transaction triggers a new block on Hardhat. Settlement speed will update accordingly.'
    });
  } catch (error: any) {
    console.error('Test mining error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
