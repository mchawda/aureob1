# Quantum Settlement Node — Build Blueprint (Cursor Ready)

## Folder layout
qsettlement/
├── contracts/
│    ├── FiatToken.sol
│    ├── ComplianceGate.sol
│    ├── FeeRouter.sol
│    ├── ReserveRegistry.sol



├── services/








├── sdk/
│    └── index.ts



├── tests/
│    ├── contract-tests.ts
│    └── api-tests.http



```
---

## contracts/FiatToken.sol
```solidity
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
    string  public name     = "USDx Token";
    string  public symbol   = "USDx";
    uint8   public decimals = 2;
    uint256 public totalSupply;
    bool    public paused;

    address public minter;
    address public burner;
    address public pauser;
    address public complianceGate;
    address public feeRouter;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Mint(address indexed to, uint256 amount, bytes32 offchainRef);
    event Burn(address indexed from, uint256 amount, bytes32 offchainRef);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Paused(address by);
    event Unpaused(address by);

    modifier only(address role) {
        require(msg.sender == role, "unauthorized");
        _;
    }

    modifier notPaused() {
        require(!paused, "paused");
        _;
    }

    function setRoles(address _minter, address _burner, address _pauser) external {
        require(minter == address(0), "locked");
        minter = _minter;
        burner = _burner;
        pauser = _pauser;
    }

    function setComplianceGate(address _gate) external only(pauser) { complianceGate = _gate; }
    function setFeeRouter(address _router) external only(pauser) { feeRouter = _router; }

    function mint(address to, uint256 amount, bytes32 offchainRef) external only(minter) {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount, offchainRef);
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount, bytes32 offchainRef) external only(burner) {
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Burn(from, amount, offchainRef);
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external notPaused returns (bool) {
        return _transfer(msg.sender, to, amount, "");
    }

    function transferWithMeta(address to, uint256 amount, bytes calldata meta)
        external notPaused returns (bool)
    { return _transfer(msg.sender, to, amount, meta); }

    function _transfer(address from, address to, uint256 amount, bytes memory meta)
        internal returns (bool)
    {
        (bool allowed,) = IComplianceGate(complianceGate).preTransferCheck(from, to, amount, meta);
        require(allowed, "compliance fail");

        balanceOf[from] -= amount;
        uint256 fee = IFeeRouter(feeRouter).onTransfer(address(this), from, to, amount);
        uint256 sendAmount = amount - fee;
        balanceOf[to] += sendAmount;

        emit Transfer(from, to, sendAmount);
        return true;
    }

    function pause() external only(pauser) { paused = true; emit Paused(msg.sender); }
    function unpause() external only(pauser) { paused = false; emit Unpaused(msg.sender); }
}

```



```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ComplianceGate {
    struct Rule {
        uint256 maxPerTx;
        uint256 maxDaily;
        bool    kycRequired;
        bool    travelRuleRequired;
    }

    mapping(address => bool) public allow;
    mapping(address => bool) public blocklist;
    mapping(bytes32 => Rule) public rules;
    mapping(address => uint256) public spentToday;
    mapping(address => uint256) public lastDay;

    function setAllow(address who, bool allowed) external { allow[who] = allowed; }
    function setBlock(address who, bool blocked) external { blocklist[who] = blocked; }

    function preTransferCheck(address from, address to, uint256 amount, bytes calldata)
        external view returns (bool allowed, uint256 code)
    {
        if (blocklist[from] || blocklist[to]) return (false, 10);
        if (!allow[from] || !allow[to]) return (false, 11);
        if (amount > 10_000_000) return (false, 30); // simple hard cap example
        return (true, 0);
    }
}
```



```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FeeRouter {
    uint16 public feeBps = 20; // 0.20%
    address public treasury;

    event FeeTaken(address from, uint256 fee);

    constructor(address _treasury) { treasury = _treasury; }

    function setFeeBps(uint16 bps) external { feeBps = bps; }
    function setTreasury(address t) external { treasury = t; }

    function onTransfer(address, address from, address, uint256 amount)
        external returns (uint256 feeAmount)
    {
        feeAmount = amount * feeBps / 10_000;
        emit FeeTaken(from, feeAmount);
        return feeAmount;
    }
}
```



```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReserveRegistry {
    struct Attestation {
        bytes32 asset;     // e.g. "USD"
        uint256 amount;
        bytes32 merkleRoot;
        uint64  timestamp;
        bytes   auditorSig;
    }

    mapping(bytes32 => Attestation) public latest;

    event Attested(bytes32 indexed asset, uint256 amount, bytes32 root, uint64 ts);

    function attest(Attestation calldata a) external {
        latest[a.asset] = a;
        emit Attested(a.asset, a.amount, a.merkleRoot, a.timestamp);
    }

    function get(bytes32 asset) external view returns (Attestation memory) {
        return latest[asset];
    }
}
```



```
import express from "express";
import bodyParser from "body-parser";
import { v4 as uuid } from "uuid";

const app = express();
app.use(bodyParser.json());

// In-memory tx registry for idempotency
const seen = new Set<string>();

app.post("/v1/mint", (req, res) => {
  const { account, amount } = req.body;
  const key = uuid();
  if (seen.has(key)) return res.status(409).send({ error: "duplicate" });
  seen.add(key);
  console.log("MINT", account, amount);
  return res.json({ txid: key, status: "queued" });
});

app.post("/v1/transfer", (req, res) => {
  const { from, to, amount } = req.body;
  console.log("TRANSFER", from, to, amount);
  return res.json({ status: "ok" });
});

app.post("/v1/redeem", (req, res) => {
  const { account, amount } = req.body;
  console.log("REDEEM", account, amount);
  return res.json({ status: "ok" });
});

app.get("/v1/proofs/reserves", (_, res) => {
  res.json({ asset: "USD", amount: 1_000_000, merkleRoot: "0xabc123" });
});

app.listen(8080, () => console.log("Settlement API running on 8080"));

```



```
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FiatToken", function() {
  it("should mint and transfer respecting compliance", async function() {
    const [owner, user1, user2] = await ethers.getSigners();
    const Gate = await ethers.getContractFactory("ComplianceGate");
    const gate = await Gate.deploy();
    const Token = await ethers.getContractFactory("FiatToken");
    const token = await Token.deploy();

    await token.setRoles(owner.address, owner.address, owner.address);
    await gate.setAllow(user1.address, true);
    await gate.setAllow(user2.address, true);
    await token.setComplianceGate(gate.address);

    await token.mint(user1.address, 1000, ethers.encodeBytes32String("ref1"));
    await token.connect(user1).transfer(user2.address, 500);
    const bal = await token.balanceOf(user2.address);
    expect(bal).to.equal(500);
  });
});
```

Verification Checklist (to run after deployment)
Check
Command/Script
Expected Result
Contract unit tests
npx hardhat test
all pass
Reserve registry attestation
call attest() → get()
returns matching hash & amount
Compliance rule
send tx from non-allowed → revert
"compliance fail"
Fee routing
simulate transfer → event FeeTaken
fee = amount * feeBps / 10_000
API idempotency
POST /v1/mint twice same id
409 duplicate
Finality event stream
block height diff < 2
confirms <1s
Regulator observer node
subscribe to events
can read all attested data

---