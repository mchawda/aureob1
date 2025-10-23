import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const FiatTokenABI = [
  "function burn(address from, uint256 amount, bytes32 offchainRef) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
];

const CONTRACT_ADDRESS = process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, amount, currency } = body;
    
    if (!from || !amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!ethers.isAddress(from)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }
    
    // REAL CONTRACT CALL
    const fiatToken = new ethers.Contract(CONTRACT_ADDRESS, FiatTokenABI, wallet);
    
    const balanceBefore = await fiatToken.balanceOf(from);
    const totalSupplyBefore = await fiatToken.totalSupply();
    
    // Generate offchain reference
    const offchainRef = ethers.id(`burn-${Date.now()}`);
    
    // ACTUALLY BURN TOKENS ON BLOCKCHAIN
    const tx = await fiatToken.burn(
      from,
      ethers.parseEther(amount.toString()),
      offchainRef
    );
    
    const receipt = await tx.wait();
    
    const balanceAfter = await fiatToken.balanceOf(from);
    const totalSupplyAfter = await fiatToken.totalSupply();
    
    return NextResponse.json({
      success: true,
      real: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      amount: amount.toString(),
      currency,
      balanceBefore: ethers.formatEther(balanceBefore),
      balanceAfter: ethers.formatEther(balanceAfter),
      totalSupplyBefore: ethers.formatEther(totalSupplyBefore),
      totalSupplyAfter: ethers.formatEther(totalSupplyAfter),
      timestamp: new Date().toISOString(),
      note: 'REAL blockchain transaction - tokens actually burned!'
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      real: true
    }, { status: 500 });
  }
}
