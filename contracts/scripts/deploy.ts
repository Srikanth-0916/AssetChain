import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy Mock USDC (for testnet simulation)
  const MockUSDC = await ethers.getContractFactory("AssetToken"); // Reusing ERC20 template
  const usdc = await MockUSDC.deploy(
    "USD Coin",
    "USDC",
    ethers.parseUnits("1000000000", 6),
    0,
    deployer.address,
    deployer.address
  );
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // 2. Deploy Treasury
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(usdcAddress, deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  // 3. Deploy AssetTokenFactory
  const Factory = await ethers.getContractFactory("AssetTokenFactory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("AssetTokenFactory deployed to:", factoryAddress);

  // 4. Deploy AssetRegistry
  const Registry = await ethers.getContractFactory("AssetRegistry");
  const registry = await Registry.deploy(deployer.address, factoryAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("AssetRegistry deployed to:", registryAddress);

  // Grant DEPLOYER_ROLE on Factory to Registry
  const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
  await factory.grantRole(DEPLOYER_ROLE, registryAddress);
  console.log("Granted DEPLOYER_ROLE on Factory to Registry");

  // 5. Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    usdcAddress,
    treasuryAddress,
    250, // 2.5% platform fee
    deployer.address
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // 6. Deploy Governance
  const Governance = await ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(deployer.address);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("Governance deployed to:", governanceAddress);

  console.log("\n Deployment Summary:");
  console.log("==========================================");
  console.log("USDC:", usdcAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("AssetTokenFactory:", factoryAddress);
  console.log("AssetRegistry:", registryAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("Governance:", governanceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
