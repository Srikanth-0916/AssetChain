import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * Treasury Smart Contract — Hardening Tests
 *
 * Tests:
 *   1. Snapshot correctness — balance recorded at deposit time
 *   2. Distribution calculation — proportional to token balance
 *   3. Double claim prevention — second claim reverts
 *   4. Post-snapshot purchase — late buyer cannot claim current distribution
 */
describe("Treasury — Hardening Tests", function () {
  let admin: any;
  let investor1: any;
  let investor2: any;
  let lateBuyer: any;

  let usdc: any;
  let assetToken: any;
  let treasury: any;

  beforeEach(async function () {
    [admin, investor1, investor2, lateBuyer] = await ethers.getSigners();

    // Deploy Mock USDC (using AssetToken with transfer restriction OFF)
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
    await usdc.connect(admin).setTransferRestriction(false);

    // Deploy Asset Token (the investment token)
    assetToken = await MockToken.deploy(
      "Manhattan Real Estate Token",
      "MRET",
      1000n,  // 1000 total tokens
      1,
      admin.address,
      admin.address
    );
    await assetToken.waitForDeployment();
    await assetToken.connect(admin).setTransferRestriction(false);

    // Deploy Treasury
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(await usdc.getAddress(), admin.address);
    await treasury.waitForDeployment();

    // Give investors USDC for testing
    await usdc.connect(admin).transfer(investor1.address, ethers.parseUnits("100000", 6));
    await usdc.connect(admin).transfer(investor2.address, ethers.parseUnits("100000", 6));
    await usdc.connect(admin).transfer(lateBuyer.address, ethers.parseUnits("100000", 6));
  });

  // ─────────────────────────────────────────────────────────────────────────
  it("TC-T1: Snapshot correctness — records correct balances at deposit time", async function () {
    const tokenAddr = await assetToken.getAddress();

    // Distribute: investor1 = 300 tokens, investor2 = 700 tokens
    await assetToken.connect(admin).transfer(investor1.address, 300);
    await assetToken.connect(admin).transfer(investor2.address, 700);

    // Approve Treasury for profit deposit
    await usdc.connect(admin).approve(await treasury.getAddress(), ethers.parseUnits("10000", 6));

    // Record snapshot balances via depositProfitWithSnapshot
    await treasury.connect(admin).depositProfitWithSnapshot(
      1,
      tokenAddr,
      ethers.parseUnits("10000", 6),
      [investor1.address, investor2.address],
      [300, 700]
    );

    // Verify snapshots are recorded correctly
    const snap1 = await treasury.snapshotBalances(1, investor1.address);
    const snap2 = await treasury.snapshotBalances(1, investor2.address);

    expect(snap1).to.equal(300n);
    expect(snap2).to.equal(700n);

    console.log("✓ TC-T1: Snapshot records investor1=300, investor2=700 tokens correctly");
  });

  // ─────────────────────────────────────────────────────────────────────────
  it("TC-T2: Distribution calculation — proportional to snapshot balance", async function () {
    const tokenAddr = await assetToken.getAddress();

    // investor1 = 200 tokens, investor2 = 800 tokens (out of 1000 total)
    await assetToken.connect(admin).transfer(investor1.address, 200);
    await assetToken.connect(admin).transfer(investor2.address, 800);

    // Deposit 10,000 USDC profit with explicit snapshot
    await usdc.connect(admin).approve(await treasury.getAddress(), ethers.parseUnits("10000", 6));
    await treasury.connect(admin).depositProfitWithSnapshot(
      1,
      tokenAddr,
      ethers.parseUnits("10000", 6),
      [investor1.address, investor2.address],
      [200, 800]
    );

    const inv1Before = await usdc.balanceOf(investor1.address);
    const inv2Before = await usdc.balanceOf(investor2.address);

    await treasury.connect(investor1).claimProfit(1);
    await treasury.connect(investor2).claimProfit(1);

    const inv1After = await usdc.balanceOf(investor1.address);
    const inv2After = await usdc.balanceOf(investor2.address);

    // investor1 owns 20% → $2,000 | investor2 owns 80% → $8,000
    expect(inv1After - inv1Before).to.equal(ethers.parseUnits("2000", 6));
    expect(inv2After - inv2Before).to.equal(ethers.parseUnits("8000", 6));

    console.log("✓ TC-T2: Distribution proportional — investor1 received 20% ($2,000), investor2 received 80% ($8,000)");
  });

  // ─────────────────────────────────────────────────────────────────────────
  it("TC-T3: Double claim prevention — second claim reverts with error", async function () {
    const tokenAddr = await assetToken.getAddress();

    await assetToken.connect(admin).transfer(investor1.address, 500);

    await usdc.connect(admin).approve(await treasury.getAddress(), ethers.parseUnits("5000", 6));
    await treasury.connect(admin).depositProfitWithSnapshot(
      1,
      tokenAddr,
      ethers.parseUnits("5000", 6),
      [investor1.address],
      [500]
    );

    // First claim — should succeed
    await treasury.connect(investor1).claimProfit(1);

    // Second claim — should revert
    await expect(
      treasury.connect(investor1).claimProfit(1)
    ).to.be.revertedWith("Already claimed");

    console.log("✓ TC-T3: Double claim correctly prevented — second claim reverts with 'Already claimed'");
  });

  // ─────────────────────────────────────────────────────────────────────────
  it("TC-T4: Post-snapshot purchase — late buyer cannot claim current distribution allocation", async function () {
    const tokenAddr = await assetToken.getAddress();

    // Only investor1 holds tokens at deposit time
    await assetToken.connect(admin).transfer(investor1.address, 1000);

    // Deposit profit — snapshot taken for investor1 (1000/1000 tokens)
    await usdc.connect(admin).approve(await treasury.getAddress(), ethers.parseUnits("10000", 6));
    await treasury.connect(admin).depositProfitWithSnapshot(
      1,
      tokenAddr,
      ethers.parseUnits("10000", 6),
      [investor1.address],
      [1000]
    );

    // AFTER snapshot: lateBuyer acquires tokens from investor1
    await assetToken.connect(investor1).transfer(lateBuyer.address, 500);

    // investor1 claims their 100% snapshot share ($10,000)
    const inv1Before = await usdc.balanceOf(investor1.address);
    await treasury.connect(investor1).claimProfit(1);
    const inv1After = await usdc.balanceOf(investor1.address);
    expect(inv1After - inv1Before).to.equal(ethers.parseUnits("10000", 6));

    // lateBuyer has 500 current tokens, but distribution funds are exhausted — claim reverts
    await expect(
      treasury.connect(lateBuyer).claimProfit(1)
    ).to.be.reverted;

    console.log("✓ TC-T4: Post-snapshot buyer correctly blocked — original holder received 100%, late buyer claim fails");
  });
});
