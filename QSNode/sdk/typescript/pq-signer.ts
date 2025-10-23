/**
 * @qsmart/pq-signer
 * 
 * TypeScript SDK for signing Quantum-EVM (EIP-2718 type 0x79) transactions
 * with post-quantum cryptography (Dilithium2).
 * 
 * Usage:
 *   const signer = new PQSigner(dilithium2PrivateKey);
 *   const tx = { chainId: 9357, nonce: 0, ... };
 *   const signedTx = await signer.signTransaction(tx);
 */

import { keccak256 as ethersKeccak256, RLP } from "ethers";

// Types for PQ transaction
export interface PQTransactionRequest {
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gas: number;
  to?: string; // Recipient address
  value: bigint;
  data?: string; // Hex-encoded data
  accessList?: AccessTuple[];
}

export interface AccessTuple {
  address: string;
  storageKeys: string[];
}

export interface PQSignedTransaction {
  type: 0x79;
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gas: number;
  to?: string;
  value: bigint;
  data?: string;
  accessList?: AccessTuple[];
  pqSigAlgo: number; // 0x01 = Dilithium2
  pqPublicKey: Uint8Array;
  pqSignature: Uint8Array;
  from: string; // Derived address
  hash: string; // Tx hash
}

/**
 * PQSigner handles post-quantum transaction signing with Dilithium2
 */
export class PQSigner {
  private algorithm: string;
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;
  private address: string;

  constructor(
    algorithm: string = "dilithium2",
    privateKey: Uint8Array,
    publicKey: Uint8Array
  ) {
    if (algorithm !== "dilithium2" && algorithm !== "dilithium3") {
      throw new Error(`Unsupported PQ algorithm: ${algorithm}`);
    }

    this.algorithm = algorithm;
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.address = this.deriveAddress();
  }

  /**
   * Derives the Ethereum-style address from the PQ public key
   * address = last 20 bytes of keccak256(pubkey)
   */
  private deriveAddress(): string {
    const hash = ethersKeccak256(this.publicKey);
    // Take last 20 bytes (40 hex chars) as address
    return "0x" + hash.slice(-40).toLowerCase();
  }

  /**
   * Gets the signer's address
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Gets the PQ public key
   */
  getPublicKey(): Uint8Array {
    return this.publicKey;
  }

  /**
   * Computes the signing hash for a transaction
   * This is the data that will be signed with Dilithium2
   */
  private computeSigningHash(tx: PQTransactionRequest): Uint8Array {
    // Prepare data to be signed: exclude signature fields
    const sighashParts = [
      tx.chainId,
      tx.nonce,
      tx.maxPriorityFeePerGas.toString(16),
      tx.maxFeePerGas.toString(16),
      tx.gas,
      tx.to || "0x",
      tx.value.toString(16),
      tx.data || "0x",
      tx.accessList || [],
      0x01, // pqSigAlgo (Dilithium2)
      Array.from(this.publicKey), // pqPublicKey
    ];

    // Encode to RLP
    const encoded = RLP.encode(sighashParts);

    // Hash with Keccak256
    const hash = ethersKeccak256(encoded);

    // Convert hex string to Uint8Array
    const hashStr = hash.slice(2); // Remove '0x'
    const bytes = new Uint8Array(hashStr.length / 2);
    for (let i = 0; i < hashStr.length; i += 2) {
      bytes[i / 2] = parseInt(hashStr.substr(i, 2), 16);
    }

    return bytes;
  }

  /**
   * Signs a transaction with Dilithium2
   * In production, this uses the actual Dilithium2 library from @qsmart/pq-crypto
   */
  async signTransaction(tx: PQTransactionRequest): Promise<PQSignedTransaction> {
    const signingHash = this.computeSigningHash(tx);

    // TODO: Replace with actual Dilithium2 signing from @qsmart/pq-crypto
    // const signature = await dilithium.sign(this.privateKey, signingHash);

    // Placeholder: create a mock signature for demonstration
    // In production: use actual Dilithium2 signing library
    const signature = this.createMockSignature(signingHash);

    // Compute transaction hash
    const txHash = this.computeTransactionHash(tx, signature);

    return {
      type: 0x79,
      chainId: tx.chainId,
      nonce: tx.nonce,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      maxFeePerGas: tx.maxFeePerGas,
      gas: tx.gas,
      to: tx.to,
      value: tx.value,
      data: tx.data,
      accessList: tx.accessList,
      pqSigAlgo: 0x01, // Dilithium2
      pqPublicKey: this.publicKey,
      pqSignature: signature,
      from: this.address,
      hash: txHash,
    };
  }

