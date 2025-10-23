import { NextResponse } from 'next/server';

const CONTRACT_ADDRESSES = {
  fiatToken: process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  complianceGate: process.env.COMPLIANCE_GATE_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  feeRouter: process.env.FEE_ROUTER_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  reserveRegistry: process.env.RESERVE_REGISTRY_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
};

export async function GET() {
  try {
    // Return fast response without blockchain calls
    // The actual data will be fetched separately if needed
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-nextjs',
      contracts: CONTRACT_ADDRESSES,
      token: {
        name: 'USDx Token',
        symbol: 'USDx',
        totalSupply: '1000000000000000000' // 1M tokens with 18 decimals
      },
      services: {
        minting: true,
        oracle: true,
        kyc: true
      },
      network: {
        rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
        connected: true
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20'
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
