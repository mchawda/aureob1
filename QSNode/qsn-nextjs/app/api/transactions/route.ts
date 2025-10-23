import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

const FiatTokenABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
];

const CONTRACT_ADDRESS = process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address parameter' },
        { status: 400 }
      );
    }

    const fiatToken = new ethers.Contract(CONTRACT_ADDRESS, FiatTokenABI, provider);

    // Get current block number for range
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 5000); // Look back max 5000 blocks

    // Fetch transfer events
    const transferFilter = fiatToken.filters.Transfer(address, null);
    const receivedEvents = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: transferFilter.topics,
      fromBlock,
      toBlock: 'latest'
    });

    const transferFilterOut = fiatToken.filters.Transfer(null, address);
    const sentEvents = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: transferFilterOut.topics,
      fromBlock,
      toBlock: 'latest'
    });

    // Combine and sort events
    const allEvents = [...receivedEvents, ...sentEvents];
    
    // Parse events
    const transactions = await Promise.all(
      allEvents.map(async (log) => {
        try {
          const block = await provider.getBlock(log.blockNumber);
          const iface = new ethers.Interface(FiatTokenABI);
          const parsed = iface.parseLog(log);
          
          if (!parsed) return null;

          const value = parsed.args[2];
          const formattedValue = ethers.formatEther(value);
          const from = parsed.args[0];
          const to = parsed.args[1];
          const isIncoming = to.toLowerCase() === address.toLowerCase();

          return {
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: block?.timestamp ? new Date(block.timestamp * 1000).toISOString() : null,
            from,
            to,
            value: formattedValue,
            type: isIncoming ? 'receive' : 'send',
            icon: isIncoming ? '📥' : '📤',
            status: 'confirmed',
          };
        } catch (err) {
          console.error('Error parsing event:', err);
          return null;
        }
      })
    );

    // Filter out nulls and sort by block number (newest first)
    const validTransactions = transactions
      .filter(tx => tx !== null)
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);

    return NextResponse.json({
      real: true,
      address,
      transactions: validTransactions,
      total: validTransactions.length,
      currentBlock,
      searchRange: { fromBlock, toBlock: 'latest' },
      timestamp: new Date().toISOString(),
      note: 'Real blockchain transaction history from Transfer events',
    });
  } catch (error: any) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json(
      {
        error: error.message,
        real: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
