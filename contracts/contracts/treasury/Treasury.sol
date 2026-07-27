// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Treasury
 * @notice Holds platform funds and enables pull-based claimable profit distribution to token holders.
 */
contract Treasury is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable paymentToken;

    struct Distribution {
        uint256 id;
        uint256 assetId;
        address tokenContract;
        uint256 totalAmount;
        uint256 createdAt;
    }

    mapping(uint256 => Distribution) public distributions;
    uint256 public distributionCount;

    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event ProfitDeposited(uint256 indexed assetId, address indexed depositor, uint256 amount);
    event DistributionCreated(uint256 indexed distributionId, uint256 indexed assetId, uint256 totalAmount);
    event ProfitClaimed(uint256 indexed distributionId, address indexed holder, uint256 amount);

    constructor(address _paymentToken, address admin) {
        paymentToken = IERC20(_paymentToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function depositProfit(uint256 assetId, address tokenContract, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");

        distributionCount++;
        distributions[distributionCount] = Distribution({
            id: distributionCount,
            assetId: assetId,
            tokenContract: tokenContract,
            totalAmount: amount,
            createdAt: block.timestamp
        });

        emit ProfitDeposited(assetId, msg.sender, amount);
        emit DistributionCreated(distributionCount, assetId, amount);
    }

    function claimProfit(uint256 distributionId) external nonReentrant {
        Distribution storage dist = distributions[distributionId];
        require(!hasClaimed[distributionId][msg.sender], "Already claimed");

        uint256 totalSupply = IERC20(dist.tokenContract).totalSupply();
        uint256 holderBalance = IERC20(dist.tokenContract).balanceOf(msg.sender);
        require(holderBalance > 0, "No token balance");

        uint256 claimable = (dist.totalAmount * holderBalance) / totalSupply;
        require(claimable > 0, "Claimable amount is 0");

        hasClaimed[distributionId][msg.sender] = true;
        require(paymentToken.transfer(msg.sender, claimable), "Claim transfer failed");

        emit ProfitClaimed(distributionId, msg.sender, claimable);
    }
}
