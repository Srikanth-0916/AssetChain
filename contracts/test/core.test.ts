import { expect } from "chai";
import { ethers } from "hardhat";

describe("AssetChain Production Smart Contracts Audit", function () {
  let admin: any;
  let owner: any;
  let investor: any;
  let treasuryUser: any;

  let usdc: any;
  let treasury: any;
  let factory: any;
  let registry: any;
  let marketplace: any;
  let governance: any;

  beforeEach(async function () {
    [admin, owner, investor, treasuryUser] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockToken = await ethers.getContractFactory("AssetToken");
    usdc = await MockToken.deploy(
      "USD Coin",
      "USDC",
      ethers.parseUnits("1000000", 6),
      0,
      admin.address,
      admin.address
    );
    await usdc.waitForDeployment();
    // Disable transfer restriction on payment token
    await usdc.connect(admin).setTransferRestriction(false);

    // Deploy Treasury
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(await usdc.getAddress(), admin.address);
    await treasury.waitForDeployment();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("AssetTokenFactory");
    factory = await Factory.deploy(admin.address);
    await factory.waitForDeployment();

    // Deploy Registry
    const Registry = await ethers.getContractFactory("AssetRegistry");
    registry = await Registry.deploy(admin.address, await factory.getAddress());
    await registry.waitForDeployment();

    // Grant DEPLOYER_ROLE on Factory to Registry
    const DEPLOYER_ROLE = await factory.DEPLOYER_ROLE();
    await factory.grantRole(DEPLOYER_ROLE, await registry.getAddress());

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(
      await usdc.getAddress(),
      await treasury.getAddress(),
      250, // 2.5% fee
      admin.address
    );
    await marketplace.waitForDeployment();

    // Deploy Governance
    const Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy(admin.address);
    await governance.waitForDeployment();
  });

  it("Full Lifecycle: Register -> Approve -> Tokenize -> Primary Sale -> DAO Vote -> Dividend Claim", async function () {
    // 1. Register Asset
    await registry.connect(owner).registerAsset(
      "QmTestCID123",
      "residential_real_estate",
      ethers.parseUnits("100000", 6),
      1000
    );
    let asset = await registry.getAsset(1);
    expect(asset.status).to.equal(0); // Pending

    // 2. Admin Approve & Tokenize
    await registry.connect(admin).updateAssetStatus(1, 2); // Approved
    await registry.connect(admin).tokenizeAsset(1, "Manhattan Real Estate Token", "MRET");

    asset = await registry.getAsset(1);
    expect(asset.status).to.equal(4); // Tokenized
    const tokenAddress = asset.tokenContract;
    const tokenContract = await ethers.getContractAt("AssetToken", tokenAddress);

    // Whitelist Marketplace & Investor
    await tokenContract.connect(admin).setWhitelist(investor.address, true);
    await tokenContract.connect(admin).setWhitelist(await marketplace.getAddress(), true);

    // 3. Create Primary Sale on Marketplace
    await marketplace.connect(admin).createPrimarySale(1, tokenAddress, 1000, ethers.parseUnits("100", 6));

    // Admin transfers minted tokens to marketplace contract
    await tokenContract.connect(admin).transfer(await marketplace.getAddress(), 1000);

    // 4. Give investor USDC & approve
    await usdc.connect(admin).transfer(investor.address, ethers.parseUnits("50000", 6));
    await usdc.connect(investor).approve(await marketplace.getAddress(), ethers.parseUnits("50000", 6));

    // Buy 200 tokens
    await marketplace.connect(investor).buyPrimaryTokens(1, 200);
    expect(await tokenContract.balanceOf(investor.address)).to.equal(200);

    // 5. DAO Governance Proposal & Vote
    const propTx = await governance.connect(admin).createProposal(
      1,
      tokenAddress,
      "Upgrade Building Solar Panels",
      "QmProposalCID",
      86400, // 1 day
      100 // quorum
    );
    await propTx.wait();

    await governance.connect(investor).castVote(1, true);
    const prop = await governance.getProposal(1);
    expect(prop.votesFor).to.equal(200);

    // 6. Treasury Dividend Deposit & Claim
    await usdc.connect(admin).approve(await treasury.getAddress(), ethers.parseUnits("10000", 6));
    await treasury.connect(admin).depositProfit(1, tokenAddress, ethers.parseUnits("10000", 6));

    const initialInvestorUsdc = await usdc.balanceOf(investor.address);
    await treasury.connect(investor).claimProfit(1);
    const finalInvestorUsdc = await usdc.balanceOf(investor.address);

    // Investor owns 200 out of 1000 tokens (20%) → expected 20% of $10,000 = $2,000
    expect(finalInvestorUsdc - initialInvestorUsdc).to.equal(ethers.parseUnits("2000", 6));
  });

  it("Secondary Marketplace Listing & Cancellation", async function () {
    // Register & Tokenize
    await registry.connect(owner).registerAsset("QmCID", "commercial_property", 50000, 500);
    await registry.connect(admin).updateAssetStatus(1, 2);
    await registry.connect(admin).tokenizeAsset(1, "Commercial Token", "CTOK");

    const asset = await registry.getAsset(1);
    const tokenContract = await ethers.getContractAt("AssetToken", asset.tokenContract);

    await tokenContract.connect(admin).setWhitelist(owner.address, true);
    await tokenContract.connect(admin).setWhitelist(await marketplace.getAddress(), true);
    await tokenContract.connect(admin).transfer(owner.address, 100);

    // Create listing for 50 tokens
    await tokenContract.connect(owner).approve(await marketplace.getAddress(), 50);
    await marketplace.connect(owner).createListing(await tokenContract.getAddress(), 50, 100);

    let listing = await marketplace.listings(1);
    expect(listing.tokenAmount).to.equal(50);
    expect(listing.active).to.be.true;

    // Cancel listing
    await marketplace.connect(owner).cancelListing(1);
    listing = await marketplace.listings(1);
    expect(listing.active).to.be.false;
    expect(await tokenContract.balanceOf(owner.address)).to.equal(100); // Refunded
  });
});