  /**
   * Creates a mock Dilithium2 signature for demonstration
   * In production, this is replaced by actual cryptographic signing
   */
  private createMockSignature(data: Uint8Array): Uint8Array {
    // Dilithium2 signatures are typically ~2.7-3.0 KB
    const mockSize = 2800;
    const signature = new Uint8Array(mockSize);

    // Fill with deterministic but non-trivial data
    for (let i = 0; i < mockSize; i++) {
      signature[i] = (data[i % data.length] + i) % 256;
    }

    return signature;
  }

  /**
   * Computes the transaction hash
   */
  private computeTransactionHash(
    tx: PQTransactionRequest,
    signature: Uint8Array
  ): string {
    // Encode the full signed transaction
    const txData = [
      tx.chainId,
      tx.nonce,
      tx.maxPriorityFeePerGas.toString(16),
      tx.maxFeePerGas.toString(16),
      tx.gas,
      tx.to || "0x",
      tx.value.toString(16),
      tx.data || "0x",
      tx.accessList || [],
      0x01, // pqSigAlgo
      Array.from(this.publicKey),
      Array.from(signature),
    ];

    // Encode to RLP with type prefix
    const encoded = RLP.encode(txData);
    const txBytes = new Uint8Array(1 + encoded.length);
    txBytes[0] = 0x79; // Type 0x79
    txBytes.set(new Uint8Array(encoded), 1);

    // Hash the result
    const hash = ethersKeccak256(txBytes);
    return hash;
  }
}

/**
 * Generates a new Dilithium2 keypair
 * In production, this uses the actual Dilithium2 library
 */
export async function generateKeyPair(): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  // TODO: Replace with actual Dilithium2 key generation from @qsmart/pq-crypto
  // const { pk, sk } = await dilithium.generateKeyPair();

  // Placeholder: generate mock keys
  const pubKey = new Uint8Array(1184); // Dilithium2 pubkey ~1184 bytes
  const privKey = new Uint8Array(2400); // Dilithium2 privkey ~2400 bytes

  // Fill with random-like data
  crypto.getRandomValues(pubKey);
  crypto.getRandomValues(privKey);

  return {
    publicKey: pubKey,
    privateKey: privKey,
  };
}

/**
 * Verifies a PQ transaction signature (for validation)
 */
export function verifyPQTransaction(tx: PQSignedTransaction): boolean {
  if (!tx.pqPublicKey || tx.pqPublicKey.length === 0) {
    console.error("Public key is empty");
    return false;
  }

  if (!tx.pqSignature || tx.pqSignature.length === 0) {
    console.error("Signature is empty");
    return false;
  }

  if (tx.pqSigAlgo !== 0x01) {
    console.error(`Unsupported signature algorithm: ${tx.pqSigAlgo}`);
    return false;
  }

  // TODO: Actual verification with Dilithium2
  // return await dilithium.verify(tx.pqPublicKey, signingHash, tx.pqSignature);

  console.log("[PQSigner] Verifying PQ transaction");
  console.log(`  Public key size: ${tx.pqPublicKey.length} bytes`);
  console.log(`  Signature size: ${tx.pqSignature.length} bytes`);
  console.log(`  Algorithm: Dilithium2 (${tx.pqSigAlgo})`);

  // Placeholder: accept for now
  return tx.pqSignature.length > 100;
}

/**
 * Encodes a signed PQ transaction to 0x-prefixed hex string
 */
export function encodeSignedTransaction(tx: PQSignedTransaction): string {
  const txData = [
    tx.chainId,
    tx.nonce,
    tx.maxPriorityFeePerGas.toString(16),
    tx.maxFeePerGas.toString(16),
    tx.gas,
    tx.to || "0x",
    tx.value.toString(16),
    tx.data || "0x",
    tx.accessList || [],
    tx.pqSigAlgo,
    Array.from(tx.pqPublicKey),
    Array.from(tx.pqSignature),
  ];

  const encoded = RLP.encode(txData);
  const bytes = new Uint8Array(1 + encoded.length);
  bytes[0] = 0x79; // Type
  bytes.set(new Uint8Array(encoded), 1);

  // Convert to hex string
  let hexStr = "0x";
  for (const byte of bytes) {
    hexStr += byte.toString(16).padStart(2, "0");
  }

  return hexStr;
}

export default PQSigner;
