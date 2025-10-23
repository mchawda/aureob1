import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      minting: true,
      oracle: true,
      kyc: true
    }
  });
});

// Mock API endpoints
app.post('/api/v1/mint', (req, res) => {
  const { to, amount, currency } = req.body;
  
  if (!to || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.json({
    success: true,
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    offchainRef: 'ref-' + Date.now(),
    amount,
    currency,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/burn', (req, res) => {
  const { from, amount, currency } = req.body;
  
  if (!from || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.json({
    success: true,
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    offchainRef: 'ref-' + Date.now(),
    amount,
    currency,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/transfer', (req, res) => {
  const { from, to, amount, currency } = req.body;
  
  if (!from || !to || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.json({
    success: true,
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
    from,
    to,
    amount,
    currency,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/reserves/:currency', (req, res) => {
  const { currency } = req.params;
  
  res.json({
    currency,
    status: {
      healthy: true,
      ratio: 102.4,
      lastUpdate: Date.now(),
      issues: []
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/compliance/:address', (req, res) => {
  const { address } = req.params;
  
  res.json({
    address,
    compliance: {
      kycVerified: true,
      kycLevel: 'enhanced',
      riskScore: 25,
      sanctionsPassed: true,
      dailyLimit: '10000000000000000000000',
      transactionLimit: '1000000000000000000000',
      restrictions: [],
      lastCheck: Date.now()
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/fees/calculate', (req, res) => {
  const { user, amount, currency } = req.body;
  
  res.json({
    user,
    amount,
    currency,
    feeAmount: '1000000000000000000', // 1 token
    feeRate: 100, // 1%
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quantum Settlement Node API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/v1/`);
  console.log(`\n🎉 Quantum Settlement Node is now running!`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/v1/mint - Mint tokens`);
  console.log(`   POST /api/v1/burn - Burn tokens`);
  console.log(`   POST /api/v1/transfer - Transfer tokens`);
  console.log(`   GET  /api/v1/reserves/:currency - Get reserve status`);
  console.log(`   GET  /api/v1/compliance/:address - Get compliance status`);
  console.log(`   POST /api/v1/fees/calculate - Calculate fees`);
});

export default app;
