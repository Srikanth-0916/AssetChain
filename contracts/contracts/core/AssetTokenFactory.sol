// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AssetToken.sol";

/**
 * @title AssetTokenFactory
 * @notice Factory contract that deploys new AssetToken ERC20 contracts for registered assets.
 */
contract AssetTokenFactory is AccessControl {
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    mapping(uint256 => address) public assetTokens;
    address[] public allTokens;

    event TokenDeployed(
        uint256 indexed assetId,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DEPLOYER_ROLE, admin);
    }

    function deployToken(
        uint256 assetId,
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        address assetOwner
    ) external onlyRole(DEPLOYER_ROLE) returns (address) {
        require(assetTokens[assetId] == address(0), "Token already deployed for asset");

        AssetToken token = new AssetToken(
            name,
            symbol,
            totalSupply,
            assetId,
            assetOwner,
            msg.sender
        );

        address tokenAddress = address(token);
        assetTokens[assetId] = tokenAddress;
        allTokens.push(tokenAddress);

        emit TokenDeployed(assetId, tokenAddress, name, symbol, totalSupply);
        return tokenAddress;
    }

    function getTokenAddress(uint256 assetId) external view returns (address) {
        return assetTokens[assetId];
    }
}
