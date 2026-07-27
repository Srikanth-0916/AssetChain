// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Governance
 * @notice DAO governance contract allowing asset token holders to vote on asset decisions.
 */
contract Governance is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ProposalStatus { Active, Passed, Rejected, Executed, Cancelled }

    struct Proposal {
        uint256 id;
        uint256 assetId;
        address tokenContract;
        string title;
        string descriptionCID;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 quorumThreshold;
        ProposalStatus status;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, uint256 indexed assetId, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function createProposal(
        uint256 assetId,
        address tokenContract,
        string calldata title,
        string calldata descriptionCID,
        uint256 duration,
        uint256 quorumThreshold
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(tokenContract != address(0), "Invalid token contract");
        require(duration > 0 && duration <= 30 days, "Invalid duration");

        proposalCount++;
        uint256 newId = proposalCount;

        proposals[newId] = Proposal({
            id: newId,
            assetId: assetId,
            tokenContract: tokenContract,
            title: title,
            descriptionCID: descriptionCID,
            proposer: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            votesFor: 0,
            votesAgainst: 0,
            quorumThreshold: quorumThreshold,
            status: ProposalStatus.Active
        });

        emit ProposalCreated(newId, assetId, title);
        return newId;
    }

    function castVote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = IERC20(proposal.tokenContract).balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external onlyRole(ADMIN_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting still active");

        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes >= proposal.quorumThreshold, "Quorum not reached");
        require(proposal.votesFor > proposal.votesAgainst, "Majority did not support");

        proposal.status = ProposalStatus.Executed;
        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external onlyRole(ADMIN_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");

        proposal.status = ProposalStatus.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
}
