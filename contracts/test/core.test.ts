import { expect } from "chai";
import { ethers } from "hardhat";

describe("AssetChain Smart Contracts", function () {
  it("Should deploy AssetRegistry and register a new asset", async function () {
    const [admin, owner] = await ethers.getSigners();

    // 1. Deploy Factory
    const Factory = await ethers.getContractFactory("AssetTokenFactory");
    const factory = await Factory.deploy(admin.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    // 2. Deploy Registry
    const Registry = await ethers.getContractFactory("AssetRegistry");
    const registry = await Registry.deploy(admin.address, factoryAddress);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();

    // Grant DEPLOYER_ROLE to registry
    const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
    await factory.grantRole(DEPLOYER_ROLE, registryAddress);

    // 3. Register Asset
    const tx = await registry.connect(owner).registerAsset(
      "QmMetadata123",
      "residential_real_estate",
      ethers.parseUnits("500000", 6), // $500,000
      10000 // 10,000 tokens
    );
    await tx.wait();

    const asset = await registry.getAsset(1);
    expect(asset.id).to.equal(1);
    expect(asset.owner).to.equal(owner.address);
    expect(asset.metadataCID).to.equal("QmMetadata123");
    expect(asset.valuation).to.equal(ethers.parseUnits("500000", 6));
    expect(asset.tokenSupply).to.equal(10000);
  });
});
