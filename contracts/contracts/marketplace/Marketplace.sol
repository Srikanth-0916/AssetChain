// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Marketplace
 * @notice Handles primary asset token offerings and secondary peer-to-peer listings using USDC.
 */
contract Marketplace is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable paymentToken; // e.g. USDC
    address public treasury;
    uint256 public platformFeeBps; // Basis points (e.g. 250 = 2.5%)

    struct Listing {
        uint256 listingId;
        address seller;
        address tokenContract;
        uint256 tokenAmount;
        uint256 pricePerToken;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    mapping(uint256 => uint256) public primarySaleSupply;
    mapping(uint256 => uint256) public primarySalePrice;
    mapping(uint256 => address) public primarySaleToken;

    event PrimarySaleCreated(uint256 indexed assetId, address tokenContract, uint256 supply, uint256 pricePerToken);
    event TokensPurchased(uint256 indexed assetId, address indexed buyer, uint256 amount, uint256 totalCost);
    event ListingCreated(uint256 indexed listingId, address indexed seller, address tokenContract, uint256 amount, uint256 price);
    event ListingFulfilled(uint256 indexed listingId, address indexed buyer, uint256 amount);

    constructor(address _paymentToken, address _treasury, uint256 _feeBps, address admin) {
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        platformFeeBps = _feeBps;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function createPrimarySale(uint256 assetId, address tokenContract, uint256 supply, uint256 pricePerToken)
        external
        onlyRole(ADMIN_ROLE)
    {
        primarySaleSupply[assetId] = supply;
        primarySalePrice[assetId] = pricePerToken;
        primarySaleToken[assetId] = tokenContract;

        emit PrimarySaleCreated(assetId, tokenContract, supply, pricePerToken);
    }

    function buyPrimaryTokens(uint256 assetId, uint256 amount) external nonReentrant whenNotPaused {
        require(primarySaleSupply[assetId] >= amount, "Insufficient primary supply");
        uint256 price = primarySalePrice[assetId];
        uint256 totalCost = amount * price;

        primarySaleSupply[assetId] -= amount;

        uint256 fee = (totalCost * platformFeeBps) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        require(paymentToken.transferFrom(msg.sender, treasury, fee), "Fee transfer failed");
        require(paymentToken.transferFrom(msg.sender, address(this), sellerProceeds), "Payment transfer failed");
        require(IERC20(primarySaleToken[assetId]).transfer(msg.sender, amount), "Token transfer failed");

        emit TokensPurchased(assetId, msg.sender, amount, totalCost);
    }

    function createListing(address tokenContract, uint256 tokenAmount, uint256 pricePerToken) external returns (uint256) {
        require(tokenAmount > 0, "Amount must be > 0");
        require(pricePerToken > 0, "Price must be > 0");

        require(IERC20(tokenContract).transferFrom(msg.sender, address(this), tokenAmount), "Escrow failed");

        listingCount++;
        listings[listingCount] = Listing({
            listingId: listingCount,
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenAmount: tokenAmount,
            pricePerToken: pricePerToken,
            active: true
        });

        emit ListingCreated(listingCount, msg.sender, tokenContract, tokenAmount, pricePerToken);
        return listingCount;
    }

    function buyListing(uint256 listingId, uint256 amount) external nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing inactive");
        require(listing.tokenAmount >= amount, "Insufficient listing supply");

        uint256 totalCost = amount * listing.pricePerToken;
        uint256 fee = (totalCost * platformFeeBps) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        listing.tokenAmount -= amount;
        if (listing.tokenAmount == 0) {
            listing.active = false;
        }

        require(paymentToken.transferFrom(msg.sender, treasury, fee), "Fee transfer failed");
        require(paymentToken.transferFrom(msg.sender, listing.seller, sellerProceeds), "Seller payment failed");
        require(IERC20(listing.tokenContract).transfer(msg.sender, amount), "Token transfer failed");

        emit ListingFulfilled(listingId, msg.sender, amount);
    }
}
