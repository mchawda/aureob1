import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const CONTRACT_ADDRESS = process.env.FIAT_TOKEN_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

const FiatTokenABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
];

// Store active WebSocket connections
const clients = new Set<WebSocket>();

export async function GET(request: NextRequest) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return NextResponse.json({ error: 'WebSocket required' }, { status: 400 });
  }

  try {
    // In production, use a proper WebSocket library like ws
    // This is a simplified example for Node.js upgrade
    const { socket, head } = (request as any).socket;
    
    // Create WebSocket connection
    const ws = new WebSocket(`ws://localhost:${process.env.WS_PORT || 8080}`);
    
    ws.on('open', async () => {
      clients.add(ws);
      
      // Send initial data
      const fiatToken = new ethers.Contract(
        CONTRACT_ADDRESS,
        FiatTokenABI,
        provider
      );
      
      try {
        const totalSupply = await fiatToken.totalSupply();
        ws.send(JSON.stringify({
          type: 'initial',
          totalSupply: ethers.formatEther(totalSupply),
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    });

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'subscribe') {
          const { address } = message;
          
          // Fetch and send balance
          const fiatToken = new ethers.Contract(
            CONTRACT_ADDRESS,
            FiatTokenABI,
            provider
          );
          
          const balance = await fiatToken.balanceOf(address);
          ws.send(JSON.stringify({
            type: 'balance_update',
            address,
            balance: ethers.formatEther(balance),
            timestamp: new Date().toISOString(),
          }));
          
          // Setup listener for Transfer events
          const filter = fiatToken.filters.Transfer(address, null);
          provider.on(filter, (log) => {
            // Broadcast to all clients
            const updateData = JSON.stringify({
              type: 'transaction',
              address,
              event: 'transfer_in',
              timestamp: new Date().toISOString(),
            });
            
            clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(updateData);
              }
            });
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    return new Response(null, {
      status: 101,
      statusText: 'Switching Protocols',
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
      },
    });
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return NextResponse.json({ error: 'WebSocket upgrade failed' }, { status: 500 });
  }
}
