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

    uint256 public immutable assetId;
    address public immutable assetOwner;
    bool public transfersRestricted;
    mapping(address => bool) public whitelist;

    event WhitelistUpdated(address indexed account, bool status);
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
        _grantRole(MINTER_ROLE, msg.sender);

        _mint(msg.sender, totalSupply);
    }

    function setWhitelist(address account, bool status) external onlyRole(ADMIN_ROLE) {
        whitelist[account] = status;
        emit WhitelistUpdated(account, status);
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

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        if (transfersRestricted && from != address(0) && to != address(0)) {
            require(whitelist[from] || whitelist[to] || hasRole(ADMIN_ROLE, from), "KYC Whitelist restriction");
        }
        super._update(from, to, value);
    }
}
