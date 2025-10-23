Quantum-EVM Adapter — Technical Blueprint

Run Solidity bytecode unchanged; validate blocks & (optionally) user ops with post-quantum (PQ) signatures.

⸻

0) Goals & non-goals

Goals
	•	Full EVM bytecode compatibility (Solidity/Hardhat/ABIs unchanged).
	•	JSON-RPC compatibility for common Ethereum tooling (eth_call, eth_sendRawTransaction, logs, traces).
	•	PQ-secure consensus: validators sign blocks & votes with Dilithium2 (or 3) + transport with Kyber768.
	•	Optional PQ user-level transactions via EIP-2718 typed envelopes or EIP-4337 AA.
	•	Clear migration path: start with PQ validators; keep ECDSA externally for wallets until PQ user flow is ready.

Non-goals
	•	Rewriting the EVM instruction set.
	•	Breaking Solidity toolchains.

⸻

1) High-level architecture
```
                +-------------------+
Solidity/ABIs ->|   EVM Execution   |<- State/Storage/Trie (keccak/RLP)
                +-------------------+
                         ^
                         |  (Tx → Message)
           +-----------------------------------+
           |           Tx Admission             |
           | (Decoders for secp256k1 / PQ)      |
           +-----------------------------------+
                         ^
                         |
           +-------------------------------+
           |   Consensus & Block Builder   |
           |  (PQ signatures on votes &    |
           |   headers; Kyber transport)   |
           +-------------------------------+
                         ^
                         |
           +-------------------------------+
           |   P2P / Networking (libp2p)   |
           |   PQ KEM (Kyber) sessions     |
           +-------------------------------+
```

Key idea: keep the EVM untouched; wrap it with:
	1.	a Tx Admission layer that accepts multiple signature types,
	2.	a Consensus layer that requires PQ signatures on blocks.

⸻

2) Data model extensions

2.1 Block header (add PQ commit)\
```
// block_header.proto
message BlockHeader {
  bytes  parent_hash   = 1;
  bytes  state_root    = 2;
  bytes  txs_root      = 3;
  bytes  receipts_root = 4;
  uint64 number        = 5;
  uint64 timestamp     = 6;
  bytes  miner         = 7; // validator address
  bytes  mix_hash      = 8; // unused; keep for compat
  uint64 base_fee      = 9; // EIP-1559
  // PQ fields
  bytes  pq_commit     = 10; // H(header_without_sig || consensus_round_meta)
  bytes  pq_sig        = 11; // Dilithium2 signature by proposer
  bytes  pq_agg_sig    = 12; // optional: aggregated committee sig (BLS-like API but PQ)
}
```

2.2 Typed transactions (EIP-2718 envelope)

We keep classic tx (type 0x00) and add type 0x79 for PQ:
```
0x79 || rlp(
  chainId,
  nonce,
  maxPriorityFeePerGas,
  maxFeePerGas,
  gasLimit,
  to,
  value,
  data,
  accessList,       // EIP-2930 optional
  pqSigAlgo,        // 0x01 = Dilithium2
  pqPubKey,         // bytes
  pqSignature       // bytes
)
```

Addresses for PQ txs are derived as:
```
address = last20bytes( keccak256( pqPubKey ) )
```

This keeps EVM state & ABIs unchanged.

Dual-mode accounts
	•	secp256k1 accounts continue to work.
	•	pq accounts are new; both share the same nonce & balance model.

⸻

3) Consensus with PQ signatures

Pick a Tendermint-style BFT or HotStuff-style protocol. Only the signature scheme is changed.

3.1 Proposer signing (Go pseudocode)
```
// pq_signer.go
func ProposerSignHeader(h *Header, sk []byte) ([]byte, error) {
    commit := HashHeaderSansSig(h) // keccak(RLP(header without pq fields))
    sig := dilithium.Sign(sk, commit)  // PQ signature
    h.PQCommit = commit
    h.PQSig = sig
    return sig, nil
}
```

3.2 Vote verification
```
func VerifyVote(v *Vote, pk []byte) error {
    msg := voteDigest(v) // round, height, blockID
    if !dilithium.Verify(pk, msg, v.PQSig) {
        return errors.New("invalid pq vote")
    }
    return nil
}
```

3.3 P2P transport (Kyber KEM)

On connection handshake:
```
// pq_handshake.go
func Handshake(conn net.Conn, myKEMSK []byte, myKEMPK []byte) SecureConn {
    peerPK := recvPeerKEMPK(conn)
    // derive shared secret
    ct, ss := kyber.Encapsulate(peerPK)
    sendCiphertext(conn, ct)
    // decrypt peer payload, derive session keys ...
    return SecureConn{conn, ss} // used for AEAD on all frames
}
```

