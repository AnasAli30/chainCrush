// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BoosterShop is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Booster types
    enum BoosterType {
        SHUFFLE,
        PARTY_POPPER
    }

    // Booster prices in ARB (0.1 ARB = 0.1 * 10^18 wei)
    mapping(BoosterType => uint256) public boosterPrices;
    
    // ARB token contract address
    IERC20 public arbToken;
    
    // Events
    event BoosterPurchased(
        uint256 indexed fid,
        BoosterType boosterType,
        uint256 quantity,
        uint256 totalCost,
        uint256 timestamp
    );

    constructor(address _arbToken) {
        arbToken = IERC20(_arbToken);
        
        // Set booster prices
        boosterPrices[BoosterType.SHUFFLE] = 0.2 ether; // 0.2 ARB
        boosterPrices[BoosterType.PARTY_POPPER] = 0.1 ether; // 0.1 ARB
    }

    /**
     * @dev Purchase boosters with ARB tokens
     * @param fid Farcaster ID of the buyer
     * @param boosterType Type of booster to purchase
     * @param quantity Number of boosters to purchase
     */
    function buyBoosters(
        uint256 fid,
        BoosterType boosterType,
        uint256 quantity
    ) external nonReentrant {
        require(quantity > 0, "Quantity must be greater than 0");
        require(fid > 0, "Invalid FID");
        
        uint256 pricePerBooster = boosterPrices[boosterType];
        uint256 totalCost = pricePerBooster * quantity;
        
        // Transfer ARB tokens from user to contract
        arbToken.safeTransferFrom(msg.sender, address(this), totalCost);
        
        // Emit event for frontend to track
        emit BoosterPurchased(fid, boosterType, quantity, totalCost, block.timestamp);
    }

    /**
     * @dev Update booster price (only owner)
     * @param boosterType Type of booster
     * @param newPrice New price in wei
     */
    function setBoosterPrice(BoosterType boosterType, uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        boosterPrices[boosterType] = newPrice;
    }

    /**
     * @dev Update ARB token address (only owner)
     * @param _newArbToken New ARB token address
     */
    function setArbToken(address _newArbToken) external onlyOwner {
        require(_newArbToken != address(0), "Invalid token address");
        arbToken = IERC20(_newArbToken);
    }

    /**
     * @dev Withdraw ARB tokens (only owner)
     * @param amount Amount to withdraw
     */
    function withdrawArb(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= arbToken.balanceOf(address(this)), "Insufficient balance");
        
        arbToken.safeTransfer(owner(), amount);
    }

    /**
     * @dev Get booster price
     * @param boosterType Type of booster
     * @return Price in wei
     */
    function getBoosterPrice(BoosterType boosterType) external view returns (uint256) {
        return boosterPrices[boosterType];
    }

    /**
     * @dev Calculate total cost for purchasing boosters
     * @param boosterType Type of booster
     * @param quantity Number of boosters
     * @return Total cost in wei
     */
    function calculateTotalCost(
        BoosterType boosterType,
        uint256 quantity
    ) external view returns (uint256) {
        return boosterPrices[boosterType] * quantity;
    }
}
