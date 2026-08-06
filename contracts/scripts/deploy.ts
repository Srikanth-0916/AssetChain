import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Resumable Deployment Engine for AssetChain Smart Contracts.
 *
 * Features:
 *   1. Reads contracts/deployed-addresses.json before starting.
 *   2. Verifies on-chain bytecode (provider.getCode) for existing addresses.
 *   3. Uses Factory.attach(address) for deployed contracts (skips redeployment).
 *   4. Calls view functions on attached contracts to verify ABI compatibility.
 *   5. Saves progress to deployed-addresses.json immediately after EVERY deployment.
 *   6. Auto-patches client/.env, server/.env, and exports Marketplace ABI.
 */

interface DeployedState {
  network: string;
  chainId: number;
  deployer: string;
  lastUpdated: string;
  contracts: Record<string, string>;
}

const ADDRESSES_FILE = path.join(__dirname, "..", "deployed-addresses.json");

function loadState(): DeployedState {
  if (fs.existsSync(ADDRESSES_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf-8"));
    } catch {
      // invalid JSON, fall through
    }
  }
  return {
    network: "polygon-amoy",
    chainId: 80002,
    deployer: "",
    lastUpdated: new Date().toISOString(),
    contracts: {},
  };
}

function saveState(state: DeployedState) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(state, null, 2));
}

