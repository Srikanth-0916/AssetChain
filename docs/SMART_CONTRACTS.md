# TrustChain AI — Smart Contracts Architecture

> **Solidity Version:** ^0.8.20  
> **Framework:** Hardhat · OpenZeppelin Contracts v5  
> **Network:** Polygon Amoy Testnet (Chain ID 80002)

---

## Smart Contracts Overview

| Contract | Category | Inheritance | Description |
|----------|----------|-------------|-------------|
| `AssetToken.sol` | Core Token | ERC20, ERC20Burnable, AccessControl, Pausable | Per-asset ERC-20 ownership token with transfer whitelist and KYC profiles. |
| `AssetRegistry.sol` | Core Registry | AccessControl, Pausable | Central registry managing real-world asset lifecycle states. |
| `AssetTokenFactory.sol` | Core Factory | AccessControl | Deploys per-asset ERC-20 token instances gated by `DEPLOYER_ROLE`. |
| `Marketplace.sol` | Marketplace | AccessControl, ReentrancyGuard, Pausable | Primary token sales & compliance-gated P2P secondary listing market. |
| `Governance.sol` | DAO Governance | AccessControl | Token-weighted proposal creation, voting, and quorum execution. |
| `Treasury.sol` | Treasury | AccessControl, ReentrancyGuard | Pull-based dividend distribution with snapshot accounting. |

---

## Contract Deep Dive

### 1. `AssetToken.sol`
ERC-20 token representing fractional equity in a real-world asset.

- **Roles:** `ADMIN_ROLE`, `MINTER_ROLE`
- **Key Methods:**
  - `setComplianceProfile(account, kycStatus, jurisdictionCode, riskTier, transferPermission)`: Admin updates identity verification & transfer permission.
  - `setWhitelist(account, status)`: Toggles transfer whitelist flag.
  - `pause()` / `unpause()`: Emergency circuit breaker stopping transfers.
  - `isCompliant(account)`: View function checking `kycStatus == 1 && transferPermission && whitelist[account]`.
  - `_update(from, to, value)`: Overridden internal update checking `whenNotPaused` and `isCompliant(from) && isCompliant(to)`.

---

### 2. `Treasury.sol`
Pull-based dividend distribution contract protecting against double-claim exploits.

- **Key Methods:**
  - `depositProfitWithSnapshot(assetId, tokenContract, amount, holders, balances)`: Administrative profit deposit taking an explicit snapshot of token balances.
  - `claimProfit(distributionId)`: Investors claim their proportional share based on snapshot balance. Reverts with `"Already claimed"` if called twice or `"No snapshot token balance"` if un-allocated.
  - `emergencyWithdraw(to, amount)`: Emergency withdrawal restricted to `ADMIN_ROLE`.

---

## Automated Contract Test Coverage

The smart contracts are audited by 12 Hardhat tests in `contracts/test/`:

1. `Full Lifecycle Audit`: Register -> Approve -> Tokenize -> Primary Sale -> DAO Vote -> Dividend Claim
2. `Secondary Marketplace`: Listing creation, buying, and cancellation
3. `TC-SEC-1 (Whitelist)`: Reverts transfers to unwhitelisted wallets
4. `TC-SEC-2 (KYC)`: Reverts transfers to unverified KYC profiles
5. `TC-SEC-3 (Compliance Update)`: Verified profile updates enable transfers
6. `TC-SEC-4 (Revoked KYC)`: Revoked KYC profile blocks transfers
7. `TC-SEC-5 (Jurisdiction)`: Uncompliant jurisdiction code blocks transfers
8. `TC-SEC-6 (Pausable)`: Emergency pause halts transfers
9. `TC-T1 (Snapshot Accounting)`: Accurate balance recording at deposit time
10. `TC-T2 (Distribution Math)`: Proportional distribution calculation
11. `TC-T3 (Double Claim)`: Reverts second claim attempt
12. `TC-T4 (Post-Snapshot Buyer)`: Prevents post-snapshot buyers from draining distribution funds
