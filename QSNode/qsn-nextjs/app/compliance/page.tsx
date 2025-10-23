'use client';

import { useState, useEffect } from 'react';

export default function ComplianceDashboard() {
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testAddress, setTestAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [activeNav, setActiveNav] = useState('compliance');

  useEffect(() => {
    fetchComplianceStatus();
  }, []);

  const fetchComplianceStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setComplianceData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
      setLoading(false);
    }
  };

  const checkCompliance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: testAddress })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCheckResult({
          address: data.address,
          kycStatus: data.summary.kycStatus,
          amlStatus: data.summary.amlStatus,
          allowlisted: data.checks.allowlist.allowed,
          blacklisted: !data.checks.allowlist.allowed,
          riskScore: data.summary.riskScore,
          jurisdiction: data.summary.jurisdiction,
          lastCheck: data.timestamp,
          real: data.real,
          checksPerformed: [
            { check: 'KYC Verification', status: data.checks.kyc.status, timestamp: data.checks.kyc.verifiedAt },
            { check: 'AML Screening', status: data.checks.aml.status, timestamp: data.checks.aml.lastScreening },
            { check: 'Sanctions List', status: data.checks.aml.sanctions === 'NONE' ? 'PASSED' : 'FAILED', timestamp: data.checks.aml.lastScreening },
            { check: 'PEP Screening', status: data.checks.pep.status, timestamp: data.checks.pep.lastCheck },
            { check: 'Adverse Media', status: data.checks.adverseMedia.status, timestamp: data.checks.adverseMedia.lastScan },
            { check: 'Allowlist Check', status: data.checks.allowlist.status, timestamp: data.checks.allowlist.timestamp },
          ],
          overall: data.summary.overall,
          contractAddress: data.contractAddress
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to check compliance:', error);
      setLoading(false);
    }
  };

  if (loading && !complianceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Compliance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white bg-opacity-10 backdrop-blur-xl border-r border-white border-opacity-20 p-6 flex flex-col">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-lg flex items-center justify-center border border-white border-opacity-30">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div>
              <div className="text-white font-bold">Aureo</div>
              <div className="text-blue-100 text-xs">Settlement</div>
            </div>
          </div>

          <nav className="space-y-4 flex-1">
            {[
              { id: 'home', label: 'Home', href: '/' },
              { id: 'compliance', label: 'Compliance', href: '/compliance' },
              { id: 'aml', label: 'AML/Sanctions', href: '#' },
              { id: 'kyc', label: 'KYC', href: '#' }
            ].map(item => (
              <a
                key={item.id}
                href={item.href}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all block ${
                  item.id === 'compliance'
                    ? 'bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 text-white'
                    : 'text-blue-100 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Live Status in Sidebar */}
          <div className="px-4 py-3 rounded-lg flex items-center space-x-2 backdrop-blur-lg border bg-green-500 bg-opacity-20 border-green-300">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-green-100">LIVE</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl pb-32">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-8 pt-8">
              <div className="flex items-center space-x-4">
                <a 
                  href="/"
                  className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </a>
                <div>
                  <h1 className="text-3xl font-bold text-white">Compliance Gate</h1>
                  <p className="text-blue-100 text-sm">Regulatory Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">OPERATIONAL</span>
              </div>
            </div>

            {/* Status Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatusCard
                icon={<CheckIcon />}
                label="KYC"
                value="Active"
                gradient="from-green-500 to-green-600"
              />
              <StatusCard
                icon={<ShieldIcon />}
                label="AML"
                value="Online"
                gradient="from-blue-500 to-blue-600"
              />
              <StatusCard
                icon={<ScaleIcon />}
                label="Sanctions"
                value="Active"
                gradient="from-purple-500 to-purple-600"
              />
              <StatusCard
                icon={<DocumentIcon />}
                label="Travel Rule"
                value="Ready"
                gradient="from-cyan-500 to-cyan-600"
              />
            </div>

            {/* Contract Info Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 mb-6 shadow-xl">
              <h2 className="text-white text-xl font-bold mb-4">ComplianceGate Contract</h2>
              <div className="bg-white bg-opacity-10 rounded-2xl p-4">
                <p className="text-blue-200 text-xs mb-1">Contract Address</p>
                <p className="text-white font-mono text-sm break-all">
                  {complianceData?.contracts?.complianceGate || 'Loading...'}
                </p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-200">
                  ✓ Verified & Deployed
                </div>
              </div>
            </div>

            {/* Compliance Checker */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 mb-6 shadow-xl">
              <h3 className="text-white text-xl font-bold mb-4">🔐 Real-Time Checker</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  placeholder="Enter address to check..."
                  className="w-full bg-white bg-opacity-10 border-2 border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:border-opacity-40"
                />
                
                <button
                  onClick={checkCompliance}
                  disabled={loading}
                  className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Check Compliance'}
                </button>
              </div>

              {checkResult && (
                <div className="mt-6 bg-white bg-opacity-10 rounded-2xl p-5">
                  {checkResult.real && (
                    <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 rounded-lg text-center">
                      <span className="text-white font-bold text-sm">
                        🔗 REAL BLOCKCHAIN DATA
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-blue-200 text-xs mb-1">KYC</p>
                      <p className="text-white font-bold text-sm">{checkResult.kycStatus}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs mb-1">AML</p>
                      <p className="text-white font-bold text-sm">{checkResult.amlStatus}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs mb-1">Risk</p>
                      <p className="text-white font-bold text-sm">{checkResult.riskScore}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white border-opacity-20 pt-4">
                    <p className="text-white text-sm font-semibold mb-3">Checks Performed:</p>
                    <div className="space-y-2">
                      {checkResult.checksPerformed.map((check: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-blue-200">{check.check}</span>
                          <span className={`font-semibold ${
                            check.status === 'PASSED' || check.status === 'VERIFIED' || check.status === 'CLEAR' 
                              ? 'text-green-300' 
                              : 'text-red-300'
                          }`}>
                            {check.status === 'PASSED' || check.status === 'VERIFIED' || check.status === 'CLEAR' ? '✓' : '✗'} {check.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-xl ${
                    checkResult.overall === 'COMPLIANT' 
                      ? 'bg-green-500 bg-opacity-20' 
                      : 'bg-red-500 bg-opacity-20'
                  }`}>
                    <p className={`text-sm font-bold ${
                      checkResult.overall === 'COMPLIANT' ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {checkResult.overall === 'COMPLIANT' 
                        ? '✓ Address is COMPLIANT - Transaction authorized' 
                        : '✗ Address is NON-COMPLIANT - Transaction blocked'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Compliance Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 shadow-xl">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔍</span>
                  Pre-Transaction
                </h3>
                <div className="space-y-3">
                  {[
                    'KYC Verification',
                    'Allowlist Validation',
                    'Blocklist Screening',
                    'Transaction Limits',
                    'Daily Limits'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white bg-opacity-10 rounded-xl p-3">
                      <span className="text-white text-sm">{item}</span>
                      <span className="text-green-300 text-xs font-semibold">ENABLED</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 shadow-xl">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">⚖️</span>
                  Regulatory
                </h3>
                <div className="space-y-3">
                  {[
                    'FinCEN Compliance',
                    'OFAC Sanctions',
                    'Travel Rule (FATF)',
                    'PEP Screening',
                    'Adverse Media Check'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white bg-opacity-10 rounded-xl p-3">
                      <span className="text-white text-sm">{item}</span>
                      <span className="text-blue-300 text-xs font-semibold">ACTIVE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status Card Component
function StatusCard({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white">{icon}</div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <p className="text-white text-sm font-medium mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

// Icons
function CheckIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
