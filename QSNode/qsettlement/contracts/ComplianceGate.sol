// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ComplianceGate {
    address public owner;
    address public complianceOracle;
    
    // Compliance rules
    mapping(address => bool) public whitelistedAddresses;
    mapping(address => bool) public blacklistedAddresses;
    mapping(address => uint256) public dailyLimits;
    mapping(address => uint256) public transactionLimits;
    
    // Daily transaction tracking
    mapping(address => mapping(uint256 => uint256)) public dailyTransactions; // user => day => amount
    
    // Compliance events
    event AddressWhitelisted(address indexed account);
    event AddressBlacklisted(address indexed account);
    event DailyLimitSet(address indexed account, uint256 limit);
    event TransactionLimitSet(address indexed account, uint256 limit);
    event ComplianceViolation(address indexed from, address indexed to, uint256 amount, uint256 code);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == complianceOracle || msg.sender == owner, "only oracle");
        _;
    }
    
    constructor(address _complianceOracle) {
        owner = msg.sender;
        complianceOracle = _complianceOracle;
    }
    
    function preTransferCheck(address from, address to, uint256 amount, bytes calldata meta)
        external view returns (bool allowed, uint256 code) {
        
        // Check blacklist
        if (blacklistedAddresses[from] || blacklistedAddresses[to]) {
            return (false, 1001); // Blacklisted address
        }
        
        // Check transaction limits
        if (transactionLimits[from] > 0 && amount > transactionLimits[from]) {
            return (false, 1002); // Transaction limit exceeded
        }
        
        // Check daily limits
        uint256 today = block.timestamp / 86400; // Days since epoch
        uint256 dailySpent = dailyTransactions[from][today];
        if (dailyLimits[from] > 0 && dailySpent + amount > dailyLimits[from]) {
            return (false, 1003); // Daily limit exceeded
        }
        
        // Check whitelist (if enabled)
        if (whitelistedAddresses[from] || whitelistedAddresses[to]) {
            return (true, 0); // Whitelisted - always allowed
        }
        
        // Default allow for non-restricted addresses
        return (true, 0);
    }
    
    function executeTransfer(address from, address to, uint256 amount) external {
        // Update daily transaction tracking
        uint256 today = block.timestamp / 86400;
        dailyTransactions[from][today] += amount;
    }
    
    // Admin functions
    function whitelistAddress(address account) external onlyOracle {
        whitelistedAddresses[account] = true;
        emit AddressWhitelisted(account);
    }
    
    function blacklistAddress(address account) external onlyOracle {
        blacklistedAddresses[account] = true;
        emit AddressBlacklisted(account);
    }
    
    function removeFromWhitelist(address account) external onlyOracle {
        whitelistedAddresses[account] = false;
    }
    
    function removeFromBlacklist(address account) external onlyOracle {
        blacklistedAddresses[account] = false;
    }
    
    function setDailyLimit(address account, uint256 limit) external onlyOracle {
        dailyLimits[account] = limit;
        emit DailyLimitSet(account, limit);
    }
    
    function setTransactionLimit(address account, uint256 limit) external onlyOracle {
        transactionLimits[account] = limit;
        emit TransactionLimitSet(account, limit);
    }
    
    function setComplianceOracle(address _oracle) external onlyOwner {
        complianceOracle = _oracle;
    }
    
    function getDailySpent(address account) external view returns (uint256) {
        uint256 today = block.timestamp / 86400;
        return dailyTransactions[account][today];
    }
    
    function getRemainingDailyLimit(address account) external view returns (uint256) {
        uint256 today = block.timestamp / 86400;
        uint256 dailySpent = dailyTransactions[account][today];
        uint256 dailyLimit = dailyLimits[account];
        
        if (dailyLimit == 0) return type(uint256).max;
        if (dailySpent >= dailyLimit) return 0;
        
        return dailyLimit - dailySpent;
    }
}
