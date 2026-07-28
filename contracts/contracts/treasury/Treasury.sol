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
        uint256 snapshotTotalSupply;
        uint256 createdAt;
    }

    mapping(uint256 => Distribution) public distributions;
    uint256 public distributionCount;

    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => mapping(address => uint256)) public snapshotBalances;

    event ProfitDeposited(uint256 indexed assetId, address indexed depositor, uint256 amount, uint256 snapshotTotalSupply);
    event SnapshotRecorded(uint256 indexed distributionId, address indexed holder, uint256 balance);
    event DistributionCreated(uint256 indexed distributionId, uint256 indexed assetId, uint256 totalAmount);
    event ProfitClaimed(uint256 indexed distributionId, address indexed holder, uint256 amount);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    constructor(address _paymentToken, address admin) {
        require(_paymentToken != address(0), "Invalid payment token");
        require(admin != address(0), "Invalid admin address");
        paymentToken = IERC20(_paymentToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function depositProfit(uint256 assetId, address tokenContract, uint256 amount) external nonReentrant {
        require(tokenContract != address(0), "Invalid token contract");
        require(amount > 0, "Amount must be > 0");
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");

        uint256 currentSupply = IERC20(tokenContract).totalSupply();
        require(currentSupply > 0, "Token total supply must be > 0");

        distributionCount++;
        distributions[distributionCount] = Distribution({
            id: distributionCount,
            assetId: assetId,
            tokenContract: tokenContract,
            totalAmount: amount,
            snapshotTotalSupply: currentSupply,
            createdAt: block.timestamp
        });

        // Default record depositor snapshot if holder
        uint256 senderBal = IERC20(tokenContract).balanceOf(msg.sender);
        if (senderBal > 0) {
            snapshotBalances[distributionCount][msg.sender] = senderBal;
        }

        emit ProfitDeposited(assetId, msg.sender, amount, currentSupply);
        emit DistributionCreated(distributionCount, assetId, amount);
    }

    function depositProfitWithSnapshot(
        uint256 assetId,
        address tokenContract,
        uint256 amount,
        address[] calldata holders,
        uint256[] calldata balances
    ) external nonReentrant {
        require(tokenContract != address(0), "Invalid token contract");
        require(amount > 0, "Amount must be > 0");
        require(holders.length == balances.length, "Mismatched holders and balances array");
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");

        uint256 currentSupply = IERC20(tokenContract).totalSupply();
        require(currentSupply > 0, "Token total supply must be > 0");

        distributionCount++;
        distributions[distributionCount] = Distribution({
            id: distributionCount,
            assetId: assetId,
            tokenContract: tokenContract,
            totalAmount: amount,
            snapshotTotalSupply: currentSupply,
            createdAt: block.timestamp
        });

        for (uint256 i = 0; i < holders.length; i++) {
            snapshotBalances[distributionCount][holders[i]] = balances[i];
            emit SnapshotRecorded(distributionCount, holders[i], balances[i]);
        }

        emit ProfitDeposited(assetId, msg.sender, amount, currentSupply);
        emit DistributionCreated(distributionCount, assetId, amount);
    }

    function recordSnapshotBatch(
        uint256 distributionId,
        address[] calldata holders,
        uint256[] calldata balances
    ) external onlyRole(ADMIN_ROLE) {
        require(distributions[distributionId].id > 0, "Distribution does not exist");
        require(holders.length == balances.length, "Mismatched arrays");

        for (uint256 i = 0; i < holders.length; i++) {
            snapshotBalances[distributionId][holders[i]] = balances[i];
            emit SnapshotRecorded(distributionId, holders[i], balances[i]);
        }
    }

    function claimProfit(uint256 distributionId) external nonReentrant {
        Distribution storage dist = distributions[distributionId];
        require(dist.id > 0, "Distribution does not exist");
        require(!hasClaimed[distributionId][msg.sender], "Already claimed");

        uint256 snapshotSupply = dist.snapshotTotalSupply;
        if (snapshotSupply == 0) {
            snapshotSupply = IERC20(dist.tokenContract).totalSupply();
        }
        require(snapshotSupply > 0, "Snapshot total supply is 0");

        uint256 snapshotBal = snapshotBalances[distributionId][msg.sender];
        if (snapshotBal == 0) {
            // Fallback to current balance if snapshot wasn't explicitly populated
            snapshotBal = IERC20(dist.tokenContract).balanceOf(msg.sender);
        }
        require(snapshotBal > 0, "No snapshot token balance at distribution time");

        uint256 claimable = (dist.totalAmount * snapshotBal) / snapshotSupply;
        require(claimable > 0, "Claimable amount is 0");

        hasClaimed[distributionId][msg.sender] = true;
        require(paymentToken.transfer(msg.sender, claimable), "Claim transfer failed");

        emit ProfitClaimed(distributionId, msg.sender, claimable);
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid target recipient");
        require(paymentToken.transfer(to, amount), "Withdrawal failed");
        emit EmergencyWithdraw(to, amount);
    }
}
