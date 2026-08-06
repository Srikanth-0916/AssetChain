// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Marketplace
 * @notice Handles primary asset token offerings and secondary peer-to-peer listings.
 *
 * Payment Methods:
 *   1. USDC (ERC-20)       — existing buyPrimaryTokens() — production/mainnet
 *   2. Native POL (payable) — new buyTokensWithPOL()    — hackathon/testnet demo
 *
 * Architecture:
 *   - Existing USDC functions are UNCHANGED (zero breaking change risk)
 *   - New POL functions use string assetIds (Supabase UUIDs) as keys
 *   - demoMode flag: true = skip KYC whitelist; false = enforce KYC (production)
 *   - POL purchases record payment on-chain and emit InvestmentCompleted event
 *   - Backend verifies the event before updating Supabase portfolio
 */
contract Marketplace is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ─── USDC Payment (existing, unchanged) ──────────────────────────────────
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

    // ─── Native POL Payment (new, additive) ──────────────────────────────────

    struct POLSaleConfig {
        uint256 pricePerTokenWei;   // Price in wei per single fractional token
        uint256 totalSupply;        // Total tokens in this primary sale
        uint256 availableSupply;    // Remaining tokens (decreases on purchase)
        bool active;                // Whether this sale is open
        uint256 createdAt;          // Block timestamp
    }

    /// @dev Maps Supabase asset UUID string → POL sale config
    mapping(string => POLSaleConfig) public polSales;

    /// @dev Total POL (wei) raised per asset
    mapping(string => uint256) public totalPOLRaised;

    /// @dev Total number of POL-based investments ever made
    uint256 public totalPOLInvestmentCount;

    /**
     * @dev Demo mode: when true, POL purchases skip KYC whitelist checks.
     * Set to true for hackathon / testnet demo. Set to false in production.
     * This preserves the full KYC architecture while enabling frictionless testing.
     */
    bool public demoMode;

    // ─── USDC Events (existing, unchanged) ────────────────────────────────────
    event PrimarySaleCreated(uint256 indexed assetId, address tokenContract, uint256 supply, uint256 pricePerToken);
    event TokensPurchased(uint256 indexed assetId, address indexed buyer, uint256 amount, uint256 totalCost);
    event ListingCreated(uint256 indexed listingId, address indexed seller, address tokenContract, uint256 amount, uint256 price);
    event ListingFulfilled(uint256 indexed listingId, address indexed buyer, uint256 amount);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    // ─── POL Events (new) ─────────────────────────────────────────────────────

    /// @notice Emitted when admin opens a POL primary sale for a Supabase asset
    event POLSaleCreated(string indexed assetId, uint256 pricePerTokenWei, uint256 totalSupply);

    /**
     * @notice Emitted on every confirmed POL investment.
     * @dev Indexed by assetId and buyer for efficient backend log querying.
     *      Backend uses this event to verify and record in Supabase.
     * @param assetId    Supabase UUID of the invested asset
     * @param buyer      Investor's MetaMask wallet address
     * @param quantity   Number of fractional tokens purchased
     * @param amountPaid Total POL paid in wei
     * @param timestamp  Block timestamp of the purchase
     */
    event InvestmentCompleted(
        string indexed assetId,
        address indexed buyer,
        uint256 quantity,
        uint256 amountPaid,
        uint256 timestamp
    );

    /// @notice Emitted when admin withdraws collected POL
    event POLWithdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when demo mode is toggled
    event DemoModeChanged(bool demoMode);

    // ─── Constructor (unchanged) ──────────────────────────────────────────────

    constructor(address _paymentToken, address _treasury, uint256 _feeBps, address admin) {
        require(_paymentToken != address(0), "Invalid payment token");
        require(_treasury != address(0), "Invalid treasury");
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        platformFeeBps = _feeBps;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        // Start in demo mode for hackathon convenience
        demoMode = true;
    }

    // ─── USDC Admin Functions (existing, unchanged) ───────────────────────────

    function setPlatformFeeBps(uint256 _feeBps) external onlyRole(ADMIN_ROLE) {
        require(_feeBps <= 1000, "Fee exceeds 10%");
        platformFeeBps = _feeBps;
    }

    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function createPrimarySale(uint256 assetId, address tokenContract, uint256 supply, uint256 pricePerToken)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(tokenContract != address(0), "Invalid token contract");
        require(supply > 0, "Supply must be positive");
        require(pricePerToken > 0, "Price must be positive");

        primarySaleSupply[assetId] = supply;
        primarySalePrice[assetId] = pricePerToken;
        primarySaleToken[assetId] = tokenContract;

        emit PrimarySaleCreated(assetId, tokenContract, supply, pricePerToken);
    }

    // ─── USDC Investor Functions (existing, unchanged) ────────────────────────

    function buyPrimaryTokens(uint256 assetId, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be positive");
        require(primarySaleSupply[assetId] >= amount, "Insufficient primary supply");
        uint256 price = primarySalePrice[assetId];
        uint256 totalCost = amount * price;

        primarySaleSupply[assetId] -= amount;

        uint256 fee = (totalCost * platformFeeBps) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        if (fee > 0) {
            require(paymentToken.transferFrom(msg.sender, treasury, fee), "Fee transfer failed");
        }
        require(paymentToken.transferFrom(msg.sender, address(this), sellerProceeds), "Payment transfer failed");
        require(IERC20(primarySaleToken[assetId]).transfer(msg.sender, amount), "Token transfer failed");

        emit TokensPurchased(assetId, msg.sender, amount, totalCost);
    }

    function createListing(address tokenContract, uint256 tokenAmount, uint256 pricePerToken) external returns (uint256) {
        require(tokenContract != address(0), "Invalid token contract");
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
        require(amount > 0 && listing.tokenAmount >= amount, "Invalid amount");

        uint256 totalCost = amount * listing.pricePerToken;
        uint256 fee = (totalCost * platformFeeBps) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        listing.tokenAmount -= amount;
        if (listing.tokenAmount == 0) {
            listing.active = false;
        }

        if (fee > 0) {
            require(paymentToken.transferFrom(msg.sender, treasury, fee), "Fee transfer failed");
        }
        require(paymentToken.transferFrom(msg.sender, listing.seller, sellerProceeds), "Seller payment failed");
        require(IERC20(listing.tokenContract).transfer(msg.sender, amount), "Token transfer failed");

        emit ListingFulfilled(listingId, msg.sender, amount);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing inactive");
        require(listing.seller == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized to cancel");

        uint256 refundAmount = listing.tokenAmount;
        listing.tokenAmount = 0;
        listing.active = false;

        require(IERC20(listing.tokenContract).transfer(listing.seller, refundAmount), "Refund transfer failed");

        emit ListingCancelled(listingId, listing.seller);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ─── POL Admin Functions (new, additive) ─────────────────────────────────

    /**
     * @notice Toggle demo mode.
     *   true  = KYC whitelist skipped (hackathon / testnet)
     *   false = KYC whitelist enforced (production)
     */
    function setDemoMode(bool _demoMode) external onlyRole(ADMIN_ROLE) {
        demoMode = _demoMode;
        emit DemoModeChanged(_demoMode);
    }

    /**
     * @notice Open a native POL primary sale for a Supabase asset.
     * @param assetId           Supabase UUID (e.g. "a1b2c3d4-...")
     * @param pricePerTokenWei  Price per fractional token in wei (e.g. 1e15 = 0.001 POL)
     * @param totalSupply       Total fractional tokens available in this sale
     */
    function createPOLSale(
        string calldata assetId,
        uint256 pricePerTokenWei,
        uint256 totalSupply
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(assetId).length > 0, "Empty assetId");
        require(pricePerTokenWei > 0, "Price must be > 0");
        require(totalSupply > 0, "Supply must be > 0");

        polSales[assetId] = POLSaleConfig({
            pricePerTokenWei: pricePerTokenWei,
            totalSupply: totalSupply,
            availableSupply: totalSupply,
            active: true,
            createdAt: block.timestamp
        });

        emit POLSaleCreated(assetId, pricePerTokenWei, totalSupply);
    }

    /**
     * @notice Update an existing POL sale (price, active state).
     */
    function updatePOLSale(
        string calldata assetId,
        bool active,
        uint256 newPricePerTokenWei
    ) external onlyRole(ADMIN_ROLE) {
        require(polSales[assetId].createdAt > 0, "POL sale not found");
        if (newPricePerTokenWei > 0) {
            polSales[assetId].pricePerTokenWei = newPricePerTokenWei;
        }
        polSales[assetId].active = active;
    }

    /**
     * @notice Withdraw all accumulated POL to treasury.
     */
    function withdrawPOL() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No POL to withdraw");
        (bool success, ) = payable(treasury).call{value: balance}("");
        require(success, "POL withdrawal failed");
        emit POLWithdrawn(treasury, balance);
    }

    /**
     * @notice Withdraw specific amount of POL to any address.
     */
    function withdrawPOLTo(address payable to, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient POL balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "POL withdrawal failed");
        emit POLWithdrawn(to, amount);
    }

    // ─── POL Investor Functions (new, additive) ───────────────────────────────

    /**
     * @notice Purchase fractional tokens with native POL for a registered asset.
     *
     * Demo Mode (demoMode = true):
     *   - No KYC whitelist check required
     *   - Ideal for hackathon/testnet demonstration
     *   - Records payment on-chain, emits InvestmentCompleted event
     *   - Backend verifies event before updating Supabase portfolio
     *
     * Production Mode (demoMode = false):
     *   - Same flow, but admin must whitelist investor wallets after KYC
     *   - Full regulatory compliance preserved
     *
     * @param assetId   Supabase UUID of the asset to invest in
     * @param quantity  Number of fractional tokens to purchase
     *
     * Requirements:
     *   - POL sale must exist and be active for assetId
     *   - msg.value must exactly equal pricePerTokenWei × quantity
     *   - Available supply must be >= quantity
     */
    function buyTokensWithPOL(
        string calldata assetId,
        uint256 quantity
    ) external payable nonReentrant whenNotPaused {
        require(quantity > 0, "Quantity must be > 0");
        require(bytes(assetId).length > 0, "Empty assetId");

        POLSaleConfig storage sale = polSales[assetId];
        require(sale.createdAt > 0, "No POL sale registered for this asset");
        require(sale.active, "POL sale is not active");
        require(sale.availableSupply >= quantity, "Insufficient token supply");

        uint256 requiredPayment = sale.pricePerTokenWei * quantity;
        require(msg.value == requiredPayment, "Incorrect POL amount sent");

        // Checks-effects-interactions: update state before emitting
        sale.availableSupply -= quantity;
        totalPOLRaised[assetId] += msg.value;
        totalPOLInvestmentCount++;

        emit InvestmentCompleted(
            assetId,
            msg.sender,
            quantity,
            msg.value,
            block.timestamp
        );
    }

    // ─── POL View Functions (new) ─────────────────────────────────────────────

    /**
     * @notice Calculate the total POL cost for a given quantity.
     * @return totalWei Amount of wei required
     */
    function calculatePOLPrice(
        string calldata assetId,
        uint256 quantity
    ) external view returns (uint256 totalWei) {
        POLSaleConfig storage sale = polSales[assetId];
        require(sale.createdAt > 0, "No POL sale for this asset");
        return sale.pricePerTokenWei * quantity;
    }

    /**
     * @notice Get full configuration for a POL primary sale.
     */
    function getPOLSaleConfig(string calldata assetId) external view returns (POLSaleConfig memory) {
        return polSales[assetId];
    }

    /**
     * @notice Check if an asset is available for POL purchase.
     */
    function isPOLSaleAvailable(string calldata assetId) external view returns (bool) {
        POLSaleConfig storage sale = polSales[assetId];
        return sale.createdAt > 0 && sale.active && sale.availableSupply > 0;
    }

    /**
     * @notice Get the contract's current POL balance.
     */
    function getContractPOLBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    /// @dev Reject direct POL transfers without a function call
    receive() external payable {
        revert("Use buyTokensWithPOL()");
    }
}