4) Tx Admission Layer

4.1 Decoder selection
```
func DecodeTx(raw []byte) (Tx, error) {
    txType := raw[0]
    switch txType {
    case 0x00: return DecodeLegacySecpTx(raw[1:])
    case 0x01: return Decode1559SecpTx(raw[1:])
    case 0x79: return DecodePQTx(raw[1:])
    default:   return Tx{}, ErrUnknownType
    }
}
```

4.2 PQ transaction verification
```
func VerifyPQTx(tx PQTx) error {
    // 1) domain separation (EIP-155 style)
    digest := keccak256( RLP(tx.SighashParts()) )
    // 2) verify Dilithium2 signature over digest
    if !dilithium.Verify(tx.PQPubKey, digest, tx.PQSignature) {
        return ErrBadSig
    }
    // 3) derive address from pqPubKey and set tx.From
    tx.From = DerivePQAddress(tx.PQPubKey)
    // 4) nonce, balance, gas checks done normally
    return nil
}
```

Result: a normal Message is produced for the EVM:
{ From, To, Value, Gas, Data }

No change to the EVM execution engine.

⸻

5) Precompiles for PQ crypto (optional but useful)

Expose constant-address precompiles so Solidity can verify PQ proofs (e.g., custody flows, PoR attestations):

Precompile
Address
Function
PqVerify
0x0000000000000000000000000000000000000101
verifyDilithium(pub, msg, sig) -> bool
KyberEnc
0x0000000000000000000000000000000000000102
encapsulate(pub) -> (ct, ss)
KyberDec
0x0000000000000000000000000000000000000103
decapsulate(ct, sk) -> ss

Solidity interface
```
library PQ {
  function verify(bytes memory pub, bytes32 msgHash, bytes memory sig) internal view returns (bool) {
    bool ok;
    assembly {
      // staticcall precompile 0x101 with input ptr/len
      // return 0x01 on success
    }
    return ok;
  }
}
```

6) JSON-RPC compatibility layer

The node exposes standard RPC, with two additions:
	•	eth_sendRawTransaction accepts typed 0x79 payloads.
	•	eth_chainConfig returns:
```
	{
  "chainId": 9357,
  "txTypes": ["0x00", "0x01", "0x79"],
  "pq": { "txAlgo": "dilithium2", "consensusAlgo": "dilithium2", "kem": "kyber768" }
}
```

Tooling note: Hardhat/ethers can send 0x79 if you inject a custom signer that builds the envelope.

Tooling note: Hardhat/ethers can send 0x79 if you inject a custom signer that builds the envelope.

⸻

7) Wallet / SDK strategy (two tracks)

Track A — Immediate (no wallet changes)
	•	Keep user tx = secp256k1 (type 0x01).
	•	Only validators use PQ.
	•	You still claim “PQ finality” because blocks and consensus are PQ-signed.

Track B — PQ user tx (advanced)
	•	Provide a TypeScript signer that generates Dilithium2 keys and signs the 0x79 envelope.
	
```
	// pq-signer.ts
import { dilithium } from "@qsmart/pq";

export function buildPQTx(msg, pk, sk) {
  const digest = keccak256(rlpEncode(msg));
  const sig = dilithium.sign(sk, digest);
  return encodeType79Envelope(msg, pk, sig);
}
```
Alternative: adopt EIP-4337 Account Abstraction → wallets sign arbitrary data with PQ; a paymaster submits the bundle with ECDSA executor. Zero friction for dApps.

⸻

8) Addressing & replay protection
	•	Chain ID: use standard EIP-155 semantics inside the sighash for both secp & PQ txs.
	•	Address collisions: low probability; PQ addresses use keccak(pubkey) same as Ethereum.
	•	Replay: nonce + chainId prevent cross-chain replay.

⸻

9) Performance & sizing
	•	Dilithium2 sig ≈ 2.7–3.0 KB; pubkey ≈ 1.3 KB → larger tx size.
	•	Mitigations:
	•	Higher gas cost per byte of calldata to reflect bandwidth.
	•	Aggregation at consensus layer (optional pq_agg_sig) to keep headers small.
	•	Benchmarks to target:
	•	Proposer verification: < 0.2 ms / sig (native libs + AVX2).
	•	Network overhead: +10–15% vs secp-only.
10) Security model
	•	Keys in HSM or MPC-HSM for validator PQ signing.
	•	Key rotation: on-chain ValidatorRegistry with epoch-based PQ key rotations (slashing if double-sign).
	•	Dual-control for upgrades that touch Tx Admission or precompile tables.
	•	FIPS track: keep a build with NIST PQC libs only.

