import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

const ReserveRegistryABI = [
  'function getReserveData(string calldata currency) external view returns (tuple(uint256 totalReserves, uint256 tokenSupply, uint256 lastAttestationTime, bytes32 merkleRoot, bool isActive, string metadata))',
  'function getReserveRatio(string calldata currency) external view returns (uint256)',
  'function isReserveHealthy(string calldata currency) external view returns (bool)',
];

const RESERVE_REGISTRY_ADDRESS = process.env.RESERVE_REGISTRY_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const CURRENCY = 'USD'; // Default currency for fiat backing

export async function GET() {
  try {
    const reserveRegistry = new ethers.Contract(
      RESERVE_REGISTRY_ADDRESS,
      ReserveRegistryABI,
      provider
    );

    // Get reserve data for USD
    const reserveData = await reserveRegistry.getReserveData(CURRENCY);
    const isHealthy = await reserveRegistry.isReserveHealthy(CURRENCY);
    const ratio = await reserveRegistry.getReserveRatio(CURRENCY);

    const totalReserves = typeof reserveData.totalReserves === 'bigint' 
      ? Number(reserveData.totalReserves) / 1e18
      : parseFloat(ethers.formatEther(reserveData.totalReserves));
    
    const tokenSupply = typeof reserveData.tokenSupply === 'bigint'
      ? Number(reserveData.tokenSupply) / 1e18
      : parseFloat(ethers.formatEther(reserveData.tokenSupply));

    const reserveRatio = Number(ratio) / 100; // Convert basis points to percentage

    return NextResponse.json({
      real: true,
      currency: CURRENCY,
      reserves: {
        totalReserves: parseFloat(totalReserves.toFixed(2)),
        tokenSupply: parseFloat(tokenSupply.toFixed(2)),
        reserveRatio: parseFloat(reserveRatio.toFixed(2)),
        isActive: reserveData.isActive,
        isHealthy,
        lastAttestationTime: new Date(Number(reserveData.lastAttestationTime) * 1000).toISOString(),
      },
      parity: {
        issued: parseFloat(tokenSupply.toFixed(2)),
        backed: parseFloat(totalReserves.toFixed(2)),
        percentage: parseFloat(((totalReserves / tokenSupply) * 100).toFixed(2)),
        verified: reserveData.isActive && isHealthy,
      },
      timestamp: new Date().toISOString(),
      note: 'Real blockchain data from ReserveRegistry smart contract',
    });
  } catch (error: any) {
    console.error('Reserve data fetch error:', error);
    return NextResponse.json({
      error: error.message,
      real: false,
      fallback: true,
      timestamp: new Date().toISOString(),
      note: 'Failed to fetch real reserve data, returning error',
    }, { status: 500 });
  }
}
