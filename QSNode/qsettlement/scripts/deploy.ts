import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Starting Quantum Settlement Node deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy contracts in order
  console.log("\n📋 Deploying ComplianceGate...");
  const ComplianceGate = await ethers.getContractFactory("ComplianceGate");
  const complianceGate = await ComplianceGate.deploy(deployer.address); // Oracle address
  await complianceGate.waitForDeployment();
  const complianceGateAddress = await complianceGate.getAddress();
  console.log("ComplianceGate deployed to:", complianceGateAddress);

  console.log("\n💰 Deploying FeeRouter...");
  const FeeRouter = await ethers.getContractFactory("FeeRouter");
  const feeRouter = await FeeRouter.deploy(deployer.address); // Treasury address
  await feeRouter.waitForDeployment();
  const feeRouterAddress = await feeRouter.getAddress();
  console.log("FeeRouter deployed to:", feeRouterAddress);

  console.log("\n🏦 Deploying ReserveRegistry...");
  const ReserveRegistry = await ethers.getContractFactory("ReserveRegistry");
  const reserveRegistry = await ReserveRegistry.deploy(deployer.address); // Oracle address
  await reserveRegistry.waitForDeployment();
  const reserveRegistryAddress = await reserveRegistry.getAddress();
  console.log("ReserveRegistry deployed to:", reserveRegistryAddress);

  console.log("\n🪙 Deploying FiatToken...");
  const FiatToken = await ethers.getContractFactory("FiatToken");
  const fiatToken = await FiatToken.deploy(
    deployer.address, // minter
    deployer.address, // burner
    deployer.address  // pauser
  );
  await fiatToken.waitForDeployment();
  const fiatTokenAddress = await fiatToken.getAddress();
  console.log("FiatToken deployed to:", fiatTokenAddress);

  // Configure contracts
  console.log("\n⚙️  Configuring contracts...");
  
  // Set compliance gate in FiatToken
  console.log("Setting compliance gate in FiatToken...");
  await fiatToken.setComplianceGate(complianceGateAddress);
  
  // Set fee router in FiatToken
  console.log("Setting fee router in FiatToken...");
  await fiatToken.setFeeRouter(feeRouterAddress);

  // Initialize some compliance rules
  console.log("Initializing compliance rules...");
  await complianceGate.setDailyLimit(deployer.address, ethers.parseEther("10000"));
  await complianceGate.setTransactionLimit(deployer.address, ethers.parseEther("1000"));

  // Initialize some fee tiers
  console.log("Initializing fee tiers...");
  await feeRouter.setUserTier(deployer.address, 1); // Standard tier

  // Deploy additional contracts if needed
  console.log("\n🔧 Deploying additional contracts...");
  
  // Deploy EURx token
  const EURxToken = await ethers.getContractFactory("FiatToken");
  const eurxToken = await EURxToken.deploy(
    deployer.address, // minter
    deployer.address, // burner
    deployer.address  // pauser
  );
  await eurxToken.waitForDeployment();
  const eurxTokenAddress = await eurxToken.getAddress();
  console.log("EURx Token deployed to:", eurxTokenAddress);

  // Configure EURx token
  await eurxToken.setComplianceGate(complianceGateAddress);
  await eurxToken.setFeeRouter(feeRouterAddress);

  // Deploy GBPx token
  const GBPxToken = await ethers.getContractFactory("FiatToken");
  const gbpxToken = await GBPxToken.deploy(
    deployer.address, // minter
    deployer.address, // burner
    deployer.address  // pauser
  );
  await gbpxToken.waitForDeployment();
  const gbpxTokenAddress = await gbpxToken.getAddress();
  console.log("GBPx Token deployed to:", gbpxTokenAddress);

  // Configure GBPx token
  await gbpxToken.setComplianceGate(complianceGateAddress);
  await gbpxToken.setFeeRouter(feeRouterAddress);

  // Save deployment information
  const deploymentInfo = {
    network: await deployer.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FiatToken: fiatTokenAddress,
      EURxToken: eurxTokenAddress,
      GBPxToken: gbpxTokenAddress,
      ComplianceGate: complianceGateAddress,
      FeeRouter: feeRouterAddress,
      ReserveRegistry: reserveRegistryAddress,
    },
    configuration: {
      complianceGate: complianceGateAddress,
      feeRouter: feeRouterAddress,
      reserveRegistry: reserveRegistryAddress,
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log("======================");
  console.log("Network:", deploymentInfo.network.name, "(", deploymentInfo.network.chainId, ")");
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Timestamp:", deploymentInfo.timestamp);
  console.log("\nContract Addresses:");
  console.log("USDx Token:", deploymentInfo.contracts.FiatToken);
  console.log("EURx Token:", deploymentInfo.contracts.EURxToken);
  console.log("GBPx Token:", deploymentInfo.contracts.GBPxToken);
  console.log("ComplianceGate:", deploymentInfo.contracts.ComplianceGate);
  console.log("FeeRouter:", deploymentInfo.contracts.FeeRouter);
  console.log("ReserveRegistry:", deploymentInfo.contracts.ReserveRegistry);

  // Verify contracts if on a supported network
  if (process.env.VERIFY_CONTRACTS === "true") {
    console.log("\n🔍 Verifying contracts...");
    try {
      await verifyContract(complianceGateAddress, [deployer.address]);
      await verifyContract(feeRouterAddress, [deployer.address]);
      await verifyContract(reserveRegistryAddress, [deployer.address]);
      await verifyContract(fiatTokenAddress, [deployer.address, deployer.address, deployer.address]);
      await verifyContract(eurxTokenAddress, [deployer.address, deployer.address, deployer.address]);
      await verifyContract(gbpxTokenAddress, [deployer.address, deployer.address, deployer.address]);
      console.log("✅ All contracts verified successfully!");
    } catch (error) {
      console.log("❌ Contract verification failed:", error);
    }
  }

  console.log("\n🎉 Quantum Settlement Node deployment completed!");
  console.log("\nNext steps:");
  console.log("1. Update environment variables with contract addresses");
  console.log("2. Start the API server: npm run dev");
  console.log("3. Initialize reserve attestations");
  console.log("4. Configure external oracles");
  console.log("5. Set up monitoring and alerts");

  return deploymentInfo;
}

async function verifyContract(address: string, constructorArgs: any[] = []) {
  console.log(`Verifying contract at ${address}...`);
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ Contract verified: ${address}`);
  } catch (error) {
    console.log(`❌ Verification failed for ${address}:`, error);
  }
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
