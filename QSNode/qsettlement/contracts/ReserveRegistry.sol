// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReserveRegistry {
    address public owner;
    address public oracle;
    
    // Reserve data structure
    struct ReserveData {
        uint256 totalReserves;           // Total fiat reserves
        uint256 tokenSupply;            // Total token supply
        uint256 lastAttestationTime;    // Last attestation timestamp
        bytes32 merkleRoot;             // Merkle root of reserve proof
        bool isActive;                  // Reserve status
        string metadata;                // Additional metadata (JSON)
    }
    
    // Reserve tracking
    mapping(string => ReserveData) public reserves; // currency => ReserveData
    mapping(bytes32 => bool) public attestedRoots;   // merkleRoot => attested
    
    // Attestation events
    event ReserveAttested(string indexed currency, uint256 reserves, uint256 supply, bytes32 merkleRoot);
    event ReserveDeactivated(string indexed currency);
    event OracleUpdated(address indexed newOracle);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracle || msg.sender == owner, "only oracle");
        _;
    }
    
    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
    }
    
    function attestReserves(
        string calldata currency,
        uint256 totalReserves,
        uint256 tokenSupply,
        bytes32 merkleRoot,
        string calldata metadata
    ) external onlyOracle {
        require(totalReserves > 0, "reserves must be positive");
        require(tokenSupply > 0, "supply must be positive");
        require(!attestedRoots[merkleRoot], "root already attested");
        
        reserves[currency] = ReserveData({
            totalReserves: totalReserves,
            tokenSupply: tokenSupply,
            lastAttestationTime: block.timestamp,
            merkleRoot: merkleRoot,
            isActive: true,
            metadata: metadata
        });
        
        attestedRoots[merkleRoot] = true;
        
        emit ReserveAttested(currency, totalReserves, tokenSupply, merkleRoot);
    }
    
    function updateReserves(
        string calldata currency,
        uint256 totalReserves,
        uint256 tokenSupply,
        bytes32 merkleRoot,
        string calldata metadata
    ) external onlyOracle {
        require(reserves[currency].isActive, "reserve not active");
        require(totalReserves > 0, "reserves must be positive");
        require(tokenSupply > 0, "supply must be positive");
        require(!attestedRoots[merkleRoot], "root already attested");
        
        reserves[currency].totalReserves = totalReserves;
        reserves[currency].tokenSupply = tokenSupply;
        reserves[currency].lastAttestationTime = block.timestamp;
        reserves[currency].merkleRoot = merkleRoot;
        reserves[currency].metadata = metadata;
        
        attestedRoots[merkleRoot] = true;
        
        emit ReserveAttested(currency, totalReserves, tokenSupply, merkleRoot);
    }
    
    function deactivateReserve(string calldata currency) external onlyOracle {
        require(reserves[currency].isActive, "reserve not active");
        reserves[currency].isActive = false;
        emit ReserveDeactivated(currency);
    }
    
    function getReserveRatio(string calldata currency) external view returns (uint256 ratio) {
        ReserveData memory reserve = reserves[currency];
        if (reserve.tokenSupply == 0) return 0;
        return (reserve.totalReserves * 10000) / reserve.tokenSupply; // Returns ratio in basis points
    }
    
    function isReserveHealthy(string calldata currency) external view returns (bool) {
        ReserveData memory reserve = reserves[currency];
        if (!reserve.isActive) return false;
        
        // Check if attestation is recent (within 24 hours)
        if (block.timestamp - reserve.lastAttestationTime > 86400) return false;
        
        // Check if reserves are sufficient (at least 100% backing)
        if (reserve.totalReserves < reserve.tokenSupply) return false;
        
        return true;
    }
    
    function getReserveData(string calldata currency) external view returns (ReserveData memory) {
        return reserves[currency];
    }
    
    function verifyMerkleProof(
        string calldata currency,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool) {
        ReserveData memory reserve = reserves[currency];
        if (!reserve.isActive) return false;
        
        bytes32 currentHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (currentHash < proof[i]) {
                currentHash = keccak256(abi.encodePacked(currentHash, proof[i]));
            } else {
                currentHash = keccak256(abi.encodePacked(proof[i], currentHash));
            }
        }
        
        return currentHash == reserve.merkleRoot;
    }
    
    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }
    
    function getActiveCurrencies() external view returns (string[] memory) {
        // This would require storing active currencies in an array
        // For simplicity, returning empty array
        string[] memory currencies = new string[](0);
        return currencies;
    }
    
    function isAttestedRoot(bytes32 root) external view returns (bool) {
        return attestedRoots[root];
    }
}
