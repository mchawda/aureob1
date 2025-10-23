Quantum Settlement Node

0) Scope (thin-slice MVP)

Deliver a regulated, 24/7 settlement rail for USD stable bank-money on your quantum chain (qsmart) with:
	•	Custodial fiat-backed token (USDx) with compliance hooks
	•	Mint/Redeem from/to fiat escrow
	•	Transfers between allow-listed counterparties
	•	Proof-of-Reserves Oracle (escrow → on-chain attestations)
	•	Observer node for regulator read-only access
	•	Settlement API (REST/gRPC) + webhooks + idempotency
	•	PQ cryptography for validator/auth signatures
	•	Dual-control ops + rate limits + pause

⸻

1) Repo layout
```
qsettlement/
  contracts/
    FiatToken.sol
    ComplianceGate.sol
    FeeRouter.sol
    ReserveRegistry.sol
    libraries/SafeDecimalMath.sol
    test/ (unit + invariant/fuzz)
  chain/
    config/validators.yaml
    pqcrypto/ (dilithium, kyber bindings)
  services/
    api/            # REST/gRPC gateway
    minting/        # mint/burn orchestrator
    rails/          # ACH/SEPA/SWIFT adapters
    kyc/            # KYC/AML + allow/block-lists
    oracle/         # proof-of-reserves attestor
    observer/       # regulator node + dashboards
  sdk/
    typescript/     # client SDK
    python/
  infra/
    docker-compose.yml
    k8s/            # manifests for prod
    ansible/        # HSM/MPC provisioning (optional)
  ops/
    runbooks/
    controls/       # policies: dual control, limits, approvals
  .github/workflows/ci.yml
  Makefile
  README.md
```

2) Chain & Crypto

2.1 Validator topology (MVP)
	•	3–5 validators: Bank, Partner Bank, Auditor, (optional) Notary.
	•	Finality target < 1s (deterministic commit); block times ~500–800ms.
	•	Keys
	•	Tx/Auth: CRYSTALS-Dilithium2 (or 3 for margin) for account signatures.
	•	Session/Transport: Kyber768 (KEM) for p2p secure channels.
	•	Backward-compat: keep an ECDSA admission path behind feature flag for interop tests.

2.2 Node config (snippet)
```
# chain/config/validators.yaml
validators:
  - name: bank
    stake: 1_000_000
    pq_signing: dilithium2
    pq_kem: kyber768
  - name: partner_bank
    stake: 1_000_000
    pq_signing: dilithium2
    pq_kem: kyber768
  - name: auditor
    stake: 500_000
    pq_signing: dilithium2
network:
  block_time_ms: 600
  finality: instant
  gas_schedule: conservative
```

3) Smart Contracts (Solidity-style interfaces)

If qsmart isn’t EVM, keep the ABI shapes identical and map to your VM.

3.1 FiatToken.sol (bank-money token with compliance hooks)
```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IComplianceGate {
  function preTransferCheck(address from, address to, uint256 amount, bytes calldata trMeta)
    external view returns (bool allowed, uint256 code);
}

interface IFeeRouter {
  function onTransfer(address asset, address from, address to, uint256 amount)
    external returns (uint256 feeAmount);
}

interface IFiatToken {
  event Mint(address indexed to, uint256 amount, bytes32 offchainRef);
  event Burn(address indexed from, uint256 amount, bytes32 offchainRef);
  event Paused(address by);
  event Unpaused(address by);

  function mint(address to, uint256 amount, bytes32 offchainRef) external;
  function burn(address from, uint256 amount, bytes32 offchainRef) external;

  function transfer(address to, uint256 amount) external returns (bool);
  function transferWithMeta(address to, uint256 amount, bytes calldata trMeta) external returns (bool);

  function permit( /* EIP-2612 compatible fields */ ) external;

  function pause() external;
  function unpause() external;

  // roles: MINTER, BURNER, PAUSER, COMPLIANCE_ADMIN
  function setComplianceGate(address gate) external;
  function setFeeRouter(address router) external;
}
```

Rules
	•	transfer/transferWithMeta must call preTransferCheck (allow-list + Travel Rule metadata).
	•	mint/burn only by roles (enforced via multi-sig/2-of-N).
	•	FeeRouter applies bps and routes to treasury.

3.2 ComplianceGate.sol
```
pragma solidity ^0.8.20;

struct Rule {
  uint256 maxPerTx;
  uint256 maxDaily;
  bool    kycRequired;
  bool    travelRuleRequired;
  uint8   geoRegion; // 0 any; else enum
}

interface IComplianceGate {
  function setAllow(address who, bool allowed) external;
  function setBlock(address who, bool blocked) external;
  function setRule(bytes32 ruleId, Rule calldata r) external;

  function preTransferCheck(address from, address to, uint256 amount, bytes calldata trMeta)
    external view returns (bool, uint256);
}
```

Return codes (examples): 0=ok, 10=senderNotAllowed, 11=receiverNotAllowed, 20=travelRuleMissing, 30=limitExceeded.

3.3 ReserveRegistry.sol (proof-of-reserves hashes)
```
pragma solidity ^0.8.20;

struct ReserveAttestation {
  bytes32 asset;     // "USD"
  uint256 amount;    // cents
  bytes32 merkleRoot;
  uint64  timestamp;
  bytes   auditorSig; // auditor PQ or ECDSA signature
}

interface IReserveRegistry {
  event Attested(bytes32 indexed asset, uint64 timestamp, bytes32 root, uint256 amount);

  function attest(ReserveAttestation calldata a) external;
  function latest(bytes32 asset) external view returns (ReserveAttestation memory);
}
```
3.4 FeeRouter.sol
```
pragma solidity ^0.8.20;

interface IFeeRouter {
  function setFeeBps(uint16 bps) external;       // 10–30 bps typical
  function setSinks(address treasury, address ops) external;
  function onTransfer(address asset, address from, address to, uint256 amount)
    external returns (uint256 feeAmount);
}
```

4) State Machines

4.1 Mint
```
Fiat in escrow (rails) -> Core posts credit -> Minting Service builds MintOrder
-> Dual-approval (2-of-N) -> call FiatToken.mint(to, amt, offchainRef)
-> Event(Mint) -> API webhook -> Balance visible; Oracle includes in next attestation
```

4.2 Redeem
```
User requests redeem -> BurnOrder created -> 2-of-N
```

