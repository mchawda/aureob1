import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("FiatToken Contract", function () {
  let fiatToken: Contract;
  let complianceGate: Contract;
  let feeRouter: Contract;
  let owner: Signer;
  let minter: Signer;
  let burner: Signer;
  let pauser: Signer;
  let user1: Signer;
  let user2: Signer;

  beforeEach(async function () {
    [owner, minter, burner, pauser, user1, user2] = await ethers.getSigners();

    // Deploy ComplianceGate
    const ComplianceGate = await ethers.getContractFactory("ComplianceGate");
    complianceGate = await ComplianceGate.deploy(await owner.getAddress());
    await complianceGate.waitForDeployment();

    // Deploy FeeRouter
    const FeeRouter = await ethers.getContractFactory("FeeRouter");
    feeRouter = await FeeRouter.deploy(await owner.getAddress());
    await feeRouter.waitForDeployment();

    // Deploy FiatToken
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

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await fiatToken.name()).to.equal("USDx Token");
      expect(await fiatToken.symbol()).to.equal("USDx");
      expect(await fiatToken.decimals()).to.equal(2);
    });

    it("Should set the correct roles", async function () {
      expect(await fiatToken.minter()).to.equal(await minter.getAddress());
      expect(await fiatToken.burner()).to.equal(await burner.getAddress());
      expect(await fiatToken.pauser()).to.equal(await pauser.getAddress());
    });

    it("Should have zero initial supply", async function () {
      expect(await fiatToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref")))
        .to.emit(fiatToken, "Mint")
        .withArgs(user1Address, amount, ethers.formatBytes32String("test-ref"));

      expect(await fiatToken.balanceOf(user1Address)).to.equal(amount);
      expect(await fiatToken.totalSupply()).to.equal(amount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(user1).mint(user1Address, amount, ethers.formatBytes32String("test-ref")))
        .to.be.revertedWith("unauthorized");
    });

    it("Should not allow minting to zero address", async function () {
      const amount = ethers.parseEther("1000");

      await expect(fiatToken.connect(minter).mint(ethers.ZeroAddress, amount, ethers.formatBytes32String("test-ref")))
        .to.be.revertedWith("mint to zero address");
    });

    it("Should not allow minting zero amount", async function () {
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(minter).mint(user1Address, 0, ethers.formatBytes32String("test-ref")))
        .to.be.revertedWith("mint amount zero");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint some tokens first
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();
      await fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref"));
    });

    it("Should allow burner to burn tokens", async function () {
      const amount = ethers.parseEther("500");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(burner).burn(user1Address, amount, ethers.formatBytes32String("burn-ref")))
        .to.emit(fiatToken, "Burn")
        .withArgs(user1Address, amount, ethers.formatBytes32String("burn-ref"));

      expect(await fiatToken.balanceOf(user1Address)).to.equal(ethers.parseEther("500"));
      expect(await fiatToken.totalSupply()).to.equal(ethers.parseEther("500"));
    });

    it("Should not allow non-burner to burn tokens", async function () {
      const amount = ethers.parseEther("500");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(user1).burn(user1Address, amount, ethers.formatBytes32String("burn-ref")))
        .to.be.revertedWith("unauthorized");
    });

    it("Should not allow burning from zero address", async function () {
      const amount = ethers.parseEther("500");

      await expect(fiatToken.connect(burner).burn(ethers.ZeroAddress, amount, ethers.formatBytes32String("burn-ref")))
        .to.be.revertedWith("burn from zero address");
    });

    it("Should not allow burning more than balance", async function () {
      const amount = ethers.parseEther("1500");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(burner).burn(user1Address, amount, ethers.formatBytes32String("burn-ref")))
        .to.be.revertedWith("insufficient balance");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      // Mint some tokens first
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();
      await fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref"));
    });

    it("Should allow compliant transfers", async function () {
      const amount = ethers.parseEther("100");
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      // Whitelist user1 for transfers
      await complianceGate.connect(owner).whitelistAddress(user1Address);

      await expect(fiatToken.connect(user1).transfer(user2Address, amount))
        .to.emit(fiatToken, "Transfer")
        .withArgs(user1Address, user2Address, amount);

      expect(await fiatToken.balanceOf(user1Address)).to.equal(ethers.parseEther("900"));
      expect(await fiatToken.balanceOf(user2Address)).to.equal(amount);
    });

    it("Should not allow non-compliant transfers", async function () {
      const amount = ethers.parseEther("100");
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      // Blacklist user1
      await complianceGate.connect(owner).blacklistAddress(user1Address);

      await expect(fiatToken.connect(user1).transfer(user2Address, amount))
        .to.be.revertedWith("compliance fail");
    });

    it("Should not allow transfer to zero address", async function () {
      const amount = ethers.parseEther("100");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(user1).transfer(ethers.ZeroAddress, amount))
        .to.be.revertedWith("transfer to zero address");
    });

    it("Should not allow transfer of zero amount", async function () {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await expect(fiatToken.connect(user1).transfer(user2Address, 0))
        .to.be.revertedWith("transfer amount zero");
    });

    it("Should not allow transfer of more than balance", async function () {
      const amount = ethers.parseEther("1500");
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await expect(fiatToken.connect(user1).transfer(user2Address, amount))
        .to.be.revertedWith("insufficient balance");
    });
  });

  describe("Pausing", function () {
    it("Should allow pauser to pause", async function () {
      await expect(fiatToken.connect(pauser).pause())
        .to.not.be.reverted;

      expect(await fiatToken.paused()).to.be.true;
    });

    it("Should not allow non-pauser to pause", async function () {
      await expect(fiatToken.connect(user1).pause())
        .to.be.revertedWith("unauthorized");
    });

    it("Should not allow operations when paused", async function () {
      await fiatToken.connect(pauser).pause();

      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();

      await expect(fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref")))
        .to.be.revertedWith("paused");
    });

    it("Should allow pauser to unpause", async function () {
      await fiatToken.connect(pauser).pause();
      await fiatToken.connect(pauser).unpause();

      expect(await fiatToken.paused()).to.be.false;
    });
  });

  describe("Fee Integration", function () {
    beforeEach(async function () {
      // Mint some tokens first
      const amount = ethers.parseEther("1000");
      const user1Address = await user1.getAddress();
      await fiatToken.connect(minter).mint(user1Address, amount, ethers.formatBytes32String("test-ref"));
    });

    it("Should calculate fees correctly", async function () {
      const amount = ethers.parseEther("100");
      const user1Address = await user1.getAddress();

      const fee = await feeRouter.calculateFee(user1Address, amount);
      expect(fee).to.be.greaterThan(0);
    });

    it("Should apply fees during transfer", async function () {
      const amount = ethers.parseEther("100");
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      // Set user tier for fee calculation
      await feeRouter.connect(owner).setUserTier(user1Address, 1);

      const balanceBefore = await fiatToken.balanceOf(user1Address);
      
      await fiatToken.connect(user1).transfer(user2Address, amount);
      
      const balanceAfter = await fiatToken.balanceOf(user1Address);
      const expectedFee = await feeRouter.calculateFee(user1Address, amount);
      
      expect(balanceBefore - balanceAfter).to.equal(amount);
      expect(await fiatToken.balanceOf(user2Address)).to.equal(amount - expectedFee);
    });
  });
});
