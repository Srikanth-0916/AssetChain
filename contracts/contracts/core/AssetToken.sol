// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AssetToken
 * @notice ERC20 token representing fractional ownership of a tokenized asset.
 */
contract AssetToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct ComplianceProfile {
        uint8 kycStatus;         // 0=Unverified, 1=Approved, 2=Revoked
        uint16 jurisdictionCode; // ISO country code
        uint8 riskTier;          // 1=Low, 2=Medium, 3=High
        bool transferPermission; // Explicit transfer permission flag
    }

    uint256 public immutable assetId;
    address public immutable assetOwner;
    bool public transfersRestricted;
    mapping(address => bool) public whitelist;
    mapping(address => ComplianceProfile) public complianceProfiles;

    event WhitelistUpdated(address indexed account, bool status);
    event ComplianceProfileUpdated(
        address indexed account,
        uint8 kycStatus,
        uint16 jurisdictionCode,
        uint8 riskTier,
        bool transferPermission
    );
    event TransferRestrictionChanged(bool restricted);

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 _assetId,
        address _assetOwner,
        address admin
    ) ERC20(name, symbol) {
        assetId = _assetId;
        assetOwner = _assetOwner;
        transfersRestricted = true;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(MINTER_ROLE, msg.sender);

        // Admin default compliance profile
        complianceProfiles[admin] = ComplianceProfile(1, 840, 1, true);
        complianceProfiles[msg.sender] = ComplianceProfile(1, 840, 1, true);
        whitelist[admin] = true;
        whitelist[msg.sender] = true;

        _mint(admin, totalSupply);
    }

    function setWhitelist(address account, bool status) external onlyRole(ADMIN_ROLE) {
        whitelist[account] = status;
        if (status) {
            complianceProfiles[account] = ComplianceProfile(1, 840, 1, true);
        }
        emit WhitelistUpdated(account, status);
    }

    function setComplianceProfile(
        address account,
        uint8 kycStatus,
        uint16 jurisdictionCode,
        uint8 riskTier,
        bool transferPermission
    ) external onlyRole(ADMIN_ROLE) {
        complianceProfiles[account] = ComplianceProfile({
            kycStatus: kycStatus,
            jurisdictionCode: jurisdictionCode,
            riskTier: riskTier,
            transferPermission: transferPermission
        });
        whitelist[account] = (kycStatus == 1 && transferPermission);
        emit ComplianceProfileUpdated(account, kycStatus, jurisdictionCode, riskTier, transferPermission);
    }

    function setTransferRestriction(bool restricted) external onlyRole(ADMIN_ROLE) {
        transfersRestricted = restricted;
        emit TransferRestrictionChanged(restricted);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function isCompliant(address account) public view returns (bool) {
        if (hasRole(ADMIN_ROLE, account)) return true;
        ComplianceProfile memory profile = complianceProfiles[account];
        return (profile.kycStatus == 1 && profile.transferPermission && whitelist[account]);
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        if (transfersRestricted && from != address(0) && to != address(0)) {
            require(isCompliant(from) && isCompliant(to), "Compliance & KYC validation failed");
        }
        super._update(from, to, value);
    }
}
