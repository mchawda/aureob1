import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

const FiatTokenABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
];

const CONTRACT_ADDRESS = process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    
    if (!ethers.isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }
    
    // REAL CONTRACT CALL
    const fiatToken = new ethers.Contract(CONTRACT_ADDRESS, FiatTokenABI, provider);
    
    const balance = await fiatToken.balanceOf(address);
    const totalSupply = await fiatToken.totalSupply();
    const name = await fiatToken.name();
    const symbol = await fiatToken.symbol();
    
    return NextResponse.json({
      real: true,
      address,
      balance: ethers.formatEther(balance),
      balanceWei: balance.toString(),
      totalSupply: ethers.formatEther(totalSupply),
      totalSupplyWei: totalSupply.toString(),
      token: {
        name,
        symbol
      },
      timestamp: new Date().toISOString(),
      note: 'REAL data from blockchain - NOT mocked!'
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      real: true
    }, { status: 500 });
  }
}
