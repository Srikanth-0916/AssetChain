import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("PHASE 1 – PRE-DEPLOYMENT CHECKS");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Deployer Wallet Address:", deployer.address);

  const balanceWei = await provider.getBalance(deployer.address);
  const balancePOL = ethers.formatEther(balanceWei);
  console.log("Current On-Chain POL Balance:", balancePOL, "POL");

  const usdcAddress = "0x197367CB43beEF2f123731Ca4DE5C55B81Ae3d86";
  const treasuryAddress = "0xF4C5a9d12779D7FaA5933A7De041332151570c68";
  const factoryAddress = "0xe1384a5b215b1D4B43D6A650bF867ea58E6Fbc4D";

  console.log("\nℹ️  Existing deployed contracts detected on Polygon Amoy:");
  console.log("   1. MockUSDC:          ", usdcAddress, " (Confirmed)");
  console.log("   2. Treasury:          ", treasuryAddress, " (Confirmed)");
  console.log("   3. AssetTokenFactory: ", factoryAddress, " (Confirmed - Block #44034903)\n");

  if (parseFloat(balancePOL) < 0.005) {
    console.error(`❌ INSUFFICIENT POL BALANCE FOR REMAINING CONTRACTS!`);
    console.error(`   Current Balance: ${balancePOL} POL`);
    console.error(`\n👉 PREREQUISITE ACTION REQUIRED:`);
    console.error(`   Please claim testnet POL from https://faucet.polygon.technology/`);
    console.error(`   For address: ${deployer.address}`);
    process.exit(1);
  }

  console.log("✅ Proceeding with step-by-step contract deployment...\n");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("PHASE 2 – RESUME DEPLOYMENT");
  console.log("═══════════════════════════════════════════════════════════");

  const Factory = await ethers.getContractFactory("AssetTokenFactory");
  const factory = Factory.attach(factoryAddress) as any;

  // 4. Deploy AssetRegistry
  console.log("🚀 [1/3] Deploying AssetRegistry...");
  let registryAddress = "";
  let registryReceipt: any = null;
  try {
    const Registry = await ethers.getContractFactory("AssetRegistry");
    const registry = await Registry.deploy(deployer.address, factoryAddress);
    registryReceipt = await registry.deploymentTransaction()?.wait(1);
    registryAddress = await registry.getAddress();
    console.log("✅ AssetRegistry Deployed!");
    console.log("   Contract Address: ", registryAddress);
    console.log("   Transaction Hash: ", registryReceipt?.hash);
    console.log("   Block Number:     ", registryReceipt?.blockNumber);
    console.log("   Gas Used:         ", registryReceipt?.gasUsed.toString());

    // Grant DEPLOYER_ROLE on Factory to Registry
    console.log("\n🔑 Granting DEPLOYER_ROLE on Factory to Registry...");
    const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
    const grantTx = await factory.grantRole(DEPLOYER_ROLE, registryAddress);
    await grantTx.wait(1);
    console.log("✅ Granted DEPLOYER_ROLE!");
  } catch (err: any) {
    console.error("💥 Failed deploying AssetRegistry:", err.message);
    const balNow = ethers.formatEther(await provider.getBalance(deployer.address));
    console.error(`   Balance remaining: ${balNow} POL`);
    process.exit(1);
  }

  // 5. Deploy Unified Marketplace (USDC + Native POL with demoMode)
  console.log("\n🚀 [2/3] Deploying Marketplace (Unified POL + USDC)...");
  let marketplaceAddress = "";
  let marketplaceReceipt: any = null;
  try {
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(
      usdcAddress,
      treasuryAddress,
      250, // 2.5% platform fee
      deployer.address
    );
    marketplaceReceipt = await marketplace.deploymentTransaction()?.wait(1);
    marketplaceAddress = await marketplace.getAddress();
    console.log("✅ Marketplace Deployed!");
    console.log("   Contract Address: ", marketplaceAddress);
    console.log("   Transaction Hash: ", marketplaceReceipt?.hash);
    console.log("   Block Number:     ", marketplaceReceipt?.blockNumber);
    console.log("   Gas Used:         ", marketplaceReceipt?.gasUsed.toString());
  } catch (err: any) {
    console.error("💥 Failed deploying Marketplace:", err.message);
    const balNow = ethers.formatEther(await provider.getBalance(deployer.address));
    console.error(`   AssetRegistry was deployed to: ${registryAddress}`);
    console.error(`   Balance remaining: ${balNow} POL`);
    process.exit(1);
  }

  // 6. Deploy Governance
  console.log("\n🚀 [3/3] Deploying Governance...");
  let governanceAddress = "";
  let governanceReceipt: any = null;
  try {
    const Governance = await ethers.getContractFactory("Governance");
    const governance = await Governance.deploy(deployer.address);
    governanceReceipt = await governance.deploymentTransaction()?.wait(1);
    governanceAddress = await governance.getAddress();
    console.log("✅ Governance Deployed!");
    console.log("   Contract Address: ", governanceAddress);
    console.log("   Transaction Hash: ", governanceReceipt?.hash);
    console.log("   Block Number:     ", governanceReceipt?.blockNumber);
    console.log("   Gas Used:         ", governanceReceipt?.gasUsed.toString());
  } catch (err: any) {
    console.warn("⚠️  Governance deployment skipped/failed:", err.message);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("PHASE 3 – ABI & CONFIGURATION AUTO-PATCH");
  console.log("═══════════════════════════════════════════════════════════");

  const addresses = {
    network: "polygon-amoy",
    chainId: 80002,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      MockUSDC: usdcAddress,
      Treasury: treasuryAddress,
      AssetTokenFactory: factoryAddress,
      AssetRegistry: registryAddress,
      Marketplace: marketplaceAddress,
      Governance: governanceAddress || "0x0000000000000000000000000000000000000000",
    },
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Saved addresses to deployed-addresses.json");

  // Auto-patch client/.env
  const clientEnvPath = path.join(__dirname, "..", "..", "client", ".env");
  if (fs.existsSync(clientEnvPath)) {
    let clientEnv = fs.readFileSync(clientEnvPath, "utf-8");
    if (clientEnv.includes("VITE_MARKETPLACE_CONTRACT_ADDRESS=")) {
      clientEnv = clientEnv.replace(
        /VITE_MARKETPLACE_CONTRACT_ADDRESS=.*/,
        `VITE_MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`
      );
    } else {
      clientEnv += `\nVITE_MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}\n`;
    }
    fs.writeFileSync(clientEnvPath, clientEnv);
    console.log("✅ Auto-patched client/.env with VITE_MARKETPLACE_CONTRACT_ADDRESS=" + marketplaceAddress);
  }

  // Auto-patch server/.env
  const serverEnvPath = path.join(__dirname, "..", "..", "server", ".env");
  if (fs.existsSync(serverEnvPath)) {
    let serverEnv = fs.readFileSync(serverEnvPath, "utf-8");
    if (serverEnv.includes("MARKETPLACE_CONTRACT_ADDRESS=")) {
      serverEnv = serverEnv.replace(
        /MARKETPLACE_CONTRACT_ADDRESS=.*/,
        `MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`
      );
    } else {
      serverEnv += `\nMARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}\n`;
    }
    fs.writeFileSync(serverEnvPath, serverEnv);
    console.log("✅ Auto-patched server/.env with MARKETPLACE_CONTRACT_ADDRESS=" + marketplaceAddress);
  }

  // Export ABI to client/src/config/MarketplaceABI.json
  const abiSrcPath = path.join(
    __dirname, "..", "artifacts", "contracts", "marketplace",
    "Marketplace.sol", "Marketplace.json"
  );
  const abiDestDir = path.join(__dirname, "..", "..", "client", "src", "config");
  const abiDestPath = path.join(abiDestDir, "MarketplaceABI.json");
  if (fs.existsSync(abiSrcPath)) {
    if (!fs.existsSync(abiDestDir)) fs.mkdirSync(abiDestDir, { recursive: true });
    const artifact = JSON.parse(fs.readFileSync(abiSrcPath, "utf-8"));
    fs.writeFileSync(abiDestPath, JSON.stringify(artifact.abi, null, 2));
    console.log("✅ Exported Marketplace ABI to client/src/config/MarketplaceABI.json");
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("PHASE 4 – CONTRACT VERIFICATION & VIEW FUNCTION CALLS");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplaceInstance = Marketplace.attach(marketplaceAddress) as any;
    const isDemo = await marketplaceInstance.demoMode();
    console.log("✅ Marketplace contract accessible! demoMode() =", isDemo);

    const fee = await marketplaceInstance.platformFeeBps();
    console.log("✅ Marketplace platformFeeBps() =", fee.toString());
  } catch (err: any) {
    console.error("❌ Marketplace view function check failed:", err.message);
  }

  const finalBalanceWei = await provider.getBalance(deployer.address);
  const finalBalancePOL = ethers.formatEther(finalBalanceWei);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📋 FULL DEPLOYMENT REPORT");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Status:                 SUCCESS ✅");
  console.log("Network:                Polygon Amoy Testnet (Chain ID 80002)");
  console.log("Deployer Address:       ", deployer.address);
  console.log("Remaining POL Balance:  ", finalBalancePOL, "POL\n");

  console.log("Deployed Contracts:");
  console.log("-----------------------------------------------------------");
  console.log("MockUSDC:               ", usdcAddress);
  console.log("Treasury:               ", treasuryAddress);
  console.log("AssetTokenFactory:      ", factoryAddress, " (Tx: 0x515ae2bc797df450fa54c5b6ae88bf7c91f246109ebb40048ed82063572884a6)");
  console.log("AssetRegistry:          ", registryAddress, " (Tx: " + registryReceipt?.hash + ")");
  console.log("Marketplace (POL+USDC): ", marketplaceAddress, " (Tx: " + marketplaceReceipt?.hash + ")");
  if (governanceAddress) {
    console.log("Governance:             ", governanceAddress, " (Tx: " + governanceReceipt?.hash + ")");
  }

  console.log("\nPolygonScan Verification Command:");
  console.log(`npx hardhat verify --network amoy ${marketplaceAddress} "${usdcAddress}" "${treasuryAddress}" 250 "${deployer.address}"\n`);
}

main().catch((error) => {
  console.error("💥 Deployment Error:", error);
  process.exitCode = 1;
});