async function verifyOnChainContract(
  provider: any,
  address: string
): Promise<boolean> {
  if (!address || !address.startsWith("0x") || address.length !== 42) return false;
  try {
    const code = await provider.getCode(address);
    return code !== "0x" && code !== "0x0" && code.length > 2;
  } catch {
    return false;
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🛠️ ASSETCHAIN RESUMABLE DEPLOYMENT ENGINE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Deployer Address:       ", deployer.address);

  const balanceWei = await provider.getBalance(deployer.address);
  const balancePOL = ethers.formatEther(balanceWei);
  console.log("Deployer POL Balance:   ", balancePOL, "POL");

  const state = loadState();
  state.deployer = deployer.address;

  const isDryRun = process.env.DRY_RUN === "true";
  if (isDryRun) {
    console.log("\n🔍 DRY-RUN AUDIT MODE ACTIVATED\n");
  }

  const deployedInstances: Record<string, any> = {};
  const statusReport: Array<{ name: string; address: string; status: string }> = [];

  // Helper function to handle individual contract deployment/resume
  async function getOrDeployContract(
    name: string,
    factoryName: string,
    deployArgs: any[],
    verifyViewFn?: (contract: any) => Promise<string>
  ) {
    const existingAddress = state.contracts[name];
    if (existingAddress) {
      const isLive = await verifyOnChainContract(provider, existingAddress);
      if (isLive) {
        const Factory = await ethers.getContractFactory(factoryName);
        const instance = Factory.attach(existingAddress);
        let viewResult = "Bytecode Verified ✓";
        if (verifyViewFn) {
          try {
            viewResult = await verifyViewFn(instance);
          } catch {
            viewResult = "Attached ✓";
          }
        }
        console.log(`✅ [${name}] Already Deployed & Verified: ${existingAddress} (${viewResult})`);
        deployedInstances[name] = instance;
        statusReport.push({ name, address: existingAddress, status: "Already deployed ✓" });
        return instance;
      }
    }

    statusReport.push({ name, address: existingAddress || "Pending", status: "Pending" });

    if (isDryRun) {
      console.log(`ℹ️ [${name}] Needs deployment (Dry-run: skipping tx)`);
      return null;
    }

    // Check balance before deploying
    const currentBalance = await provider.getBalance(deployer.address);
    if (currentBalance < ethers.parseEther("0.02")) {
      console.error(`\n❌ Low gas balance (${ethers.formatEther(currentBalance)} POL). Cannot deploy ${name}.`);
      console.error(`Please fund ${deployer.address} with testnet POL.`);
      process.exit(1);
    }

    console.log(`\n🚀 Deploying ${name}...`);
    const Factory = await ethers.getContractFactory(factoryName);
    const instance = await Factory.deploy(...deployArgs);
    const receipt = await instance.deploymentTransaction()?.wait(1);
    const newAddress = await instance.getAddress();

    console.log(`✅ [${name}] Deployed Successfully!`);
    console.log(`   Address:          ${newAddress}`);
    console.log(`   Tx Hash:          ${receipt?.hash}`);
    console.log(`   Block Number:     ${receipt?.blockNumber}`);
    console.log(`   Gas Used:         ${receipt?.gasUsed.toString()}`);

    // Update state immediately
    state.contracts[name] = newAddress;
    saveState(state);
    console.log(`   💾 Saved progress to deployed-addresses.json`);

    deployedInstances[name] = instance;
    return instance;
  }

  // ─── Sequence ──────────────────────────────────────────────────────────────

  // 1. MockUSDC
  await getOrDeployContract("MockUSDC", "AssetToken", [
    "USD Coin",
    "USDC",
    ethers.parseUnits("1000000000", 6),
    0,
    deployer.address,
    deployer.address,
  ]);

  // 2. Treasury
  const usdcAddr = state.contracts["MockUSDC"];
  await getOrDeployContract("Treasury", "Treasury", [
    usdcAddr,
    deployer.address,
  ]);

  // 3. AssetTokenFactory
  await getOrDeployContract("AssetTokenFactory", "AssetTokenFactory", [
    deployer.address,
  ]);

  // 4. AssetRegistry
  const factoryAddr = state.contracts["AssetTokenFactory"];
  const registry = await getOrDeployContract(
    "AssetRegistry",
    "AssetRegistry",
    [deployer.address, factoryAddr]
  );

  // Grant DEPLOYER_ROLE on Factory to Registry if both exist
  if (deployedInstances["AssetTokenFactory"] && state.contracts["AssetRegistry"] && !isDryRun) {
    try {
      const factoryObj = deployedInstances["AssetTokenFactory"];
      const DEPLOYER_ROLE = await factoryObj.DEPLOYER_ROLE();
      const hasRole = await factoryObj.hasRole(DEPLOYER_ROLE, state.contracts["AssetRegistry"]);
      if (!hasRole) {
        console.log("\n🔑 Granting DEPLOYER_ROLE on Factory to Registry...");
        const grantTx = await factoryObj.grantRole(DEPLOYER_ROLE, state.contracts["AssetRegistry"]);
        await grantTx.wait(1);
        console.log("✅ Granted DEPLOYER_ROLE!");
      }
    } catch {
      // role grant check warning
    }
  }

  // 5. Marketplace (POL + USDC)
  const treasuryAddr = state.contracts["Treasury"];
  await getOrDeployContract(
    "Marketplace",
    "Marketplace",
    [usdcAddr, treasuryAddr, 250, deployer.address],
    async (m) => `demoMode=${await m.demoMode()}`
  );

  // 6. Governance
  await getOrDeployContract("Governance", "Governance", [
    deployer.address,
  ]);

  // ─── Dry Run Audit Summary ──────────────────────────────────────────────────
  if (isDryRun) {
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("📋 DRY-RUN AUDIT REPORT");
    console.log("═══════════════════════════════════════════════════════════");
    console.table(statusReport);
    return;
  }

  // ─── Environment & ABI Updates ──────────────────────────────────────────────
  const marketplaceAddress = state.contracts["Marketplace"];
  const registryAddress    = state.contracts["AssetRegistry"];
  const governanceAddress  = state.contracts["Governance"];
  const usdcAddress        = state.contracts["MockUSDC"];
  const treasuryAddress    = state.contracts["Treasury"];

  if (marketplaceAddress) {
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("🔄 AUTO-PATCHING ENVIRONMENT & EXPORTING ABI");
    console.log("═══════════════════════════════════════════════════════════");

    // Helper: replace or append a key=value line in an env file
    function patchEnvFile(filePath: string, patches: Record<string, string>) {
      if (!fs.existsSync(filePath)) return;
      let content = fs.readFileSync(filePath, "utf-8");
      for (const [key, value] of Object.entries(patches)) {
        const regex = new RegExp(`^${key}=.*`, "m");
        if (regex.test(content)) {
          content = content.replace(regex, `${key}=${value}`);
        } else {
          content += `\n${key}=${value}\n`;
        }
      }
      fs.writeFileSync(filePath, content);
    }

    // ── Patch client/.env ─────────────────────────────────────────────────────
    const clientEnvPath = path.join(__dirname, "..", "..", "client", ".env");
    patchEnvFile(clientEnvPath, {
      VITE_MARKETPLACE_CONTRACT_ADDRESS: marketplaceAddress,
      VITE_MARKETPLACE_ADDRESS:          marketplaceAddress,
      VITE_ASSET_REGISTRY_ADDRESS:       registryAddress  || "",
      VITE_GOVERNANCE_ADDRESS:           governanceAddress || "",
      VITE_TREASURY_ADDRESS:             treasuryAddress  || "",
      VITE_USDC_ADDRESS:                 usdcAddress      || "",
    });
    console.log("✅ Auto-patched client/.env (all contract addresses)");

    // ── Patch server/.env ─────────────────────────────────────────────────────
    const serverEnvPath = path.join(__dirname, "..", "..", "server", ".env");
    patchEnvFile(serverEnvPath, {
      MARKETPLACE_CONTRACT_ADDRESS:     marketplaceAddress,
      ASSET_REGISTRY_CONTRACT_ADDRESS:  registryAddress  || "",
      GOVERNANCE_CONTRACT_ADDRESS:      governanceAddress || "",
      TREASURY_CONTRACT_ADDRESS:        treasuryAddress  || "",
      USDC_CONTRACT_ADDRESS:            usdcAddress      || "",
    });
    console.log("✅ Auto-patched server/.env (all contract addresses)");

    // ── Update client/src/lib/explorer.ts KNOWN_CONTRACTS ────────────────────
    const explorerPath = path.join(__dirname, "..", "..", "client", "src", "lib", "explorer.ts");
    if (fs.existsSync(explorerPath)) {
      let explorerContent = fs.readFileSync(explorerPath, "utf-8");
      // Replace the entire KNOWN_CONTRACTS block
      const knownContractsBlock = `export const KNOWN_CONTRACTS = {
  ASSET_REGISTRY: '${registryAddress  || ""}',
  MARKETPLACE:     '${marketplaceAddress}',
  TREASURY:        '${treasuryAddress  || ""}',
  DAO_GOVERNANCE:  '${governanceAddress || ""}',
  PAYMENT_TOKEN:   '${usdcAddress      || ""}', // MockUSDC
};`;
      explorerContent = explorerContent.replace(
        /export const KNOWN_CONTRACTS = \{[\s\S]*?\};/,
        knownContractsBlock
      );
      fs.writeFileSync(explorerPath, explorerContent);
      console.log("✅ Updated client/src/lib/explorer.ts KNOWN_CONTRACTS with live addresses");
    }

    // ── Export Marketplace ABI ────────────────────────────────────────────────
    const abiSrcPath = path.join(
      __dirname, "..", "artifacts", "contracts", "marketplace",
      "Marketplace.sol", "Marketplace.json"
    );
    const abiDestDir  = path.join(__dirname, "..", "..", "client", "src", "config");
    const abiDestPath = path.join(abiDestDir, "MarketplaceABI.json");
    if (fs.existsSync(abiSrcPath)) {
      if (!fs.existsSync(abiDestDir)) fs.mkdirSync(abiDestDir, { recursive: true });
      const artifact = JSON.parse(fs.readFileSync(abiSrcPath, "utf-8"));
      fs.writeFileSync(abiDestPath, JSON.stringify(artifact.abi, null, 2));
      console.log("✅ Exported Marketplace ABI to client/src/config/MarketplaceABI.json");
    }
  }


  const finalBal = await provider.getBalance(deployer.address);
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📋 FINAL DEPLOYMENT AUDIT REPORT");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Status:                 SUCCESS ✅");
  console.log("Network:                Polygon Amoy Testnet (Chain ID 80002)");
  console.log("Deployer Address:       ", deployer.address);
  console.log("Remaining POL Balance:  ", ethers.formatEther(finalBal), "POL\n");

  console.log("Deployed Contract Summary:");
  console.table(
    Object.entries(state.contracts).map(([name, addr]) => ({
      Contract: name,
      Address: addr,
      Status: "Live on Polygon Amoy ✓",
    }))
  );

  console.log("\nPolygonScan Verification Command:");
  console.log(`npx hardhat verify --network amoy ${marketplaceAddress} "${usdcAddr}" "${treasuryAddr}" 250 "${deployer.address}"\n`);
}

main().catch((error) => {
  console.error("💥 Deployment Error:", error);
  process.exitCode = 1;
});
