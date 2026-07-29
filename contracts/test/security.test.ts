import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * AssetToken Smart Contract — Comprehensive Security & Compliance Test Suite
 *
 * Requirements:
 *   1. KYC: Transfer to user without KYC -> Reverts
 *   2. Jurisdiction / Compliance: Transfer to uncompliant user -> Reverts
 *   3. Paused Token: Token contract paused -> Transfer reverts
 *   4. Revoked Compliance: Investor receives tokens -> KYC revoked -> Transfer reverts
 *   5. Whitelist: Wallet not approved -> Transfer reverts
 *   6. Compliance Update: Admin updates compliance profile -> Transfer succeeds
 */
describe("AssetToken — Security & Compliance Test Suite", function () {
  let admin: any;
  let investor1: any;
  let investor2: any;
  let unverifiedUser: any;
  let blockedUser: any;

  let assetToken: any;

  beforeEach(async function () {
    [admin, investor1, investor2, unverifiedUser, blockedUser] = await ethers.getSigners();

    const AssetTokenFactory = await ethers.getContractFactory("AssetToken");
    assetToken = await AssetTokenFactory.deploy(
      "Manhattan Commercial Real Estate Token",
      "MRET",
      10000n, // 10,000 supply
      101,   // Asset ID 101
      admin.address,
      admin.address
    );
    await assetToken.waitForDeployment();
  });

  // 1. Whitelist Test
  it("TC-SEC-1: Whitelist — transfer to unwhitelisted wallet reverts", async function () {
    // admin holds 10,000 tokens. unverifiedUser is not whitelisted.
    await expect(
      assetToken.connect(admin).transfer(unverifiedUser.address, 100)
    ).to.be.revertedWith("Compliance & KYC validation failed");

    console.log("✓ TC-SEC-1: Transfer to unwhitelisted wallet correctly reverted");
  });

  // 2. KYC Test
  it("TC-SEC-2: KYC — transfer to user without KYC (unverified) reverts", async function () {
    // Admin sets compliance with kycStatus = 0 (Unverified)
    await assetToken.connect(admin).setComplianceProfile(
      unverifiedUser.address,
      0,   // Unverified
      840, // US
      1,   // Low risk
      false // No transfer permission
    );

    await expect(
      assetToken.connect(admin).transfer(unverifiedUser.address, 100)
    ).to.be.revertedWith("Compliance & KYC validation failed");

    console.log("✓ TC-SEC-2: Transfer to unverified KYC profile correctly reverted");
  });

  // 3. Compliance Update & Successful Transfer
  it("TC-SEC-3: Compliance Update — admin approves KYC & whitelist -> transfer succeeds", async function () {
    // Admin approves investor1 compliance profile
    await assetToken.connect(admin).setComplianceProfile(
      investor1.address,
      1,   // Approved
      840, // Jurisdiction US
      1,   // Low risk
      true // Transfer permission
    );

    expect(await assetToken.isCompliant(investor1.address)).to.be.true;

    // Admin transfers 500 tokens to investor1
    await assetToken.connect(admin).transfer(investor1.address, 500);
    expect(await assetToken.balanceOf(investor1.address)).to.equal(500n);

    console.log("✓ TC-SEC-3: Compliance profile update allows token transfer");
  });

  // 4. Revoked Compliance Test
  it("TC-SEC-4: Revoked Compliance — investor receives tokens -> KYC revoked -> transfer reverts", async function () {
    // Approve both investor1 and investor2
    await assetToken.connect(admin).setComplianceProfile(investor1.address, 1, 840, 1, true);
    await assetToken.connect(admin).setComplianceProfile(investor2.address, 1, 840, 1, true);

    // Give investor1 500 tokens
    await assetToken.connect(admin).transfer(investor1.address, 500);

    // Admin revokes investor1 KYC (kycStatus = 2)
    await assetToken.connect(admin).setComplianceProfile(
      investor1.address,
      2,   // Revoked
      840,
      3,   // High risk
      false // Revoked permission
    );

    expect(await assetToken.isCompliant(investor1.address)).to.be.false;

    // investor1 attempts to transfer tokens to investor2 -> reverts
    await expect(
      assetToken.connect(investor1).transfer(investor2.address, 100)
    ).to.be.revertedWith("Compliance & KYC validation failed");

    console.log("✓ TC-SEC-4: Revoked KYC investor prevented from transferring tokens");
  });

  // 5. Jurisdiction Restriction Test
  it("TC-SEC-5: Jurisdiction Restriction — uncompliant jurisdiction profile prevents transfer", async function () {
    // Admin sets blockedUser to jurisdiction 999 with no permission
    await assetToken.connect(admin).setComplianceProfile(
      blockedUser.address,
      0,   // KYC Unverified
      999, // Blocked Jurisdiction Code
      3,   // High Risk
      false
    );

    await expect(
      assetToken.connect(admin).transfer(blockedUser.address, 50)
    ).to.be.revertedWith("Compliance & KYC validation failed");

    console.log("✓ TC-SEC-5: Blocked jurisdiction profile correctly rejected");
  });

  // 6. Paused Token Contract Test
  it("TC-SEC-6: Paused Token — contract paused -> transfer reverts", async function () {
    // Whitelist investor1
    await assetToken.connect(admin).setComplianceProfile(investor1.address, 1, 840, 1, true);

    // Admin pauses token contract
    await assetToken.connect(admin).pause();
    expect(await assetToken.paused()).to.be.true;

    // Transfer while paused -> reverts with EnforcedPause
    await expect(
      assetToken.connect(admin).transfer(investor1.address, 100)
    ).to.be.reverted;

    // Unpause -> transfer succeeds
    await assetToken.connect(admin).unpause();
    await assetToken.connect(admin).transfer(investor1.address, 100);
    expect(await assetToken.balanceOf(investor1.address)).to.equal(100n);

    console.log("✓ TC-SEC-6: Pausable emergency circuit breaker verified");
  });
});
