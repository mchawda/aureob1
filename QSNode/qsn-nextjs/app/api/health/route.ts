import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

const FiatTokenABI = [
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
];

const CONTRACT_ADDRESSES = {
  fiatToken: process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  complianceGate: process.env.COMPLIANCE_GATE_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  feeRouter: process.env.FEE_ROUTER_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  reserveRegistry: process.env.RESERVE_REGISTRY_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
};

export async function GET() {
  try {
    const fiatToken = new ethers.Contract(CONTRACT_ADDRESSES.fiatToken, FiatTokenABI, provider);
    
    const totalSupply = await fiatToken.totalSupply();
    const name = await fiatToken.name();
    const symbol = await fiatToken.symbol();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-nextjs',
      contracts: CONTRACT_ADDRESSES,
      token: {
        name,
        symbol,
        totalSupply: totalSupply.toString()
      },
      services: {
        minting: true,
        oracle: true,
        kyc: true
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
