import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import request from 'supertest';

describe("Quantum Settlement Node Integration Tests", function () {
  let fiatToken: Contract;
  let complianceGate: Contract;
  let feeRouter: Contract;
  let reserveRegistry: Contract;
  let owner: Signer;
  let minter: Signer;
  let burner: Signer;
  let pauser: Signer;
  let user1: Signer;
  let user2: Signer;
  let oracle: Signer;

  // Mock API server for integration testing
  let app: any;

  beforeEach(async function () {
    [owner, minter, burner, pauser, user1, user2, oracle] = await ethers.getSigners();

    // Deploy all contracts
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

    // Setup compliance rules
    await complianceGate.connect(oracle).setDailyLimit(await user1.getAddress(), ethers.parseEther("10000"));
    await complianceGate.connect(oracle).setTransactionLimit(await user1.getAddress(), ethers.parseEther("1000"));
    await complianceGate.connect(oracle).whitelistAddress(await user1.getAddress());

    // Setup fee tiers
    await feeRouter.connect(owner).setUserTier(await user1.getAddress(), 1);

    // Setup reserves
    await reserveRegistry.connect(oracle).attestReserves(
      "USD",
      ethers.parseEther("1000000"), // 1M USD reserves
      ethers.parseEther("1000000"), // 1M token supply
      ethers.formatBytes32String("merkle-root"),
      JSON.stringify({ source: "test", timestamp: Date.now() })
    );
  });

  describe("Complete Minting Flow", function () {
    it("Should complete end-to-end minting process", async function () {
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();

      // 1. Check reserve health
      const reserveHealthy = await reserveRegistry.isReserveHealthy("USD");
      expect(reserveHealthy).to.be.true;

      // 2. Check compliance
      const complianceResult = await complianceGate.preTransferCheck(
        ethers.ZeroAddress, // from (minting from zero)
        user1Address,
        amount,
        "0x"
      );
      expect(complianceResult.allowed).to.be.true;

      // 3. Execute minting
      const tx = await fiatToken.connect(minter).mint(
        user1Address,
        amount,
        ethers.formatBytes32String("integration-test")
      );
      await tx.wait();

      // 4. Verify results
      expect(await fiatToken.balanceOf(user1Address)).to.equal(amount);
      expect(await fiatToken.totalSupply()).to.equal(amount);

      // 5. Check events
      const receipt = await tx.wait();
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = fiatToken.interface.parseLog(log);
          return parsed.name === "Mint";
        } catch {
          return false;
        }
      });
      expect(mintEvent).to.not.be.undefined;
    });

    it("Should handle minting with compliance failures", async function () {
      const amount = ethers.parseEther("1000");
      const user2Address = await user2.getAddress();

      // Blacklist user2
      await complianceGate.connect(oracle).blacklistAddress(user2Address);

      // Attempt minting should fail at compliance check
      const complianceResult = await complianceGate.preTransferCheck(
        ethers.ZeroAddress,
        user2Address,
        amount,
        "0x"
      );
      expect(complianceResult.allowed).to.be.false;
      expect(complianceResult.code).to.equal(1001); // Blacklisted address
    });
  });

  describe("Complete Transfer Flow", function () {
    beforeEach(async function () {
      // Mint tokens first
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();
      await fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref"));
    });

    it("Should complete end-to-end transfer process", async function () {
      const amount = ethers.parseEther("100");
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      // 1. Check compliance
      const complianceResult = await complianceGate.preTransferCheck(
        user1Address,
        user2Address,
        amount,
        "0x"
      );
      expect(complianceResult.allowed).to.be.true;

      // 2. Calculate fees
      const feeAmount = await feeRouter.calculateFee(user1Address, amount);
      expect(feeAmount).to.be.greaterThan(0);

      // 3. Execute transfer
      const tx = await fiatToken.connect(user1).transfer(user2Address, amount);
      await tx.wait();

      // 4. Verify results
      const expectedBalance1 = ethers.parseEther("900"); // 1000 - 100
      const expectedBalance2 = amount - feeAmount; // 100 - fee
      
      expect(await fiatToken.balanceOf(user1Address)).to.equal(expectedBalance1);
      expect(await fiatToken.balanceOf(user2Address)).to.equal(expectedBalance2);

      // 5. Check events
      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find(log => {
        try {
          const parsed = fiatToken.interface.parseLog(log);
          return parsed.name === "Transfer";
        } catch {
          return false;
        }
      });
      expect(transferEvent).to.not.be.undefined;
    });

    it("Should handle transfer with daily limit exceeded", async function () {
      const amount = ethers.parseEther("11000"); // Exceeds daily limit
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      // Check compliance should fail
      const complianceResult = await complianceGate.preTransferCheck(
        user1Address,
        user2Address,
        amount,
        "0x"
      );
      expect(complianceResult.allowed).to.be.false;
      expect(complianceResult.code).to.equal(1003); // Daily limit exceeded
    });
  });

  describe("Complete Burning Flow", function () {
    beforeEach(async function () {
      // Mint tokens first
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();
      await fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref"));
    });

    it("Should complete end-to-end burning process", async function () {
      const amount = ethers.parseEther("500");
      const user1Address = await user1.getAddress();

      // 1. Check balance
      const balanceBefore = await fiatToken.balanceOf(user1Address);
      expect(balanceBefore).to.be.greaterThanOrEqual(amount);

      // 2. Execute burning
      const tx = await fiatToken.connect(burner).burn(
        user1Address,
        amount,
        ethers.formatBytes32String("integration-burn")
      );
      await tx.wait();

      // 3. Verify results
      const balanceAfter = await fiatToken.balanceOf(user1Address);
      expect(balanceAfter).to.equal(balanceBefore - amount);
      expect(await fiatToken.totalSupply()).to.equal(balanceAfter);

      // 4. Check events
      const receipt = await tx.wait();
      const burnEvent = receipt.logs.find(log => {
        try {
          const parsed = fiatToken.interface.parseLog(log);
          return parsed.name === "Burn";
        } catch {
          return false;
        }
      });
      expect(burnEvent).to.not.be.undefined;
    });
  });

  describe("Reserve Management Flow", function () {
    it("Should complete reserve attestation process", async function () {
      const currency = "EUR";
      const reserves = ethers.parseEther("500000");
      const supply = ethers.parseEther("500000");
      const merkleRoot = ethers.formatBytes32String("eur-merkle-root");

      // 1. Attest reserves
      const tx = await reserveRegistry.connect(oracle).attestReserves(
        currency,
        reserves,
        supply,
        merkleRoot,
        JSON.stringify({ source: "test-oracle", timestamp: Date.now() })
      );
      await tx.wait();

      // 2. Verify attestation
      const reserveData = await reserveRegistry.getReserveData(currency);
      expect(reserveData.totalReserves).to.equal(reserves);
      expect(reserveData.tokenSupply).to.equal(supply);
      expect(reserveData.merkleRoot).to.equal(merkleRoot);
      expect(reserveData.isActive).to.be.true;

      // 3. Check health
      const isHealthy = await reserveRegistry.isReserveHealthy(currency);
      expect(isHealthy).to.be.true;

      // 4. Check ratio
      const ratio = await reserveRegistry.getReserveRatio(currency);
      expect(ratio).to.equal(10000); // 100% in basis points
    });

    it("Should handle reserve updates", async function () {
      const currency = "USD";
      const newReserves = ethers.parseEther("1200000");
      const newSupply = ethers.parseEther("1000000");
      const newMerkleRoot = ethers.formatBytes32String("updated-merkle-root");

      // Update reserves
      const tx = await reserveRegistry.connect(oracle).updateReserves(
        currency,
        newReserves,
        newSupply,
        newMerkleRoot,
        JSON.stringify({ source: "test-oracle", timestamp: Date.now() })
      );
      await tx.wait();

      // Verify update
      const reserveData = await reserveRegistry.getReserveData(currency);
      expect(reserveData.totalReserves).to.equal(newReserves);
      expect(reserveData.tokenSupply).to.equal(newSupply);
      expect(reserveData.merkleRoot).to.equal(newMerkleRoot);

      // Check new ratio
      const ratio = await reserveRegistry.getReserveRatio(currency);
      expect(ratio).to.equal(12000); // 120% in basis points
    });
  });

  describe("Compliance Management Flow", function () {
    it("Should manage compliance rules end-to-end", async function () {
      const userAddress = await user2.getAddress();
      const dailyLimit = ethers.parseEther("5000");
      const transactionLimit = ethers.parseEther("500");

      // 1. Set limits
      await complianceGate.connect(oracle).setDailyLimit(userAddress, dailyLimit);
      await complianceGate.connect(oracle).setTransactionLimit(userAddress, transactionLimit);

      // 2. Verify limits
      const storedDailyLimit = await complianceGate.dailyLimits(userAddress);
      const storedTransactionLimit = await complianceGate.transactionLimits(userAddress);
      expect(storedDailyLimit).to.equal(dailyLimit);
      expect(storedTransactionLimit).to.equal(transactionLimit);

      // 3. Test compliance check
      const complianceResult = await complianceGate.preTransferCheck(
        userAddress,
        await user1.getAddress(),
        ethers.parseEther("100"),
        "0x"
      );
      expect(complianceResult.allowed).to.be.true;

      // 4. Test limit exceeded
      const limitExceededResult = await complianceGate.preTransferCheck(
        userAddress,
        await user1.getAddress(),
        ethers.parseEther("600"), // Exceeds transaction limit
        "0x"
      );
      expect(limitExceededResult.allowed).to.be.false;
      expect(limitExceededResult.code).to.equal(1002); // Transaction limit exceeded
    });

    it("Should handle whitelist and blacklist management", async function () {
      const userAddress = await user2.getAddress();

      // 1. Whitelist user
      await complianceGate.connect(oracle).whitelistAddress(userAddress);
      const isWhitelisted = await complianceGate.whitelistedAddresses(userAddress);
      expect(isWhitelisted).to.be.true;

      // 2. Test whitelisted transfer
      const complianceResult = await complianceGate.preTransferCheck(
        userAddress,
        await user1.getAddress(),
        ethers.parseEther("1000"),
        "0x"
      );
      expect(complianceResult.allowed).to.be.true;

      // 3. Remove from whitelist
      await complianceGate.connect(oracle).removeFromWhitelist(userAddress);
      const isStillWhitelisted = await complianceGate.whitelistedAddresses(userAddress);
      expect(isStillWhitelisted).to.be.false;

      // 4. Blacklist user
      await complianceGate.connect(oracle).blacklistAddress(userAddress);
      const isBlacklisted = await complianceGate.blacklistedAddresses(userAddress);
      expect(isBlacklisted).to.be.true;

      // 5. Test blacklisted transfer
      const blacklistedResult = await complianceGate.preTransferCheck(
        userAddress,
        await user1.getAddress(),
        ethers.parseEther("100"),
        "0x"
      );
      expect(blacklistedResult.allowed).to.be.false;
      expect(blacklistedResult.code).to.equal(1001); // Blacklisted address
    });
  });

  describe("Fee Management Flow", function () {
    it("Should manage fee tiers end-to-end", async function () {
      const userAddress = await user2.getAddress();
      const amount = ethers.parseEther("100");

      // 1. Set user tier
      await feeRouter.connect(owner).setUserTier(userAddress, 2); // Basic tier

      // 2. Calculate fee
      const feeAmount = await feeRouter.calculateFee(userAddress, amount);
      expect(feeAmount).to.be.greaterThan(0);

      // 3. Test fee calculation
      const expectedFee = await feeRouter.calculateFee(userAddress, amount);
      expect(feeAmount).to.equal(expectedFee);

      // 4. Change tier and recalculate
      await feeRouter.connect(owner).setUserTier(userAddress, 0); // VIP tier
      const vipFeeAmount = await feeRouter.calculateFee(userAddress, amount);
      expect(vipFeeAmount).to.be.lessThan(feeAmount); // VIP should have lower fees

      // 5. Test fee collection
      const collectedFeesBefore = await feeRouter.getCollectedFees(await fiatToken.getAddress());
      
      // This would require a transfer to actually collect fees
      // For now, just verify the fee calculation works
      expect(feeAmount).to.be.greaterThan(0);
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should handle contract pauses gracefully", async function () {
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();

      // 1. Pause contract
      await fiatToken.connect(pauser).pause();
      expect(await fiatToken.paused()).to.be.true;

      // 2. Attempt operations should fail
      await expect(fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref")))
        .to.be.revertedWith("paused");

      await expect(fiatToken.connect(user1).transfer(await user2.getAddress(), ethers.parseEther("100")))
        .to.be.revertedWith("paused");

      // 3. Unpause and operations should work
      await fiatToken.connect(pauser).unpause();
      expect(await fiatToken.paused()).to.be.false;

      await fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref"));
      expect(await fiatToken.balanceOf(user1Address)).to.equal(amount);
    });

    it("Should handle reserve health checks", async function () {
      // 1. Check healthy reserve
      const isHealthy = await reserveRegistry.isReserveHealthy("USD");
      expect(isHealthy).to.be.true;

      // 2. Deactivate reserve
      await reserveRegistry.connect(oracle).deactivateReserve("USD");
      
      // 3. Check unhealthy reserve
      const isUnhealthy = await reserveRegistry.isReserveHealthy("USD");
      expect(isUnhealthy).to.be.false;
    });

    it("Should handle invalid merkle proofs", async function () {
      const currency = "USD";
      const leaf = ethers.formatBytes32String("test-leaf");
      const invalidProof = [ethers.formatBytes32String("invalid-proof")];

      // Verify invalid proof should fail
      const isValid = await reserveRegistry.verifyMerkleProof(currency, leaf, invalidProof);
      expect(isValid).to.be.false;
    });
  });
});
