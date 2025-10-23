// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FeeRouter {
    address public owner;
    address public treasury;
    
    // Fee structure
    uint256 public baseFeeRate = 10; // 0.1% (10 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Tiered fee structure
    mapping(uint256 => uint256) public tierFeeRates; // tier => fee rate
    mapping(address => uint256) public userTiers; // user => tier
    
    // Fee collection tracking
    mapping(address => uint256) public collectedFees; // asset => total collected
    mapping(address => mapping(address => uint256)) public userFeesPaid; // asset => user => fees paid
    
    // Events
    event FeeCollected(address indexed asset, address indexed from, address indexed to, uint256 amount, uint256 feeAmount);
    event FeeRateUpdated(uint256 newRate);
    event UserTierUpdated(address indexed user, uint256 tier);
    event TreasuryUpdated(address indexed newTreasury);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }
    
    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
        
        // Initialize tier fee rates
        tierFeeRates[0] = 5;   // VIP tier: 0.05%
        tierFeeRates[1] = 10;  // Standard tier: 0.1%
        tierFeeRates[2] = 25;  // Basic tier: 0.25%
        tierFeeRates[3] = 50;  // New user tier: 0.5%
    }
    
    function onTransfer(address asset, address from, address to, uint256 amount)
        external returns (uint256 feeAmount) {
        
        // Skip fee for treasury transfers
        if (from == treasury || to == treasury) {
            return 0;
        }
        
        // Calculate fee based on user tier
        uint256 feeRate = getUserFeeRate(from);
        feeAmount = (amount * feeRate) / FEE_DENOMINATOR;
        
        // Track fee collection
        if (feeAmount > 0) {
            collectedFees[asset] += feeAmount;
            userFeesPaid[asset][from] += feeAmount;
            
            emit FeeCollected(asset, from, to, amount, feeAmount);
        }
        
        return feeAmount;
    }
    
    function getUserFeeRate(address user) public view returns (uint256) {
        uint256 tier = userTiers[user];
        if (tierFeeRates[tier] > 0) {
            return tierFeeRates[tier];
        }
        return baseFeeRate;
    }
    
    function calculateFee(address user, uint256 amount) external view returns (uint256) {
        uint256 feeRate = getUserFeeRate(user);
        return (amount * feeRate) / FEE_DENOMINATOR;
    }
    
    // Admin functions
    function setBaseFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "fee rate too high"); // Max 10%
        baseFeeRate = newRate;
        emit FeeRateUpdated(newRate);
    }
    
    function setTierFeeRate(uint256 tier, uint256 rate) external onlyOwner {
        require(rate <= 1000, "fee rate too high"); // Max 10%
        tierFeeRates[tier] = rate;
    }
    
    function setUserTier(address user, uint256 tier) external onlyOwner {
        userTiers[user] = tier;
        emit UserTierUpdated(user, tier);
    }
    
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    function withdrawFees(address asset, uint256 amount) external onlyOwner {
        require(amount <= collectedFees[asset], "insufficient collected fees");
        collectedFees[asset] -= amount;
        
        // Transfer fees to treasury (implementation depends on asset type)
        // This would typically involve calling the asset contract's transfer function
    }
    
    function getCollectedFees(address asset) external view returns (uint256) {
        return collectedFees[asset];
    }
    
    function getUserFeesPaid(address asset, address user) external view returns (uint256) {
        return userFeesPaid[asset][user];
    }
    
    function getTotalFeesPaid(address user) external view returns (uint256 total) {
        // This would iterate through all assets to get total fees paid by user
        // For simplicity, returning 0 here
        return 0;
    }
}