⸻

11) Minimal implementation plan (phased)

Phase 1 — PQ consensus only
	1.	Fork your current consensus (Tendermint/HotStuff).
	2.	Replace vote/header signing with Dilithium2.
	3.	Maintain ECDSA user tx.
	4.	Ship testnet; export pq fields in header.

Phase 2 — PQ transaction type 0x79
	1.	Implement Tx decoder & verifier for 0x79.
	2.	Add PQ address derivation.
	3.	Provide TS signer + Hardhat plugin.
	4.	Run mixed-mode mempool (0x01 + 0x79).

Phase 3 — Precompiles & AA
	1.	Add PQ precompiles.
	2.	Provide EIP-4337 bundler & paymaster for PQ wallets.
	3.	Migrate critical system contracts to verify PQ attestations on-chain.

⸻

12) Reference code snippets

12.1 Go — block header hashing sans PQ fields
```
func HashHeaderSansSig(h *Header) []byte {
    // clone without pq fields
    h2 := *h
    h2.PQCommit = nil
    h2.PQSig = nil
    h2.PQAggSig = nil
    enc := rlp.EncodeToBytes(h2)
    return crypto.Keccak256(enc)
}
```

12.2 Rust — Dilithium verify (pseudocode)
```
import { keccak256, RLP } from "ethers";
import { dilithium } from "@qsmart/pq";

export async function sendPQTx(provider, msg, pqKeys) {
  const digest = keccak256(RLP.encode(msg.sighashParts()));
  const sig = dilithium.sign(pqKeys.sk, Buffer.from(digest.slice(2), "hex"));
  const raw = encodeType79(msg, pqKeys.pk, sig);
  return provider.send("eth_sendRawTransaction", [ "0x79" + raw.toString("hex") ]);
}
```

12.3 TypeScript — Hardhat custom signer (PQ user tx)
```
import { keccak256, RLP } from "ethers";
import { dilithium } from "@qsmart/pq";

export async function sendPQTx(provider, msg, pqKeys) {
  const digest = keccak256(RLP.encode(msg.sighashParts()));
  const sig = dilithium.sign(pqKeys.sk, Buffer.from(digest.slice(2), "hex"));
  const raw = encodeType79(msg, pqKeys.pk, sig);
  return provider.send("eth_sendRawTransaction", [ "0x79" + raw.toString("hex") ]);
}
```

13) Node config (example)
```
# chain/config/quantum-evm.yaml
consensus:
  algo: hotstuff
  block_time_ms: 600
  finality: instant
  pq_signing: dilithium2
  kem: kyber768
mempool:
  permitted_tx_types: [0x00, 0x01, 0x79]
  max_tx_bytes: 2_000_000
evm:
  precompiles:
    - 0x000...101: PqVerify
    - 0x000...102: KyberEnc
    - 0x000...103: KyberDec
rpc:
  enable: [eth, net, web3, txpool]
  cors: ["*"]
```

14) Test plan
	•	Consensus tests: double-sign, byzantine validators, epoch rotations, PQ key invalidation.
	•	Tx tests:
	•	Legacy 0x01 tx works unchanged.
	•	PQ 0x79 tx: bad signature rejected, address derivation consistent, gas computed.
	•	Mixed mempool ordering stable.
	•	RPC tests: ethereum-json-tests + custom 0x79 vectors.
	•	Precompile tests: Solidity calls return expected booleans with edge cases.
	•	Benchmarks: TPS vs latency with 0x79 ratio 0–100%.

⸻

15) Rollout / migration
	1.	Testnet A — PQ validators only; legacy user tx.
	2.	Testnet B — enable 0x79; publish TS signer & example dapp.
	3.	Canary mainnet — governance vote to accept PQ tx after audit.
	4.	Wallet partnerships — add PQ plugin or 4337 paymaster flow.

16) What to build first (concrete tasks)
	•	Implement header PQ fields + signer/verify.
	•	Swap consensus vote signatures to Dilithium2.
	•	Add tx type 0x79 decoder/verifier + address derivation.
	•	Hardhat PQ signer package @qsmart/pq-signer.
	•	RPC method eth_chainConfig with PQ metadata.
	•	Optional PQ precompiles 0x101–0x103.
	•	Integration tests (mixed mempool) + perf harness.

⸻

TL;DR
	•	Keep the EVM as-is.
	•	Make consensus PQ-secure today.
	•	Introduce typed PQ user transactions tomorrow (0x79) without breaking wallets.
	•	Provide precompiles and/or AA for app-level PQ needs.
	