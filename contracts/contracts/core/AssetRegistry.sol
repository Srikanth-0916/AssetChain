// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AssetTokenFactory.sol";

/**
 * @title AssetRegistry
 * @notice Central registry for registering physical assets and triggering their tokenization.
 */
contract AssetRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum AssetStatus { Pending, UnderReview, Approved, Rejected, Tokenized }

    struct Asset {
        uint256 id;
        address owner;
        string metadataCID;
        string assetType;
        uint256 valuation;
        uint256 tokenSupply;
        address tokenContract;
        AssetStatus status;
        uint256 createdAt;
        uint256 verifiedAt;
        string spvReference;
        uint256 legalEntityId;
    }

    struct VoteState {
        uint256 approvals;
        uint256 rejections;
    }

    mapping(uint256 => Asset) public assets;
    uint256 public assetCount;
    mapping(address => uint256[]) public ownerAssets;
    mapping(uint256 => VoteState) public assetVoteState;
    mapping(uint256 => mapping(address => bool)) public hasVotedOnAsset;

    AssetTokenFactory public immutable factory;

    event AssetRegistered(uint256 indexed assetId, address indexed owner, string metadataCID);
    event AssetStatusChanged(uint256 indexed assetId, AssetStatus oldStatus, AssetStatus newStatus);
    event AssetTokenized(uint256 indexed assetId, address tokenContract);
    event SPVDetailsUpdated(uint256 indexed assetId, string spvReference, uint256 legalEntityId);
    event ApprovalVoted(uint256 indexed assetId, address indexed voter, bool approve, uint256 currentApprovals);

    constructor(address admin, address factoryAddress) {
        require(admin != address(0), "Invalid admin");
        require(factoryAddress != address(0), "Invalid factory");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
        factory = AssetTokenFactory(factoryAddress);
    }

    function registerAsset(
        string calldata metadataCID,
        string calldata assetType,
        uint256 valuation,
        uint256 tokenSupply
    ) external whenNotPaused returns (uint256) {
        require(valuation > 0, "Valuation must be positive");
        require(tokenSupply > 0, "Token supply must be positive");

        assetCount++;
        uint256 newId = assetCount;

        assets[newId] = Asset({
            id: newId,
            owner: msg.sender,
            metadataCID: metadataCID,
            assetType: assetType,
            valuation: valuation,
            tokenSupply: tokenSupply,
            tokenContract: address(0),
            status: AssetStatus.Pending,
            createdAt: block.timestamp,
            verifiedAt: 0,
            spvReference: "",
            legalEntityId: 0
        });

        ownerAssets[msg.sender].push(newId);
        emit AssetRegistered(newId, msg.sender, metadataCID);
        return newId;
    }

    function setSPVDetails(
        uint256 assetId,
        string calldata spvReference,
        uint256 legalEntityId
    ) external onlyRole(ADMIN_ROLE) {
        require(assetId > 0 && assetId <= assetCount, "Asset does not exist");
        assets[assetId].spvReference = spvReference;
        assets[assetId].legalEntityId = legalEntityId;
        emit SPVDetailsUpdated(assetId, spvReference, legalEntityId);
    }

    function updateAssetStatus(uint256 assetId, AssetStatus newStatus) external onlyRole(ADMIN_ROLE) {
        require(assetId > 0 && assetId <= assetCount, "Asset does not exist");
        AssetStatus oldStatus = assets[assetId].status;
        assets[assetId].status = newStatus;

        if (newStatus == AssetStatus.Approved) {
            assets[assetId].verifiedAt = block.timestamp;
        }

        emit AssetStatusChanged(assetId, oldStatus, newStatus);
    }

    /**
     * @notice Direct on-chain multi-sig approval vote by an authorized verifier/admin wallet.
     * @dev Enforces 2-of-3 threshold directly in smart contract state.
     */
    function voteApproval(uint256 assetId, bool approve) external whenNotPaused {
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller is not an authorized verifier"
        );
        require(assetId > 0 && assetId <= assetCount, "Asset does not exist");
        Asset storage asset = assets[assetId];
        require(asset.status == AssetStatus.Pending || asset.status == AssetStatus.UnderReview, "Asset is not pending review");
        require(!hasVotedOnAsset[assetId][msg.sender], "Voter has already cast vote on this asset");

        hasVotedOnAsset[assetId][msg.sender] = true;
        VoteState storage state = assetVoteState[assetId];

        if (approve) {
            state.approvals++;
        } else {
            state.rejections++;
        }

        emit ApprovalVoted(assetId, msg.sender, approve, state.approvals);

        if (state.approvals >= 2 && asset.status != AssetStatus.Approved) {
            asset.status = AssetStatus.Approved;
            asset.verifiedAt = block.timestamp;
            emit AssetStatusChanged(assetId, AssetStatus.Pending, AssetStatus.Approved);
        } else if (state.rejections >= 2 && asset.status != AssetStatus.Rejected) {
            asset.status = AssetStatus.Rejected;
            emit AssetStatusChanged(assetId, AssetStatus.Pending, AssetStatus.Rejected);
        }
    }

    function tokenizeAsset(uint256 assetId, string calldata name, string calldata symbol)
        external
        onlyRole(ADMIN_ROLE)
        returns (address)
    {
        require(assetId > 0 && assetId <= assetCount, "Asset does not exist");
        Asset storage asset = assets[assetId];
        require(asset.status == AssetStatus.Approved, "Asset must be approved before tokenization");

        address tokenAddress = factory.deployToken(
            assetId,
            name,
            symbol,
            asset.tokenSupply,
            asset.owner,
            msg.sender
        );

        asset.tokenContract = tokenAddress;
        asset.status = AssetStatus.Tokenized;

        emit AssetTokenized(assetId, tokenAddress);
        return tokenAddress;
    }

    function getAsset(uint256 assetId) external view returns (Asset memory) {
        return assets[assetId];
    }
}
