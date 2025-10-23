// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IComplianceGate {
    function preTransferCheck(address from, address to, uint256 amount, bytes calldata meta)
        external view returns (bool allowed, uint256 code);
}

interface IFeeRouter {
    function onTransfer(address asset, address from, address to, uint256 amount)
        external returns (uint256 feeAmount);
}

contract FiatToken {
    string public name = "USDx Token";
    string public symbol = "USDx";
    uint8 public decimals = 2;
    uint256 public totalSupply;
    bool public paused;

    address public minter;
    address public burner;
    address public pauser;
    address public complianceGate;
    address public feeRouter;

    mapping(address => uint256) public balanceOf;

    event Mint(address indexed to, uint256 amount, bytes32 offchainRef);
    event Burn(address indexed from, uint256 amount, bytes32 offchainRef);
    event Transfer(address indexed from, address indexed to, uint256 amount);

    modifier only(address role) {
        require(msg.sender == role, "unauthorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    constructor(address _minter, address _burner, address _pauser) {
        minter = _minter;
        burner = _burner;
        pauser = _pauser;
    }

    function setComplianceGate(address _complianceGate) external only(minter) {
        complianceGate = _complianceGate;
    }

    function setFeeRouter(address _feeRouter) external only(minter) {
        feeRouter = _feeRouter;
    }

    function pause() external only(pauser) {
        paused = true;
    }

    function unpause() external only(pauser) {
        paused = false;
    }

    function mint(address to, uint256 amount, bytes32 offchainRef) external only(minter) whenNotPaused {
        require(to != address(0), "mint to zero address");
        require(amount > 0, "mint amount zero");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount, offchainRef);
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount, bytes32 offchainRef) external only(burner) whenNotPaused {
        require(from != address(0), "burn from zero address");
        require(amount > 0, "burn amount zero");
        require(balanceOf[from] >= amount, "insufficient balance");
        
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Burn(from, amount, offchainRef);
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        require(to != address(0), "transfer to zero address");
        require(amount > 0, "transfer amount zero");
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        
        // Compliance check
        if (complianceGate != address(0)) {
            (bool allowed,) = IComplianceGate(complianceGate).preTransferCheck(msg.sender, to, amount, "");
            require(allowed, "compliance fail");
        }
        
        // Fee calculation
        uint256 feeAmount = 0;
        if (feeRouter != address(0)) {
            feeAmount = IFeeRouter(feeRouter).onTransfer(address(this), msg.sender, to, amount);
        }
        
        uint256 transferAmount = amount - feeAmount;
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += transferAmount;
        
        emit Transfer(msg.sender, to, transferAmount);
        return true;
    }

    function approve(address spender, uint256 amount) external whenNotPaused returns (bool) {
        require(spender != address(0), "approve to zero address");
        // Implementation for ERC20 approve
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        // Implementation for ERC20 allowance
        return 0;
    }
}
