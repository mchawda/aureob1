import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { QSNIntegrationService } from "../services/integration/qsn-integration";

describe("QSN Integration Tests", function () {
  let integrationService: QSNIntegrationService;
  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Wallet;
  let owner: Signer;
  let minter: Signer;
  let burner: Signer;
  let pauser: Signer;
  let user1: Signer;
  let user2: Signer;
  let oracle: Signer;

  // QSN Contracts
  let fiatToken: Contract;
  let complianceGate: Contract;
  let feeRouter: Contract;
  let reserveRegistry: Contract;

  beforeEach(async function () {
    [owner, minter, burner, pauser, user1, user2, oracle] = await ethers.getSigners();
    
    provider = new ethers.JsonRpcProvider("http://localhost:8545");
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    
    integrationService = new QSNIntegrationService(provider, wallet);

    // Deploy QSN contracts
    const ComplianceGate = await ethers.getContractFactory("ComplianceGate");
    complianceGate = await ComplianceGate.deploy(await oracle.getAddress());
    await complianceGate.waitForDeployment();

    const FeeRouter = await ethers.getContractFactory("FeeRouter");
    feeRouter = await FeeRouter.deploy(await owner.getAddress());
    await feeRouter.waitForDeployment();

    const ReserveRegistry = await ethers.getContractFactory("ReserveRegistry");
    reserveRegistry = await ReserveRegistry.deploy(await oracle.getAddress());
    await reserveRegistry.waitForDeployment();

    const FiatToken = await ethers.getContractFactory("FiatToken");
    fiatToken = await FiatToken.deploy(
      await minter.getAddress(),
      await burner.getAddress(),
      await pauser.getAddress()
    );
    await fiatToken.waitForDeployment();

    // Configure contracts
    await fiatToken.setComplianceGate(await complianceGate.getAddress());
    await fiatToken.setFeeRouter(await feeRouter.getAddress());
  });

  describe("QStable Integration", function () {
    it("Should initialize QStable contracts", async function () {
      const qstableContracts = {
        usdToken: "0x1234567890123456789012345678901234567890",
        eurToken: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        gbpToken: "0x9876543210987654321098765432109876543210",
        vaultManager: "0x1111111111111111111111111111111111111111",
        yieldFarm: "0x2222222222222222222222222222222222222222"
      };

      await integrationService.qstableIntegration.initializeQStableContracts(qstableContracts);
      
      // Verify contracts are initialized
      expect(integrationService.qstableIntegration.qstableContracts.size).to.equal(4);
      expect(integrationService.qstableIntegration.qstableContracts.has('USD')).to.be.true;
      expect(integrationService.qstableIntegration.qstableContracts.has('EUR')).to.be.true;
      expect(integrationService.qstableIntegration.qstableContracts.has('GBP')).to.be.true;
      expect(integrationService.qstableIntegration.qstableContracts.has('VaultManager')).to.be.true;
    });

    it("Should sync balances between QStable and QSN", async function () {
      // Mock QStable contract responses
      const mockQStableContract = {
        totalSupply: () => Promise.resolve(ethers.parseEther("1000"))
      };

      // Replace the contract with mock
      integrationService.qstableIntegration.qstableContracts.set('USD', mockQStableContract as any);

      // Mint tokens in QSN
      await fiatToken.connect(minter).mint(
        await user1.getAddress(),
        ethers.parseEther("1000"),
        ethers.formatBytes32String("test-sync")
      );

      const syncResult = await integrationService.qstableIntegration.syncBalances(fiatToken, 'USD');
      
      expect(syncResult.qstableSupply).to.equal(ethers.parseEther("1000").toString());
      expect(syncResult.qsnSupply).to.equal(ethers.parseEther("1000").toString());
      expect(syncResult.synced).to.be.true;
    });

    it("Should create QSN vault in QStable", async function () {
      const assets = [
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      ];

      // Mock vault creation
      const mockVaultManager = {
        createVault: () => Promise.resolve({
          wait: () => Promise.resolve({
            logs: [{
              topics: ["0x" + "VaultCreated".padEnd(64, "0")],
              data: "0x" + "0x3333333333333333333333333333333333333333".slice(2)
            }]
          })
        }),
        interface: {
          parseLog: (log: any) => ({
            name: 'VaultCreated',
            args: { vault: '0x3333333333333333333333333333333333333333' }
          })
        }
      };

      integrationService.qstableIntegration.qstableContracts.set('VaultManager', mockVaultManager as any);

      const vaultAddress = await integrationService.qstableIntegration.createQSNVault(assets);
      
      expect(vaultAddress).to.equal('0x3333333333333333333333333333333333333333');
    });
  });

  describe("QSmart Integration", function () {
    it("Should initialize QSmart connection", async function () {
      // Mock QSmart RPC response
      const mockProvider = {
        getNetwork: () => Promise.resolve({ name: 'qsmart-testnet', chainId: 1001 }),
        getBlockNumber: () => Promise.resolve(12345)
      };

      // Replace provider with mock
      integrationService.qsmartIntegration.provider = mockProvider as any;

      const connectionResult = await integrationService.qsmartIntegration.initializeQSmartConnection('http://localhost:26657');
      
      expect(connectionResult.network).to.equal('qsmart-testnet');
      expect(connectionResult.chainId).to.equal('1001');
      expect(connectionResult.latestBlock).to.equal(12345);
      expect(connectionResult.connected).to.be.true;
    });

    it("Should generate quantum signatures", async function () {
      const message = "Test quantum signature message";
      
      const signature = await integrationService.qsmartIntegration.generateQuantumSignature(message);
      
      expect(signature).to.match(/^0x[a-fA-F0-9]+$/);
      expect(signature.length).to.be.greaterThan(100); // Quantum signatures are large
    });

    it("Should verify quantum signatures", async function () {
      const message = "Test quantum signature verification";
      
      const signature = await integrationService.qsmartIntegration.generateQuantumSignature(message);
      const isValid = await integrationService.qsmartIntegration.verifyQuantumSignature(message, signature, "");
      
      expect(isValid).to.be.true;
    });

    it("Should sync QSN state with QSmart", async function () {
      // Mint some tokens first
      await fiatToken.connect(minter).mint(
        await user1.getAddress(),
        ethers.parseEther("1000"),
        ethers.formatBytes32String("test-state-sync")
      );

      const stateSync = await integrationService.qsmartIntegration.syncQSNState(fiatToken);
      
      expect(stateSync.stateHash).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(stateSync.quantumSignature).to.match(/^0x[a-fA-F0-9]+$/);
      expect(stateSync.stateData.totalSupply).to.equal(ethers.parseEther("1000").toString());
      expect(stateSync.stateData.paused).to.be.false;
    });
  });

  describe("Full Integration Service", function () {
    it("Should initialize all integrations", async function () {
      const config = {
        qstableContracts: {
          usdToken: "0x1234567890123456789012345678901234567890",
          eurToken: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          gbpToken: "0x9876543210987654321098765432109876543210",
          vaultManager: "0x1111111111111111111111111111111111111111",
          yieldFarm: "0x2222222222222222222222222222222222222222"
        },
        qsmartRpcUrl: "http://localhost:26657"
      };

      // Mock QSmart connection
      const mockProvider = {
        getNetwork: () => Promise.resolve({ name: 'qsmart-testnet', chainId: 1001 }),
        getBlockNumber: () => Promise.resolve(12345)
      };
      integrationService.qsmartIntegration.provider = mockProvider as any;

      const result = await integrationService.initializeAllIntegrations(config);
      
      expect(result).to.be.true;
    });

    it("Should perform full system sync", async function () {
      // Setup mock contracts
      const mockQStableContract = {
        totalSupply: () => Promise.resolve(ethers.parseEther("1000"))
      };

      integrationService.qstableIntegration.qstableContracts.set('USD', mockQStableContract as any);
      integrationService.qstableIntegration.qstableContracts.set('EUR', mockQStableContract as any);
      integrationService.qstableIntegration.qstableContracts.set('GBP', mockQStableContract as any);

      // Mint tokens in QSN
      await fiatToken.connect(minter).mint(
        await user1.getAddress(),
        ethers.parseEther("1000"),
        ethers.formatBytes32String("test-full-sync")
      );

      const qsnContracts = new Map();
      qsnContracts.set('USD', fiatToken);
      qsnContracts.set('EUR', fiatToken);
      qsnContracts.set('GBP', fiatToken);

      const syncResult = await integrationService.performFullSync(qsnContracts);
      
      expect(syncResult.balanceSync).to.have.length(3);
      expect(syncResult.balanceSync[0].currency).to.equal('USD');
      expect(syncResult.balanceSync[0].synced).to.be.true;
      expect(syncResult.stateSync.stateHash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it("Should get integration status", async function () {
      // Setup some contracts
      integrationService.qstableIntegration.qstableContracts.set('USD', {} as any);
      integrationService.qstableIntegration.qstableContracts.set('EUR', {} as any);

      // Mock QSmart connection
      const mockProvider = {
        getNetwork: () => Promise.resolve({ name: 'qsmart-testnet', chainId: 1001 }),
        getBlockNumber: () => Promise.resolve(12345)
      };
      integrationService.qsmartIntegration.provider = mockProvider as any;

      const status = await integrationService.getIntegrationStatus();
      
      expect(status.qstable.initialized).to.be.true;
      expect(status.qstable.contracts).to.include('USD');
      expect(status.qstable.contracts).to.include('EUR');
      expect(status.qsmart.connected).to.be.true;
      expect(status.qsmart.network).to.equal('qsmart-testnet');
      expect(status.quantum.keysGenerated).to.be.true;
      expect(status.quantum.signatureScheme).to.equal('dilithium2');
    });
  });

  describe("Error Handling", function () {
    it("Should handle QStable connection errors", async function () {
      // Test with invalid contract addresses
      const invalidContracts = {
        usdToken: "invalid-address",
        eurToken: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        gbpToken: "0x9876543210987654321098765432109876543210",
        vaultManager: "0x1111111111111111111111111111111111111111",
        yieldFarm: "0x2222222222222222222222222222222222222222"
      };

      try {
        await integrationService.qstableIntegration.initializeQStableContracts(invalidContracts);
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });

    it("Should handle QSmart connection errors", async function () {
      try {
        await integrationService.qsmartIntegration.initializeQSmartConnection('http://invalid-url');
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });

    it("Should handle quantum signature errors", async function () {
      try {
        await integrationService.qsmartIntegration.verifyQuantumSignature(
          "test message",
          "invalid-signature",
          "invalid-public-key"
        );
        // Should return false for invalid signature
        expect.fail('Should have returned false');
      } catch (error) {
        // Expected to throw error for invalid inputs
        expect(error).to.be.an('error');
      }
    });
  });
});
